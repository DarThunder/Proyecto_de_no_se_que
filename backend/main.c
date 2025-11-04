#include <libpq-fe.h>
#include <microhttpd.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define PORT 8080

#define DB_CONNECTION_STRING                                                   \
  "host=db port=5432 dbname=ropadb user=usuario_db password=tu_password"

typedef struct {
  PGconn *db_conn;
} ServerContext;

char *db_get_all_products(PGconn *conn);
char *db_get_product_by_id(PGconn *conn, int id);
char *db_create_product(PGconn *conn, const char *data);
char *db_authenticate_user(PGconn *conn, const char *data);
char *db_create_order(PGconn *conn, const char *data);

static enum MHD_Result
handle_request(void *cls, struct MHD_Connection *connection, const char *url,
               const char *method, const char *version, const char *upload_data,
               size_t *upload_data_size, void **con_cls) {

  ServerContext *context = (ServerContext *)cls;
  PGconn *conn = context->db_conn;

  char *response_body = NULL;
  struct MHD_Response *response;
  int ret;
  int status_code = MHD_HTTP_OK;

  if (strcmp(method, "GET") == 0 && strcmp(url, "/products") == 0) {
    // response_body = db_get_all_products(conn);
    response_body =
        strdup("["
               "{\"id\":1,\"nombre\":\"Camisa "
               "Blanca\",\"precio\":399.99,\"talla\":\"M\",\"stock\":20},"
               "{\"id\":2,\"nombre\":\"Jeans Slim "
               "Fit\",\"precio\":699.00,\"talla\":\"32\",\"stock\":15}"
               "]");
    status_code = MHD_HTTP_OK;
  }

  else if (strcmp(method, "GET") == 0 && strstr(url, "/products/") == url) {
    int product_id;
    if (sscanf(url, "/products/%d", &product_id) == 1) {
      // response_body = db_get_product_by_id(conn, product_id);
      if (product_id == 1) {
        response_body =
            strdup("{\"id\":1,\"nombre\":\"Camisa "
                   "Blanca\",\"precio\":399.99,\"talla\":\"M\",\"stock\":20}");
        status_code = MHD_HTTP_OK;
      } else {
        response_body = strdup("{\"error\":\"Producto no encontrado\"}");
        status_code = MHD_HTTP_NOT_FOUND;
      }
    }
  }

  else if (strcmp(method, "POST") == 0 && strcmp(url, "/products") == 0) {
    // response_body = db_create_product(conn, upload_data);
    response_body =
        strdup("{\"message\":\"Producto creado exitosamente\",\"id\":3}");
    status_code = MHD_HTTP_CREATED; // 201
  }

  else if (strcmp(method, "POST") == 0 && strcmp(url, "/auth/login") == 0) {
    // response_body = db_authenticate_user(conn, upload_data);
    response_body =
        strdup("{\"token\":\"abc123xyz456\",\"message\":\"Inicio de sesión "
               "exitoso\"}");
    status_code = MHD_HTTP_OK;
  }

  else if (strcmp(method, "POST") == 0 && strcmp(url, "/orders") == 0) {
    // response_body = db_create_order(conn, upload_data);
    response_body =
        strdup("{\"message\":\"Pedido creado. ID de la orden: 1001\"}");
    status_code = MHD_HTTP_CREATED; // 201
  }

  if (response_body != NULL) {
    response = MHD_create_response_from_buffer(
        strlen(response_body), (void *)response_body, MHD_RESPMEM_MUST_FREE);
    MHD_add_response_header(response, "Content-Type", "application/json");
    ret = MHD_queue_response(connection, status_code, response);
    MHD_destroy_response(response);
    return ret;
  }

  const char *not_found_msg = "{\"error\": \"Recurso no encontrado\"}";
  response = MHD_create_response_from_buffer(
      strlen(not_found_msg), (void *)not_found_msg, MHD_RESPMEM_PERSISTENT);
  MHD_add_response_header(response, "Content-Type", "application/json");
  ret = MHD_queue_response(connection, MHD_HTTP_NOT_FOUND, response);
  MHD_destroy_response(response);
  return ret;
}

int main() {
  struct MHD_Daemon *daemon;
  ServerContext context;

  context.db_conn = PQconnectdb(DB_CONNECTION_STRING);

  if (PQstatus(context.db_conn) != CONNECTION_OK) {
    fprintf(stderr, "Error al conectar a PostgreSQL: %s\n",
            PQerrorMessage(context.db_conn));
    PQfinish(context.db_conn);
    return 1;
  }
  printf("Conexión a PostgreSQL exitosa.\n");

  daemon = MHD_start_daemon(MHD_USE_INTERNAL_POLLING_THREAD, PORT, NULL, NULL,
                            &handle_request, &context, MHD_OPTION_END);

  if (NULL == daemon) {
    fprintf(stderr, "Error: no se pudo iniciar el servidor\n");
    PQfinish(context.db_conn);
    return 1;
  }

  printf("Servidor corriendo en http://localhost:%d\n", PORT);
  printf("Endpoints implementados: GET/POST /products, POST /auth/login, POST "
         "/orders\n");
  printf("Presiona Ctrl+C para detenerlo\n");

  while (1) {
    sleep(60);
  }
  MHD_stop_daemon(daemon);

  PQfinish(context.db_conn);

  return 0;
}

char *db_get_all_products(PGconn *conn) {
  // Ejemplo de cómo se vería la ejecución
  // PGresult *res = PQexec(conn, "SELECT id, nombre, precio, talla, stock FROM
  // products"); if (PQresultStatus(res) != PGRES_TUPLES_OK) { ... error
  // handling ... }
  return strdup("{\"error\":\"Función no implementada\"}");
}
char *db_get_product_by_id(PGconn *conn, int id) {
  // char query[256];
  // snprintf(query, sizeof(query), "SELECT ... FROM products WHERE id = %d",
  // id);
  return strdup("{\"error\":\"Función no implementada\"}");
}
char *db_create_product(PGconn *conn, const char *data) {
  return strdup("{\"error\":\"Función no implementada\"}");
}
char *db_authenticate_user(PGconn *conn, const char *data) {
  return strdup("{\"error\":\"Función no implementada\"}");
}
char *db_create_order(PGconn *conn, const char *data) {
  return strdup("{\"error\":\"Función no implementada\"}");
}
