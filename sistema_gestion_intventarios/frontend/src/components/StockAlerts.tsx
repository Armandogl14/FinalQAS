'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { Product } from '@/lib/api/products';

interface AlertsProps {
  products: Product[];
  onDismiss: (productId: number) => void;
  visible: boolean;
}

export const StockAlerts: React.FC<AlertsProps> = ({ products, onDismiss, visible }) => {
  if (!visible) return null;

  const lowStockProducts = products.filter(product => {
    const current = product.initialQuantity || 0;
    const minimum = product.minimumStock || 5;
    return current <= minimum && current > 0;
  });

  const outOfStockProducts = products.filter(product => (product.initialQuantity || 0) === 0);

  if (lowStockProducts.length === 0 && outOfStockProducts.length === 0) return null;

  return (
    <div className="space-y-3">
      {outOfStockProducts.map((product) => (
        <div key={`out-${product.id}`} className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-red-900">{product.name} - OUT OF STOCK</p>
            <p className="text-sm text-red-700 mt-1">No inventory available</p>
          </div>
          <button
            onClick={() => onDismiss(product.id)}
            className="flex-shrink-0 text-red-600 hover:text-red-700"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ))}

      {lowStockProducts.map((product) => (
        <div key={`low-${product.id}`} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-yellow-900">{product.name} - LOW STOCK</p>
            <p className="text-sm text-yellow-700 mt-1">
              Current: {product.initialQuantity} | Minimum: {product.minimumStock}
            </p>
          </div>
          <button
            onClick={() => onDismiss(product.id)}
            className="flex-shrink-0 text-yellow-600 hover:text-yellow-700"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ))}
    </div>
  );
};
