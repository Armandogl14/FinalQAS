import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import keycloak from './keycloak';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

const AppWithKeycloak = () => {
    const [keycloakInitialized, setKeycloakInitialized] = useState(false);

    useEffect(() => {
        console.log('Starting Keycloak initialization...');
        keycloak.init({
            onLoad: 'login-required',
            checkLoginIframe: false,
            enableLogging: true,
            pkceMethod: 'S256' // Enable PKCE for public client
        }).then((authenticated) => {
            console.log('Keycloak initialized, authenticated:', authenticated);
            console.log('Token:', keycloak.token);
            console.log('ID Token:', keycloak.idToken);
            console.log('Refresh Token:', keycloak.refreshToken);
            setKeycloakInitialized(true);
        }).catch((error) => {
            console.error('Keycloak initialization failed:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            console.error('Response:', error.response ? error.response.data : 'No response data');
            setKeycloakInitialized(false);
        });
    }, []);

    if (!keycloakInitialized) {
        return <div>Inicializando sistema de autenticación...</div>;
    }

    return (
        <React.StrictMode>
            <App keycloak={keycloak} />
        </React.StrictMode>
    );
};

root.render(<AppWithKeycloak />);