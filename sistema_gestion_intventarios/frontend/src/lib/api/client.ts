import { config } from '@/lib/config';

interface FetchOptions extends RequestInit {
  token?: string;
}

export const apiClient = {
  async request<T>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<T> {
    const { token, ...fetchOptions } = options;
    const headers = new Headers(fetchOptions.headers || {});

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${config.API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API Error: ${response.statusText}`);
    }

    return response.json();
  },

  get<T>(endpoint: string, token?: string) {
    return this.request<T>(endpoint, { method: 'GET', token });
  },

  post<T>(endpoint: string, data?: any, token?: string) {
    return this.request<T>(endpoint, {
      method: 'POST',
      token,
      body: JSON.stringify(data)
    });
  },

  put<T>(endpoint: string, data?: any, token?: string) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      token,
      body: JSON.stringify(data)
    });
  },

  delete<T>(endpoint: string, token?: string) {
    return this.request<T>(endpoint, { method: 'DELETE', token });
  }
};
