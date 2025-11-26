'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { productApi, Product } from '@/lib/api/products';
import { StockModal } from '@/components/StockModal';
import { stockApi, MovementType } from '@/lib/api/stock';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import './stock-management.css';

export const dynamic = 'force-dynamic';

export default function StockManagementPage() {
  const { authenticated, token, roles, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();

  useEffect(() => {
    if (authenticated && token) {
      fetchProducts();
    }
  }, [authenticated, token]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await productApi.getAll(token || undefined);
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async (movementType: MovementType, quantity: number, reason: string) => {
    if (!token || !selectedProduct) {
      setError('You must be logged in');
      return;
    }

    try {
      await stockApi.updateStock(
        {
          productId: selectedProduct.id,
          quantity,
          movementType,
          reason
        },
        token
      );
      setSuccessMessage('Stock updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      setIsStockModalOpen(false);
      fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stock');
    }
  };

  const lowStockProducts = products.filter(p => {
    const current = p.initialQuantity || 0;
    const minimum = p.minimumStock || 5;
    return current <= minimum && current > 0;
  });

  const outOfStockProducts = products.filter(p => (p.initialQuantity || 0) === 0);
  const goodStockProducts = products.filter(p => p.initialQuantity > (p.minimumStock || 5));

  if (authLoading) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner"></div>
      </div>
    );
  }

  if (!authenticated || roles?.isGuest) {
    return (
      <div className="auth-denied">
        <p className="auth-denied-text">You don't have permission to access this page</p>
      </div>
    );
  }

  return (
    <div className="stock-management-container">
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <h1 className="page-title">Stock Management</h1>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card stat-card-red">
          <p className="stat-label">Out of Stock</p>
          <p className="stat-value stat-value-red">{outOfStockProducts.length}</p>
        </div>
        <div className="stat-card stat-card-yellow">
          <p className="stat-label">Low Stock</p>
          <p className="stat-value stat-value-yellow">{lowStockProducts.length}</p>
        </div>
        <div className="stat-card stat-card-green">
          <p className="stat-label">In Stock</p>
          <p className="stat-value stat-value-green">{goodStockProducts.length}</p>
        </div>
      </div>

      {/* Out of Stock Products */}
      {outOfStockProducts.length > 0 && (
        <div className="alert-section">
          <h2 className="section-title">
            <AlertCircle className="section-icon" size={24} color="#dc2626" />
            Out of Stock ({outOfStockProducts.length})
          </h2>
          <div className="products-grid">
            {outOfStockProducts.map(product => (
              <div key={product.id} className="product-alert-card product-alert-card-red">
                <p className="product-name product-name-red">{product.name}</p>
                <p className="product-description product-description-red">{product.description}</p>
                <button
                  onClick={() => {
                    setSelectedProduct(product);
                    setIsStockModalOpen(true);
                  }}
                  className="alert-button alert-button-red"
                >
                  Add Stock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low Stock Products */}
      {lowStockProducts.length > 0 && (
        <div className="alert-section">
          <h2 className="section-title">
            <AlertTriangle className="section-icon" size={24} color="#d97706" />
            Low Stock ({lowStockProducts.length})
          </h2>
          <div className="products-grid">
            {lowStockProducts.map(product => (
              <div key={product.id} className="product-alert-card product-alert-card-yellow">
                <p className="product-name product-name-yellow">{product.name}</p>
                <p className="product-stock-info product-stock-info-yellow">
                  Current: {product.initialQuantity} | Minimum: {product.minimumStock}
                </p>
                <button
                  onClick={() => {
                    setSelectedProduct(product);
                    setIsStockModalOpen(true);
                  }}
                  className="alert-button alert-button-yellow"
                >
                  Adjust Stock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <StockModal
        isOpen={isStockModalOpen}
        onClose={() => {
          setIsStockModalOpen(false);
          setSelectedProduct(undefined);
        }}
        product={selectedProduct}
        onSubmit={handleStockUpdate}
      />
    </div>
  );
}
