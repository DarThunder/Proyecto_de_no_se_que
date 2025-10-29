$ProjectName = "RopaProject"
$ComposeFile = "docker-compose.yml"

Write-Host "Iniciando la construcción y ejecución de contenedores para $($ProjectName)..." -ForegroundColor Yellow

Write-Host "Deteniendo contenedores previos..." -ForegroundColor Cyan
docker-compose -f $ComposeFile down --remove-orphans

$Command = "docker-compose -f $ComposeFile up --build -d"
Write-Host "Ejecutando: $($Command)" -ForegroundColor Cyan
Invoke-Expression $Command

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker Compose falló durante la construcción/inicio." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Estado actual de los contenedores:" -ForegroundColor Green
docker-compose -f $ComposeFile ps

Write-Host ""
Write-Host "Entorno de desarrollo listo." -ForegroundColor Green
Write-Host "Backend API (simulado): http://localhost:8080/products" -ForegroundColor Green