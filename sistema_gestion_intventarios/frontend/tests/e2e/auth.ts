import { Page } from '@playwright/test';

// Helper to set E2E mock auth state in the app when NEXT_PUBLIC_E2E=true
export async function ensureE2EAuth(page: Page, role: 'admin' | 'employee' | 'guest' = 'admin') {
  // Inject a mock token and roles into window.__E2E_MOCK__
  await page.addInitScript(({ role }) => {
    // @ts-ignore
    (window as any).__E2E_MOCK__ = {
      authenticated: role !== 'guest',
      token: 'e2e-token',
      tokenParsed: { roles: role === 'admin' ? ['ROLE_ADMIN'] : role === 'employee' ? ['ROLE_EMPLOYEE'] : [] }
    };
  }, { role });
}
