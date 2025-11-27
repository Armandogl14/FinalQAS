'use client';

import React from 'react';
import { Product } from '@/lib/api/products';
import { Edit2, Trash2, Plus, Package, AlertCircle, CheckCircle } from 'lucide-react';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: number) => void;
  onStock: (product: Product) => void;
  canEdit: boolean;
  loading?: boolean;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onEdit,
  onDelete,
  onStock,
  canEdit,
  loading = false
}) => {
  if (loading) {
    return (
      <>
        <style jsx>{`
          .loading-container {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 4rem 2rem;
          }

          .spinner {
            width: 56px;
            height: 56px;
            border: 4px solid #e0e7ff;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </>
    );
  }

  if (products.length === 0) {
    return (
      <>
        <style jsx>{`
          .empty-container {
            text-align: center;
            padding: 4rem 2rem;
          }

          .empty-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 1.5rem;
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .empty-text {
            font-size: 1.25rem;
            font-weight: 600;
            color: #64748b;
            margin: 0;
          }
        `}</style>
        <div className="empty-container">
          <div className="empty-icon">
            <Package size={40} color="#94a3b8" />
          </div>
          <p className="empty-text">No products found</p>
        </div>
      </>
    );
  }

  return (
    <>
      <style jsx>{`
        .table-wrapper {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .product-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          background: #ffffff;
        }

        .table-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .table-header th {
          padding: 1.25rem 1.5rem;
          text-align: left;
          font-size: 0.875rem;
          font-weight: 700;
          color: #ffffff;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 2px solid rgba(255, 255, 255, 0.2);
        }

        .table-header th:first-child {
          border-top-left-radius: 16px;
          padding-left: 2rem;
        }

        .table-header th:last-child {
          border-top-right-radius: 16px;
          padding-right: 2rem;
        }

        .table-row {
          background: #ffffff;
          border-bottom: 1px solid #f1f5f9;
          transition: all 0.2s ease;
        }

        .table-row:hover {
          background: linear-gradient(90deg, #f8fafc 0%, #ffffff 100%);
          transform: translateX(4px);
          box-shadow: -4px 0 0 0 #667eea;
        }

        .table-row:last-child {
          border-bottom: none;
        }

        .table-cell {
          padding: 1.5rem 1.5rem;
          font-size: 0.9375rem;
          color: #1e293b;
        }

        .table-row:first-child .table-cell:first-child {
          border-top-left-radius: 0;
        }

        .table-row:first-child .table-cell:last-child {
          border-top-right-radius: 0;
        }

        .cell-name {
          font-weight: 600;
          color: #0f172a;
          font-size: 1rem;
        }

        .cell-category {
          color: #64748b;
          font-weight: 500;
        }

        .cell-price {
          font-weight: 700;
          color: #059669;
          font-size: 1rem;
        }

        .cell-price::before {
          content: '$';
          font-size: 0.875rem;
          margin-right: 2px;
          opacity: 0.7;
        }

        .cell-stock {
          font-weight: 600;
          font-size: 1rem;
        }

        .cell-stock-high {
          color: #059669;
        }

        .cell-stock-zero {
          color: #dc2626;
        }

        .cell-stock-normal {
          color: #1e293b;
        }

        .cell-min-stock {
          color: #64748b;
          font-weight: 500;
        }

        .actions-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .action-btn {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          background: transparent;
        }

        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .action-btn-stock {
          color: #3b82f6;
        }

        .action-btn-stock:hover {
          background: #dbeafe;
        }

        .action-btn-edit {
          color: #10b981;
        }

        .action-btn-edit:hover {
          background: #d1fae5;
        }

        .action-btn-delete {
          color: #ef4444;
        }

        .action-btn-delete:hover {
          background: #fee2e2;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.8125rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .status-badge-out {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          color: #991b1b;
          border: 1px solid #fca5a5;
        }

        .status-badge-low {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          color: #92400e;
          border: 1px solid #fcd34d;
        }

        .status-badge-in {
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          color: #065f46;
          border: 1px solid #6ee7b7;
        }

        .status-icon {
          width: 14px;
          height: 14px;
        }

        @media (max-width: 768px) {
          .table-cell {
            padding: 1rem 0.75rem;
            font-size: 0.875rem;
          }

          .table-header th {
            padding: 1rem 0.75rem;
            font-size: 0.75rem;
          }

          .action-btn {
            width: 36px;
            height: 36px;
          }
        }
      `}</style>

      <div className="table-wrapper">
        <table className="product-table">
          <thead className="table-header">
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Min. Stock</th>
              <th>Status</th>
              {canEdit && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={product.id} className="table-row">
                <td className="table-cell cell-name">{product.name}</td>
                <td className="table-cell cell-category">{product.category}</td>
                <td className="table-cell cell-price">{product.price.toFixed(2)}</td>
                <td className={`table-cell cell-stock ${
                  product.initialQuantity === 0 
                    ? 'cell-stock-zero' 
                    : product.initialQuantity <= (product.minimumStock || 5)
                    ? 'cell-stock-normal'
                    : 'cell-stock-high'
                }`}>
                  {product.initialQuantity}
                </td>
                <td className="table-cell cell-min-stock">{product.minimumStock}</td>
                <td className="table-cell">
                  <StatusBadge quantity={product.initialQuantity} minimumStock={product.minimumStock} />
                </td>
                {canEdit && (
                  <td className="table-cell">
                    <div className="actions-container">
                      <button
                        onClick={() => onStock(product)}
                        title="Adjust Stock"
                        className="action-btn action-btn-stock"
                      >
                        <Plus size={18} />
                      </button>
                      <button
                        onClick={() => onEdit(product)}
                        title="Edit Product"
                        className="action-btn action-btn-edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => onDelete(product.id)}
                        title="Delete Product"
                        className="action-btn action-btn-delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

const StatusBadge: React.FC<{ quantity: number; minimumStock: number }> = ({ quantity, minimumStock }) => {
  if (quantity === 0) {
    return (
      <span className="status-badge status-badge-out">
        <AlertCircle className="status-icon" size={14} />
        Out of Stock
      </span>
    );
  }
  if (quantity <= minimumStock) {
    return (
      <span className="status-badge status-badge-low">
        <AlertCircle className="status-icon" size={14} />
        Low Stock
      </span>
    );
  }
  return (
    <span className="status-badge status-badge-in">
      <CheckCircle className="status-icon" size={14} />
      In Stock
    </span>
  );
};
