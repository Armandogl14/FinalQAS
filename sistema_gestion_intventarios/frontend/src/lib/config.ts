export const config = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  KEYCLOAK_URL: process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8180',
  KEYCLOAK_REALM: 'inventario',
  KEYCLOAK_CLIENT_ID: 'inventory-app-public'
};
