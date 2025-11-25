import Keycloak from 'keycloak-js';
import config from './config';

const keycloak = new Keycloak({
    url: config.KEYCLOAK_URL,
    realm: 'inventory-realm',
    clientId: 'inventory-app-public'
});

export default keycloak;