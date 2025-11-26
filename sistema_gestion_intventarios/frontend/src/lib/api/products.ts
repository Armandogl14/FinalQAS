import { apiClient } from './client';

export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  initialQuantity: number;
  minimumStock: number;
}

export interface CreateProductDto {
  name: string;
  description: string;
  category: string;
  price: number;
  initialQuantity: number;
  minimumStock: number;
}

export const productApi = {
  getAll(token?: string) {
    return apiClient.get<Product[]>('/api/v2/products', token);
  },

  getPublic() {
    return apiClient.get<Product[]>('/api/public/products');
  },

  create(data: CreateProductDto, token: string) {
    return apiClient.post<Product>('/api/v2/products', data, token);
  },

  update(id: number, data: Partial<CreateProductDto>, token: string) {
    return apiClient.put<Product>(`/api/v2/products/${id}`, data, token);
  },

  delete(id: number, token: string) {
    return apiClient.delete<void>(`/api/v2/products/${id}`, token);
  }
};
