const config = {
    API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
    KEYCLOAK_URL: process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8180'
};

export default config;