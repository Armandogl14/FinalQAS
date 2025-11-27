'use client';

import { useEffect, useState } from 'react';
import { initKeycloak, getKeycloak, getUserRoles, getToken } from '@/lib/keycloak';

export const useAuth = () => {
  const [keycloak, setKeycloak] = useState<any>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [roles, setRoles] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const kc = await initKeycloak();
        
        if (kc) {
          // Si ya fue inicializado, no lo inicializar de nuevo
          if (kc.authenticated !== undefined) {
            setKeycloak(kc);
            setAuthenticated(kc.authenticated);
            if (kc.authenticated) {
              setToken(kc.token);
              setRoles(getUserRoles());
            }
            setLoading(false);
            return;
          }

          const auth = await kc.init({
            onLoad: 'check-sso',
            checkLoginIframe: false,
            enableLogging: true,
            pkceMethod: 'S256'
          });

          setKeycloak(kc);
          setAuthenticated(auth);
          
          if (auth) {
            setToken(kc.token);
            setRoles(getUserRoles());

            // Refresh token every 30 seconds
            const interval = setInterval(() => {
              kc.updateToken(30)
                .then((refreshed: boolean) => {
                  if (refreshed) {
                    setToken(kc.token);
                  }
                })
                .catch(() => kc.login());
            }, 30000);

            return () => clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('Failed to initialize Keycloak:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  return {
    keycloak,
    authenticated,
    loading,
    token,
    roles,
    login: () => keycloak?.login(),
    logout: () => keycloak?.logout()
  };
};
