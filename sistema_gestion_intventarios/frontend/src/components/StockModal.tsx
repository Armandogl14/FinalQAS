'use client';

import React, { useEffect, useState } from 'react';
import { Product } from '@/lib/api/products';
import { MovementType } from '@/lib/api/stock';
import { X, Plus, Minus, RefreshCw, RotateCcw, AlertTriangle, Package, TrendingUp, Loader2 } from 'lucide-react';

interface StockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
  onSubmit: (movementType: MovementType, quantity: number, reason: string) => Promise<void>;
  loading?: boolean;
}

const MOVEMENT_TYPES: { value: MovementType; label: string; icon: React.ReactNode; color: string; bgColor: string }[] = [
  { value: 'STOCK_IN', label: 'Stock In', icon: <Plus size={18} />, color: '#059669', bgColor: '#d1fae5' },
  { value: 'STOCK_OUT', label: 'Stock Out', icon: <Minus size={18} />, color: '#dc2626', bgColor: '#fee2e2' },
  { value: 'ADJUSTMENT', label: 'Adjustment', icon: <RefreshCw size={18} />, color: '#2563eb', bgColor: '#dbeafe' },
  { value: 'RETURN', label: 'Return', icon: <RotateCcw size={18} />, color: '#0891b2', bgColor: '#cffafe' },
  { value: 'LOSS', label: 'Loss', icon: <AlertTriangle size={18} />, color: '#d97706', bgColor: '#fef3c7' }
];

export const StockModal: React.FC<StockModalProps> = ({
  isOpen,
  onClose,
  product,
  onSubmit,
  loading = false
}) => {
  const [movementType, setMovementType] = useState<MovementType>('STOCK_IN');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMovementType('STOCK_IN');
      setQuantity('');
      setReason('');
      setError('');
    }
  }, [isOpen, product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const qty = parseInt(quantity);
      if (!quantity || isNaN(qty) || qty <= 0) {
        throw new Error('Please enter a valid quantity greater than 0');
      }

      const currentStock = product?.initialQuantity || 0;
      if ((movementType === 'STOCK_OUT' || movementType === 'LOSS') && qty > currentStock) {
        throw new Error(`Cannot remove ${qty} items. Current stock is ${currentStock}`);
      }

      if (!reason.trim()) {
        throw new Error('Please provide a reason for this stock movement');
      }

      await onSubmit(movementType, qty, reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getNewStockPreview = () => {
    if (!quantity || isNaN(parseInt(quantity))) return product?.initialQuantity || 0;
    const qty = parseInt(quantity);
    const current = product?.initialQuantity || 0;

    switch (movementType) {
      case 'STOCK_IN':
      case 'RETURN':
        return current + qty;
      case 'STOCK_OUT':
      case 'LOSS':
        return Math.max(0, current - qty);
      case 'ADJUSTMENT':
        return qty;
      default:
        return current;
    }
  };

  if (!isOpen || !product) return null;

  const selectedType = MOVEMENT_TYPES.find(t => t.value === movementType);

  return (
    <>
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.98) 100%);
          backdrop-filter: blur(8px);
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          animation: fadeIn 0.2s ease-out;
        }

        .modal-container {
          background: #ffffff;
          border-radius: 24px;
          width: 100%;
          max-width: 640px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }

        .modal-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
          position: relative;
          overflow: hidden;
        }

        .modal-header::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 200px;
          height: 200px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          filter: blur(40px);
        }

        .modal-header-content {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .modal-title-section {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .modal-icon-wrapper {
          width: 56px;
          height: 56px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .modal-title {
          color: #ffffff;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .modal-subtitle {
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        .modal-close-btn {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.15);
          border: none;
          color: #ffffff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .modal-close-btn:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: scale(1.05);
        }

        .modal-body {
          padding: 2rem;
          flex: 1;
          overflow-y: auto;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          background: #fef2f2;
          border-left: 4px solid #ef4444;
          border-radius: 0 12px 12px 0;
          margin-bottom: 1.5rem;
        }

        .error-icon {
          color: #ef4444;
          flex-shrink: 0;
        }

        .error-text {
          color: #dc2626;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .product-info-card {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 1.5rem;
          border-radius: 16px;
          margin-bottom: 1.5rem;
          border: 1px solid #e2e8f0;
        }

        .product-info-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }

        .product-info-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 0.75rem 0;
        }

        .product-info-stock {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9375rem;
          color: #475569;
        }

        .stock-value {
          font-weight: 700;
          color: #1e293b;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.75rem;
        }

        .form-label-icon {
          width: 18px;
          height: 18px;
        }

        .required-asterisk {
          color: #ef4444;
          margin-left: 2px;
        }

        .movement-types-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }

        .movement-type-btn {
          padding: 1rem;
          border-radius: 12px;
          border: 2px solid;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          background: #ffffff;
        }

        .movement-type-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .movement-type-btn-selected {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .movement-type-icon {
          display: flex;
          justify-content: center;
          margin-bottom: 0.5rem;
        }

        .movement-type-label {
          font-size: 0.8125rem;
          font-weight: 600;
        }

        .form-input {
          width: 100%;
          padding: 0.875rem 1rem;
          font-size: 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          transition: all 0.2s ease;
          background: #ffffff;
          color: #1e293b;
        }

        .form-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }

        .form-textarea {
          width: 100%;
          padding: 0.875rem 1rem;
          font-size: 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          transition: all 0.2s ease;
          background: #ffffff;
          color: #1e293b;
          resize: none;
          font-family: inherit;
        }

        .form-textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }

        .preview-card {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          padding: 1.5rem;
          border-radius: 16px;
          margin-bottom: 1.5rem;
          border: 1px solid #93c5fd;
        }

        .preview-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #1e40af;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }

        .preview-value {
          font-size: 2rem;
          font-weight: 800;
          color: #1e40af;
          margin: 0;
        }

        .modal-footer {
          padding: 1.5rem 2rem;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 1rem;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          font-size: 0.9375rem;
          font-weight: 600;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-cancel {
          background: #ffffff;
          color: #475569;
          border: 2px solid #cbd5e1;
        }

        .btn-cancel:hover:not(:disabled) {
          background: #f1f5f9;
          border-color: #94a3b8;
        }

        .btn-submit {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-submit:hover:not(:disabled) {
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
          transform: translateY(-1px);
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .icon-blue { color: #3b82f6; }
        .icon-green { color: #10b981; }
        .icon-purple { color: #8b5cf6; }
        .icon-orange { color: #f59e0b; }
      `}</style>

      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-container" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="modal-header">
            <div className="modal-header-content">
              <div className="modal-title-section">
                <div className="modal-icon-wrapper">
                  <TrendingUp size={28} color="#ffffff" />
                </div>
                <div>
                  <h2 className="modal-title">Adjust Stock</h2>
                  <p className="modal-subtitle">Update stock levels for this product</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={onClose}>
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="modal-body">
            {error && (
              <div className="error-message">
                <AlertTriangle className="error-icon" size={20} />
                <p className="error-text">{error}</p>
              </div>
            )}

            {/* Product Info */}
            <div className="product-info-card">
              <div className="product-info-label">Product</div>
              <p className="product-info-name">{product.name}</p>
              <div className="product-info-stock">
                <Package size={16} color="#64748b" />
                <span>Current Stock: <span className="stock-value">{product.initialQuantity}</span></span>
              </div>
            </div>

            {/* Movement Type */}
            <div className="form-group">
              <label className="form-label">
                <RefreshCw className="form-label-icon icon-blue" />
                Movement Type
                <span className="required-asterisk">*</span>
              </label>
              <div className="movement-types-grid">
                {MOVEMENT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setMovementType(type.value)}
                    className={`movement-type-btn ${movementType === type.value ? 'movement-type-btn-selected' : ''}`}
                    style={{
                      borderColor: movementType === type.value ? type.color : '#e2e8f0',
                      backgroundColor: movementType === type.value ? type.bgColor : '#ffffff',
                      color: movementType === type.value ? type.color : '#64748b'
                    }}
                  >
                    <div className="movement-type-icon" style={{ color: type.color }}>
                      {type.icon}
                    </div>
                    <div className="movement-type-label">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="form-group">
              <label className="form-label">
                <Package className="form-label-icon icon-purple" />
                {movementType === 'ADJUSTMENT' ? 'New Stock Level' : 'Quantity'}
                <span className="required-asterisk">*</span>
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="0"
                className="form-input"
                placeholder={movementType === 'ADJUSTMENT' ? 'Enter final stock quantity' : 'Enter quantity to move'}
                required
              />
            </div>

            {/* Reason */}
            <div className="form-group">
              <label className="form-label">
                <AlertTriangle className="form-label-icon icon-orange" />
                Reason
                <span className="required-asterisk">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="form-textarea"
                placeholder="Describe the reason for this movement"
                rows={4}
                required
              />
            </div>

            {/* Stock Preview */}
            <div className="preview-card">
              <div className="preview-label">Stock Preview</div>
              <p className="preview-value">{getNewStockPreview()}</p>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-cancel"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="btn btn-submit"
              >
                {isSubmitting || loading ? (
                  <>
                    <Loader2 className="spinner" size={18} />
                    Updating...
                  </>
                ) : (
                  <>
                    <TrendingUp size={18} />
                    Update Stock
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
