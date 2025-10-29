#!/bin/bash

PROJECT_NAME="RopaProject"
COMPOSE_FILE="docker-compose.yml"

echo "Iniciando la construcción y ejecución de contenedores para ${PROJECT_NAME}..."

echo "--- Deteniendo contenedores previos..."
docker-compose -f "$COMPOSE_FILE" down --remove-orphans

echo "--- Construyendo e iniciando servicios (Backend y DB)..."
docker-compose -f "$COMPOSE_FILE" up --build -d

if [ $? -ne 0 ]; then
    echo "ERROR: Docker Compose falló durante la construcción/inicio."
    exit 1
fi

echo ""
echo "--- Estado actual de los contenedores:"
docker-compose -f "$COMPOSE_FILE" ps

echo ""
echo "Entorno de desarrollo listo."
echo "Backend API (simulado): http://localhost:8080/products"

exit 0