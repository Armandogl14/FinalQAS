import { apiClient } from './client';

export type MovementType = 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'RETURN' | 'LOSS' | 'INITIAL';

export interface StockMovement {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  movementType: MovementType;
  reason: string;
  createdBy: string;
  createdAt: string;
}

export interface CreateMovementDto {
  productId: number;
  quantity: number;
  movementType: MovementType;
  reason: string;
}

export const stockApi = {
  updateStock(data: CreateMovementDto, token: string) {
    return apiClient.post<StockMovement>('/api/v2/stock/movement', data, token);
  },

  getRecentMovements(limit: number = 500, token?: string) {
    return apiClient.get<StockMovement[]>(`/api/v2/stock/recent?limit=${limit}`, token);
  },

  getMovementsByProduct(productId: number, token?: string) {
    return apiClient.get<StockMovement[]>(`/api/v2/stock/product/${productId}`, token);
  }
};
