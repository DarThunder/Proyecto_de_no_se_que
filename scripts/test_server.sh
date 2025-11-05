#!/bin/bash

AUTH_USER="superadmin"
AUTH_PASS="password123"

CASHIER_ID="690a11d6d778efd286ce5f47" 

BASE_URL="http://localhost:8080"
JSON_HEADER="Content-Type: application/json"

AUTH_TOKEN=""

echo "=== INICIANDO PRUEBAS DEL BACKEND CON JWT EN $BASE_URL ==="
echo ""

echo "--- FASE 1: Autenticación ---"

echo "[TEST] POST $BASE_URL/auth/login (Obteniendo token...)"
LOGIN_RESPONSE=$(curl -s -X POST -H "$JSON_HEADER" \
-d '{
    "username": "'$AUTH_USER'",
    "password": "'$AUTH_PASS'"
}' \
"$BASE_URL/auth/login")

echo "Respuesta de Login:"
echo $LOGIN_RESPONSE | jq .

AUTH_TOKEN=$(echo $LOGIN_RESPONSE | jq -r .token)

if [ "$AUTH_TOKEN" == "null" ] || [ -z "$AUTH_TOKEN" ]; then
    echo "🚨 ERROR: No se pudo obtener el token. Revise credenciales y JWT_SECRET. Abortando pruebas."
    exit 1
fi

echo "✅ TOKEN OBTENIDO: $AUTH_TOKEN"
echo ""

AUTH_HEADER="Authorization: Bearer $AUTH_TOKEN"

echo "--- FASE 2: Pruebas de Productos (Requiere Permiso 1 o 0) ---"

echo "[TEST] POST $BASE_URL/products (Creando producto...)"
PRODUCT_RESPONSE=$(curl -s -X POST -H "$JSON_HEADER" -H "$AUTH_HEADER" \
-d '{
    "name": "Camiseta de Prueba JWT",
    "base_price": 350.50,
    "description": "Camiseta creada por script de prueba con JWT",
    "size": "L",
    "sku": "prodsku4",
    "stock": 50
}' \
"$BASE_URL/products")

echo "Respuesta de Creación:"
echo $PRODUCT_RESPONSE | jq .
echo ""

NEW_VARIANT_ID=$(echo $PRODUCT_RESPONSE | jq -r .variant_id)

if [ "$NEW_VARIANT_ID" == "null" ] || [ -z "$NEW_VARIANT_ID" ]; then
    echo "🚨 ERROR: No se pudo crear el producto o extraer el variant_id. ¿Falla de autenticación/permisos? Abortando pruebas dependientes."
    exit 1
fi

echo "✅ Producto y Variante creados. ID de Variante: $NEW_VARIANT_ID"
echo ""

echo "[TEST] GET $BASE_URL/products (Listando todos los productos - Público si no lo protegiste)..."
curl -s -X GET "$BASE_URL/products" | jq .
echo ""

echo "[TEST] GET $BASE_URL/products/$NEW_VARIANT_ID (Obteniendo producto específico - Público)..."
curl -s -X GET "$BASE_URL/products/$NEW_VARIANT_ID" | jq .
echo ""

echo "--- FASE 3: Pruebas de Órdenes (Requiere Permiso 1 o 0) ---"

echo "[TEST] POST $BASE_URL/orders (Creando una nueva orden...)"
curl -s -X POST -H "$JSON_HEADER" -H "$AUTH_HEADER" \
-d '{
    "cashier": "'$CASHIER_ID'",
    "user": null,
    "transaction_type": "POS",
    "payment_method": "CASH",
    "items": [
        {
            "variant": "'$NEW_VARIANT_ID'",
            "quantity": 1,
            "unit_price": 350.50,
            "discount_rate": 0.0
        }
    ]
}' \
"$BASE_URL/orders" | jq .
echo ""

echo "=== PRUEBAS FINALIZADAS ==="