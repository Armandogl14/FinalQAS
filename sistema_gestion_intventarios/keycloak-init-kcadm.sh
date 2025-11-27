#!/bin/bash
set -e

KCADM="/opt/keycloak/bin/kcadm.sh"
KC_URL="http://localhost:8080"

echo "Autenticando con Keycloak..."
$KCADM config credentials --server $KC_URL --realm master --user admin --password admin --client admin-cli

echo "Verificando si el realm existe..."
if $KCADM get realms --fields realm 2>/dev/null | grep -q "inventory-realm"; then
  echo "✓ El realm 'inventory-realm' ya existe"
else
  echo "Creando realm 'inventory-realm'..."
  $KCADM create realms -s realm=inventory-realm -s enabled=true -s displayName="Inventory Realm"
  echo "✓ Realm creado"
  
  echo "Creando cliente 'inventory-app-public'..."
  CLIENT_ID=$($KCADM create clients -r inventory-realm -s clientId=inventory-app-public -s 'name=Inventory App Public' -s publicClient=true -s enabled=true -s 'redirectUris=["http://localhost:3000/*"]' -s 'webOrigins=["http://localhost:3000"]' -i)
  echo "✓ Cliente creado: $CLIENT_ID"
  
  echo "Creando usuario 'testuser'..."
  $KCADM create users -r inventory-realm -s username=testuser -s email=testuser@example.com -s firstName=Test -s lastName=User -s enabled=true
  
  echo "Estableciendo contraseña para 'testuser'..."
  $KCADM set-password -r inventory-realm --username testuser --new-password testpass123 --permanent
  echo "✓ Usuario de prueba creado (testuser / testpass123)"
fi

echo "Configuración de Keycloak completada"
