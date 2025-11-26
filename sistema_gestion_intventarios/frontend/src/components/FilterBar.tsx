'use client';

import React from 'react';
import { Search, RotateCcw, Filter, Tag, Package } from 'lucide-react';

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  categoryFilter: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  stockFilter: string;
  onStockFilterChange: (filter: string) => void;
  onReset: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  categories,
  stockFilter,
  onStockFilterChange,
  onReset
}) => {
  return (
    <>
      <style jsx>{`
        .filter-container {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 12px;
          padding: 1rem;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(226, 232, 240, 0.8);
        }

        .search-section {
          margin-bottom: 1rem;
          position: relative;
        }

        .search-wrapper {
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
          z-index: 1;
        }

        .search-input {
          width: 100%;
          padding: 0.625rem 0.75rem 0.625rem 2.5rem;
          font-size: 0.875rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          background: #ffffff;
          color: #1e293b;
          transition: all 0.2s ease;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
        }

        .search-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.12), 0 2px 8px rgba(102, 126, 234, 0.15);
        }

        .search-input::placeholder {
          color: #94a3b8;
          font-size: 0.875rem;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.75rem;
        }

        @media (min-width: 768px) {
          .filters-grid {
            grid-template-columns: 1fr 1fr auto;
          }
        }

        .filter-group {
          display: flex;
          flex-direction: column;
        }

        .filter-label {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .filter-label-icon {
          width: 14px;
          height: 14px;
          color: #667eea;
        }

        .filter-select {
          width: 100%;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          background: #ffffff;
          color: #1e293b;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath fill='%23667eea' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          padding-right: 2.5rem;
        }

        .filter-select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.12), 0 2px 8px rgba(102, 126, 234, 0.15);
        }

        .filter-select:hover {
          border-color: #cbd5e1;
        }

        .reset-button-wrapper {
          display: flex;
          align-items: flex-end;
        }

        .reset-button {
          width: 100%;
          padding: 0.625rem 1rem;
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          color: #475569;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
        }

        .reset-button:hover {
          background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
          border-color: #94a3b8;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .reset-button:active {
          transform: translateY(0);
        }

        .reset-icon {
          width: 14px;
          height: 14px;
        }

        .filter-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.875rem;
          padding-bottom: 0.75rem;
          border-bottom: 1.5px solid #e2e8f0;
        }

        .filter-header-icon {
          width: 18px;
          height: 18px;
          color: #667eea;
        }

        .filter-header-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          letter-spacing: -0.01em;
        }
      `}</style>

      <div className="filter-container">
        <div className="filter-header">
          <Filter className="filter-header-icon" size={18} />
          <h3 className="filter-header-title">Filters</h3>
        </div>

        <div className="search-section">
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="filters-grid">
          <div className="filter-group">
            <label className="filter-label">
              <Tag className="filter-label-icon" size={14} />
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">
              <Package className="filter-label-icon" size={14} />
              Stock Status
            </label>
            <select
              value={stockFilter}
              onChange={(e) => onStockFilterChange(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Stock Levels</option>
              <option value="in">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>

          <div className="reset-button-wrapper">
            <button
              onClick={onReset}
              className="reset-button"
            >
              <RotateCcw className="reset-icon" size={14} />
              Reset
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
