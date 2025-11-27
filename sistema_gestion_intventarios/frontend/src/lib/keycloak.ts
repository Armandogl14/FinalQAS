import { config } from './config';

let keycloakInstance: any = null;
let initializationPromise: Promise<any> | null = null;

export const initKeycloak = async () => {
  if (typeof window === 'undefined') return null;
  // E2E mode: return a lightweight mock Keycloak instance when NEXT_PUBLIC_E2E is enabled
  if (process.env.NEXT_PUBLIC_E2E === 'true') {
    // If the test harness injected a per-test mock via `window.__E2E_MOCK__`, use it.
    const win: any = (window as any) || {};
    const injected = win.__E2E_MOCK__;
    const roles = injected?.tokenParsed?.roles || ['ROLE_ADMIN'];
    keycloakInstance = {
      authenticated: injected?.authenticated ?? true,
      token: injected?.token || 'e2e-token',
      tokenParsed: { roles },
      init: async () => injected?.authenticated ?? true,
      login: async () => {},
      logout: async () => {},
      updateToken: async (_minValidity: number) => true
    } as any;
    return keycloakInstance;
  }
  
  // Si ya está inicializando, espera a que termine
  if (initializationPromise) {
    return initializationPromise;
  }

  // Si ya existe la instancia y fue inicializada, retórnala
  if (keycloakInstance && keycloakInstance.authenticated !== undefined) {
    return keycloakInstance;
  }

  initializationPromise = (async () => {
    try {
      const { default: Keycloak } = await import('keycloak-js');

      keycloakInstance = new Keycloak({
        url: config.KEYCLOAK_URL,
        realm: config.KEYCLOAK_REALM,
        clientId: config.KEYCLOAK_CLIENT_ID
      });

      return keycloakInstance;
    } finally {
      initializationPromise = null;
    }
  })();

  return initializationPromise;
};

export const getKeycloak = () => keycloakInstance;

export const isAuthenticated = () => {
  return keycloakInstance?.authenticated || false;
};

export const getToken = () => {
  return keycloakInstance?.token || null;
};

export const getUserRoles = () => {
  const parsed: any = keycloakInstance?.tokenParsed || {};
  const realmRoles: string[] = parsed?.realm_access?.roles || [];
  const clientId = config.KEYCLOAK_CLIENT_ID;
  const clientRoles: string[] = parsed?.resource_access?.[clientId]?.roles || [];
  const normalized = [...realmRoles, ...clientRoles].map((r: string) => `ROLE_${r.toUpperCase()}`);
  return {
    isAdmin: normalized.includes('ROLE_ADMIN'),
    isEmployee: normalized.includes('ROLE_EMPLOYEE'),
    isGuest: !normalized.includes('ROLE_ADMIN') && !normalized.includes('ROLE_EMPLOYEE'),
    roles: normalized
  };
};

export const login = () => {
  return keycloakInstance?.login();
};

export const logout = () => {
  return keycloakInstance?.logout();
};
