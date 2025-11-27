# Sistema de Gestión de Inventarios — Documentación

## Armando Gonzalez y Moises Rodriguez

## 1. Introducción

Este documento describe la arquitectura, seguridad, despliegue, observabilidad, pruebas (calidad, rendimiento y aceptación) y CI/CD del Sistema de Gestión de Inventarios. La implementación está alineada con los requisitos de calidad y operación habituales: seguridad, usabilidad, compatibilidad, regresión, estrés, aceptación (Cucumber), pruebas de navegadores (Playwright), pipeline CI/CD (GitHub Actions), contenedorización (Docker), migraciones (Flyway) y observabilidad (Prometheus/Grafana/Jaeger con OpenTelemetry).

## 2. Arquitectura Técnica

- Backend: Spring Boot 3 (Java 21), Postgres, JPA/Hibernate, Flyway, Micrometer/Actuator
- Autenticación/Autorización: Keycloak (realm `inventario`)
- Frontend: Next.js 16 (Turbopack) + Tailwind v3 + Playwright
- Observabilidad: OpenTelemetry (Java Agent) → Collector → Jaeger; Micrometer → Prometheus → Grafana
- Contenedores: Docker Compose con servicios para base de datos, autenticación, backend, frontend y monitoreo

Estructura principal:
- `sistema_gestion_intventarios/` (backend, compose, monitoring)
- `sistema_gestion_intventarios/frontend/` (aplicación Next.js)

## 3. Despliegue con Docker Compose

- Archivo: `sistema_gestion_intventarios/docker-compose.yml`
- Servicios principales:
  - `postgres_inventory`: Postgres con volumen persistente
  - `keycloak`: Keycloak con import automático del realm
  - `springboot_inventory` (`app`): servicio backend
  - `react_inventory` (`frontend`): aplicación web
  - `prometheus`, `grafana`: monitoreo de métricas
  - `otel-collector`, `jaeger`: trazas distribuidas
- Puertos relevantes:
  - Backend Actuator: `http://localhost:8080/actuator/*`
  - Frontend: `http://localhost:3000`
  - Prometheus: `http://localhost:9090`
  - Grafana: `http://localhost:3001`
  - Jaeger UI: `http://localhost:16686`
  - Postgres Exporter: `http://localhost:9187`

Comandos clave:
- Levantar stack: `docker compose up -d --build`
- Reiniciar servicio específico: `docker compose up -d --no-deps --build app` (o `frontend`)
- Limpiar estado (incluye BD): `docker compose down -v`

## 4. Seguridad

- Realm: `inventario` (importado automáticamente)
- Cliente web: `inventory-app-public` (OIDC público)
- Roles: `admin`, `employee` (realm roles)
- Usuario de prueba: `testuser/testpass123` (realm roles: `admin`)

Integración en backend:
- Issuer y JWKS configurados en:
  - `sistema_gestion_intventarios/src/main/resources/application.properties:18`
  - `sistema_gestion_intventarios/src/main/java/org/example/config/SecurityConfig.java:136–139`
- Mapeo de roles desde token (realm y client roles): `SecurityConfig.java:79–113`
- Endpoints públicos/protegidos: `sistema_gestion_intventarios/src/main/java/org/example/config/SecurityConfig.java:41–55`

Integración en frontend:
- Configuración Keycloak: `sistema_gestion_intventarios/frontend/src/lib/config.ts:1–6`
- Roles desde token (`realm_access`, `resource_access`): `frontend/src/lib/keycloak.ts:65–73`
- Comportamiento de login: `onLoad: 'check-sso'` en `frontend/src/hooks/useAuth.ts:33`

## 5. Base de Datos y Migraciones

- Flyway:
  - Activado, ubicaciones: `classpath:migration`
  - Baseline automático cuando el esquema existe: `baseline-on-migrate=true`
  - Configuración: `sistema_gestion_intventarios/src/main/resources/application.properties:12–15`
- Migraciones:
  - `V1__create_products_table.sql`: crea `products`
  - `V2__add_minimum_stock.sql`: agrega `minimum_stock` y valores

Recomendaciones:
- `spring.jpa.hibernate.ddl-auto=none` en producción, migraciones controladas
- Para reconstrucciones limpias (dev): `docker compose down -v` y levantar

## 6. Observabilidad

- Métricas (Micrometer/Actuator):
  - `http://localhost:8080/actuator/prometheus`
  - Métricas de negocio: `inventory_products_total`, `inventory_products_low_stock`, `inventory_products_out_of_stock`, `inventory_total_value`, `inventory_categories_total`, etc.
  - Definición: `sistema_gestion_intventarios/src/main/java/org/example/config/MetricsConfig.java:26–89`
- Tranzas (OpenTelemetry):
  - Java Agent adjunto en backend: `sistema_gestion_intventarios/Dockerfile:11`
  - Variables OTEL: `sistema_gestion_intventarios/docker-compose.yml:41–55`
  - Collector → Jaeger (OTLP gRPC 4317): `sistema_gestion_intventarios/monitoring/otel-collector-config.yaml:10–18`

Grafana:
- Dashboards aprovisionados:
  - `Inventory Overview`: `monitoring/grafana/provisioning/dashboards/inventory-overview.json`
  - `API Errors & Controller Latency`: `monitoring/grafana/provisioning/dashboards/api-errors-controller.json`
  - Proveedor: `monitoring/grafana/provisioning/dashboards/dashboard.yml`

Prometheus:
- Targets esperados: backend actuator y `postgres-exporter` (`docker-compose.yml`)

Jaeger:
- UI: `http://localhost:16686` → servicio `inventory-backend`
- Generar trazas (ejemplos): `GET /api/public/products`, `GET /api/v2/products`

## 7. Pruebas

Tipos y suites:
- Seguridad (MockMvc): `com.inventory.security.SecurityTest`
- Regresión (servicios y flujo): `com.inventory.regression.RegressionTest`
- Aceptación (Cucumber): features + runner `com.inventory.cucumber.runner.ApiTestRunner`
- Servicio (unitarias): `com.inventory.service.*`
- Estrés (JMeter programático): `com.inventory.stress.InventoryStressTest`
- Estrés concurrente (MockMvc): `com.inventory.stress.SimpleStressTest`
- Navegadores (Playwright): `frontend/tests/*.spec.js`

Ejecución (backend):
- Todo el backend: `./gradlew.bat test --info`
- Por clase: `./gradlew.bat test --tests com.inventory.security.SecurityTest --info`
- Por método: `./gradlew.bat test --tests "com.inventory.service.ProductServiceTest.productTotalValue_isCalculatedCorrectly" --info`
- JMeter CLI (si configurado): `./gradlew.bat jmeterTest --info`

Ejecución (frontend, headless):
- Instalar navegadores: `npx playwright install --with-deps`
- Ejecutar Playwright sin abrir ventanas: `npx playwright test -c playwright.config.ts --reporter=line`

Resultado típico (backend):
- Conteo actual aproximado: 66 pruebas, 100% verde (ver `build/reports/tests/test/index.html`)

## 8. CI/CD (GitHub Actions)

- Workflows:
  - Backend CI: build + test + artefactos (`.github/workflows/backend-ci.yml`)
  - Frontend CI: CRA tests + Playwright (`.github/workflows/frontend-ci.yml`)
  - Integración Compose (smoke): levantar stack y probar health (`.github/workflows/integration-compose.yml`)
  - Seguridad: Dependency-Check + Trivy (`.github/workflows/security.yml`)

Prácticas:
- Publicación de reportes (JUnit/Cucumber/Playwright)
- Matrix de navegadores en Playwright
- Escaneo de contenedores antes de publicar

## 9. Operación y Mantenimiento

- Monitoreo:
  - Prometheus: estado de targets y consultas básicas (PromQL)
  - Grafana: dashboards `Inventory System`
  - Jaeger: trazas de `inventory-backend`
- Mantenimiento:
  - Actualizaciones de dependencias (sugerido: Dependabot/Renovate)
  - Revisión periódica de vulnerabilidades (Dependency-Check/Trivy)
  - Ajuste de umbrales de alertas según métricas reales

## 10. Solución de Problemas

- `invalid_redirect_uri` en Keycloak:
  - Asegurar `redirectUris` y `webOrigins` del cliente `inventory-app-public` → `http://localhost:3000/*` y `http://localhost:3000`
  - Confirmar realm `inventario` importado correctamente
- Error Flyway “relation already exists”:
  - Usar `baseline-on-migrate=true` (ya configurado)
  - Para un entorno limpio, `docker compose down -v` y levantar
- El frontend redirige a Keycloak “page not found”:
  - `onLoad: 'check-sso'` y realm/cliente deben existir; revisar `keycloak` logs
- Trazas no visibles en Jaeger:
  - Verificar `-javaagent` activo, variables OTEL, Collector exportando a `jaeger:4317`, generar tráfico
- Playwright abre ventanas (local):
  - Asegurar `headless: true` o ejecutar en CI con Xvfb; comando sugerido: `npx playwright test -c playwright.config.ts`

## 11. Referencias de Código

- Roles desde token en backend: `sistema_gestion_intventarios/src/main/java/org/example/config/SecurityConfig.java:79–113`
- Issuer/JWKS backend: `sistema_gestion_intventarios/src/main/java/org/example/config/SecurityConfig.java:136–139`
- Configuración Flyway: `sistema_gestion_intventarios/src/main/resources/application.properties:12–15`
- Métricas de negocio: `sistema_gestion_intventarios/src/main/java/org/example/config/MetricsConfig.java:26–89`
- Dashboards Grafana: `sistema_gestion_intventarios/monitoring/grafana/provisioning/dashboards/*.json`
- Collector OTLP→Jaeger: `sistema_gestion_intventarios/monitoring/otel-collector-config.yaml:10–18`

# Documentación del Sistema de Gestión de Inventarios con QAS (Versión estructurada)

## Descripción General

- Objetivo: Desarrollar un sistema de gestión de inventarios para pequeñas empresas que implemente todas las etapas del ciclo de vida del aseguramiento de calidad de software (QAS).
- Características clave:
  - Gestión completa de productos (CRUD)
  - Control de stock básico
  - API RESTful para integración
  - Enfoque en calidad, seguridad y usabilidad

## Funcionalidades Principales

### 1. Gestión de Productos

| Funcionalidad       | Descripción                                                                 |
|---------------------|------------------------------------------------------------------------------|
| Agregar Producto    | Registrar nuevos productos con nombre, descripción, categoría, precio, stock |
| Editar Producto     | Modificar información de productos existentes                                 |
| Eliminar Producto   | Remover productos del inventario                                             |
| Visualizar Productos| Listado con búsqueda y filtrado por categoría                                |

### 2. API de Integración

- Endpoints principales (v2):
  - `POST /api/v2/products` — Crear producto
  - `GET /api/v2/products` — Listar productos
  - `PUT /api/v2/products/{id}` — Actualizar producto
  - `DELETE /api/v2/products/{id}` — Eliminar producto
- Endpoints públicos:
  - `GET /api/public/products` — Listado público (sin autenticación)

## Ciclo de Vida QAS Implementado

### 1. Planificación y Gestión

- Riesgos identificados:
  - Cambios en requisitos (Probabilidad: Media, Impacto: Alto)
    - Mitigación: reuniones semanales con stakeholders y trazabilidad en issues
  - Problemas de compatibilidad (Probabilidad: Baja, Impacto: Medio)
    - Mitigación: pruebas tempranas multi‑navegador con Playwright
  - Errores de despliegue (Probabilidad: Media, Impacto: Alto)
    - Mitigación: CI/CD con validaciones y smoke de Compose

### 2. Pruebas de Calidad

- Estrategia de pruebas: distribución combinada y automatizada
  - Unitarias (JUnit): servicios y lógica de negocio (`com.inventory.service.*`)
  - Integración/Aceptación (Cucumber): BDD sobre API (`com.inventory.cucumber.runner.ApiTestRunner`)
  - Seguridad (MockMvc): headers, CORS, autorización (`com.inventory.security.SecurityTest`)
  - Regresión: flujos CRUD, búsquedas, estadísticas (`com.inventory.regression.RegressionTest`)
  - Estrés: JMeter programático + concurrente (`com.inventory.stress.*`)
  - Navegadores: Playwright multi‑navegador

#### Detalle de Pruebas Automatizadas

- Configuración de Entorno de Pruebas
  - `sistema_gestion_intventarios/src/test/java/com/inventory/cucumber/config/CucumberSpringConfiguration.java:1`
  - `sistema_gestion_intventarios/src/test/java/com/inventory/cucumber/config/TestSecurityConfig.java:1`
  - Función: inicializa contexto Spring para Cucumber y desactiva filtros de seguridad en perfil `test`

- Ejecutor de Pruebas (Runner)
  - `sistema_gestion_intventarios/src/test/java/com/inventory/cucumber/runner/ApiTestRunner.java:7`
  - Plugins: HTML/JSON/JUnit → `target/cucumber-reports.*`

- Implementación de Pasos (Step Definitions)
  - `sistema_gestion_intventarios/src/test/java/com/inventory/cucumber/steps/ProductApiStepDefinitions.java:41`
  - Operaciones: Given (datos iniciales), When (GET/POST/PUT/DELETE), Then/And (status y contenido)

- Pruebas Unitarias con JUnit (Servicios)
  - `sistema_gestion_intventarios/src/test/java/com/inventory/service/ProductServiceTest.java:1`
  - Validaciones: precios, stock, cálculos (totalValue), CRUD y consultas

- Cobertura actual y conteo
  - Total backend: ~66 pruebas, 100% OK (ver `build/reports/tests/test/index.html`)

## CI/CD y Contenedorización

- Docker para empaquetado
- Flyway para migraciones controladas
- Pipeline GitHub Actions: backend, frontend, seguridad y smoke de integración

## Gestión de Calidad

- Tecnologías Implementadas
  - Backend: Spring Boot 3.5.2, Spring Security (JWT), Flyway, Micrometer
  - Frontend: Next.js 16, Tailwind v3, keycloak‑js, Playwright
  - Base de Datos: PostgreSQL
  - Pruebas: JUnit 5, Cucumber 7, JMeter
  - DevOps: Docker, GitHub Actions, Prometheus, Grafana, Jaeger, OpenTelemetry

## Conclusiones y Recomendaciones

- Conclusiones: requisitos cumplidos, cobertura de pruebas alineada, observabilidad activa
- Recomendaciones:
  1. Módulo avanzado de stock (reorden y alertas)
  2. Más escenarios de estrés y percentiles de latencia adicionales
  3. Extender dashboards (errores por endpoint y P99)

