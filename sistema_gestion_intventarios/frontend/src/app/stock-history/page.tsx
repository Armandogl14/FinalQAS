'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { productApi, Product } from '@/lib/api/products';
import { stockApi, StockMovement } from '@/lib/api/stock';
import { StockHistory } from '@/components/StockHistoryList';
import { PackageOpen, Search, Filter, Package } from 'lucide-react';
import './stock-history.css';

export const dynamic = 'force-dynamic';

export default function StockHistoryPage() {
  const { authenticated, token, loading: authLoading } = useAuth();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedProduct, setSelectedProduct] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (authenticated && token) {
      fetchData();
    }
  }, [authenticated, token]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [movementsData, productsData] = await Promise.all([
        stockApi.getRecentMovements(500, token || undefined),
        productApi.getAll(token || undefined)
      ]);
      setMovements(movementsData);
      setProducts(productsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      if (errorMessage.includes('403')) {
        setError('You do not have permission to view stock history. Please contact an administrator.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...movements];

    if (selectedProduct !== 'all') {
      result = result.filter(m => m.productId === parseInt(selectedProduct));
    }

    if (selectedType !== 'all') {
      result = result.filter(m => m.movementType === selectedType);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m =>
        m.productName.toLowerCase().includes(query) ||
        m.reason.toLowerCase().includes(query)
      );
    }

    setFilteredMovements(result);
  }, [movements, selectedProduct, selectedType, searchQuery]);

  if (authLoading) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner"></div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="auth-required">
        <PackageOpen size={48} className="auth-icon" />
        <p className="auth-message">Please log in to view stock history</p>
      </div>
    );
  }

  return (
    <div className="stock-history-container">
      {error && <div className="error-message">{error}</div>}

      <h1 className="page-title">Stock History</h1>

      <div className="filters-container">
        <div className="filters-grid">
          <div className="filter-group">
            <label className="filter-label">
              <Package size={14} style={{ display: 'inline', marginRight: '0.5rem', color: '#667eea' }} />
              Product
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="filter-select"
              title="Filter by product"
            >
              <option value="all">All Products</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">
              <Filter size={14} style={{ display: 'inline', marginRight: '0.5rem', color: '#667eea' }} />
              Movement Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="filter-select"
              title="Filter by movement type"
            >
              <option value="all">All Types</option>
              <option value="STOCK_IN">Stock In</option>
              <option value="STOCK_OUT">Stock Out</option>
              <option value="ADJUSTMENT">Adjustment</option>
              <option value="RETURN">Return</option>
              <option value="LOSS">Loss</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">
              <Search size={14} style={{ display: 'inline', marginRight: '0.5rem', color: '#667eea' }} />
              Search
            </label>
            <input
              type="text"
              placeholder="Search reason or product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="filter-input"
            />
          </div>
        </div>
      </div>

      <div className="history-container">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        ) : (
          <StockHistory movements={filteredMovements} />
        )}
      </div>
    </div>
  );
}
