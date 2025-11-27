#!/bin/sh

# Esperar a que Keycloak esté listo
sleep 20

# Obtener token de acceso
TOKEN=$(curl -s -X POST http://keycloak:8080/realms/master/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=admin-cli" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

echo "Token obtenido: ${TOKEN:0:20}..."

# Verificar si el realm ya existe
REALM_EXISTS=$(curl -s -X GET "http://keycloak:8080/admin/realms/inventario" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | grep -c "inventory-realm")

if [ $REALM_EXISTS -gt 0 ]; then
  echo "✓ El realm 'inventario' ya existe"
else
  echo "Creando realm 'inventario'..."
  
  # Crear el realm
  REALM_ID=$(curl -s -X POST "http://keycloak:8080/admin/realms" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "realm": "inventario",
      "enabled": true,
      "displayName": "Inventario",
      "accessTokenLifespan": 300,
      "refreshTokenLifespan": 1800
    }')
  
  echo "✓ Realm creado"
  
  # Crear cliente public
  echo "Creando cliente 'inventory-app-public'..."
  CLIENT_ID=$(curl -s -X POST "http://keycloak:8080/admin/realms/inventario/clients" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "clientId": "inventory-app-public",
      "name": "Inventory App Public",
      "public": true,
      "enabled": true,
      "redirectUris": [
        "http://localhost:3000/*"
      ],
      "webOrigins": [
        "http://localhost:3000"
      ],
      "protocolMappers": [
        {
          "name": "username",
          "protocol": "openid-connect",
          "protocolMapper": "oidc-usermodel-basic-mapper",
          "consentRequired": false,
          "config": {
            "claim.name": "preferred_username",
            "user.attribute": "username",
            "id.token.claim": "true",
            "access.token.claim": "true"
          }
        }
      ]
    }')
  
  echo "✓ Cliente creado"
  
  # Crear usuario de prueba
  echo "Creando usuario 'testuser'..."
  curl -s -X POST "http://keycloak:8080/admin/realms/inventario/users" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "username": "testuser",
      "email": "testuser@example.com",
      "firstName": "Test",
      "lastName": "User",
      "enabled": true,
      "credentials": [
        {
          "temporary": false,
          "type": "password",
          "value": "testpass123"
        }
      ]
    }'
  
  echo "✓ Usuario de prueba creado"
fi

echo "Configuración de Keycloak completada"
