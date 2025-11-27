'use client';

import React, { useEffect, useState } from 'react';
import { Product, CreateProductDto } from '@/lib/api/products';
import { X, Package, DollarSign, Layers, Hash, AlertCircle, Save, Loader2 } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductDto) => Promise<void>;
  product?: Product;
  loading?: boolean;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  product,
  loading = false
}) => {
  const [formData, setFormData] = useState<CreateProductDto>({
    name: '',
    description: '',
    category: '',
    price: 0,
    initialQuantity: 0,
    minimumStock: 5
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        initialQuantity: product.initialQuantity,
        minimumStock: product.minimumStock
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: '',
        price: 0,
        initialQuantity: 0,
        minimumStock: 5
      });
    }
    setError('');
  }, [product, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'initialQuantity' || name === 'minimumStock' 
        ? parseFloat(value) || 0
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (!formData.name.trim()) {
        throw new Error('Product name is required');
      }
      if (formData.price < 0) {
        throw new Error('Price cannot be negative');
      }
      if (formData.initialQuantity < 0) {
        throw new Error('Initial quantity cannot be negative');
      }

      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
          margin-bottom: 0.5rem;
        }

        .form-label-icon {
          width: 18px;
          height: 18px;
        }

        .required-asterisk {
          color: #ef4444;
          margin-left: 2px;
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

        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .price-input-wrapper {
          position: relative;
        }

        .price-symbol {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          font-weight: 600;
          pointer-events: none;
        }

        .price-input {
          padding-left: 2.5rem;
        }

        .helper-text {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 0.5rem;
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
                  <Package size={28} color="#ffffff" />
                </div>
                <div>
                  <h2 className="modal-title">
                    {product ? 'Edit Product' : 'Create New Product'}
                  </h2>
                  <p className="modal-subtitle">
                    {product ? 'Update product information' : 'Add a new product to your inventory'}
                  </p>
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
                <AlertCircle className="error-icon" size={20} />
                <p className="error-text">{error}</p>
              </div>
            )}

            {/* Product Name */}
            <div className="form-group">
              <label className="form-label">
                <Package className="form-label-icon icon-blue" />
                Product Name
                <span className="required-asterisk">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter product name"
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">
                <Layers className="form-label-icon icon-blue" />
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-textarea"
                placeholder="Enter product description"
                rows={4}
              />
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label">
                <Hash className="form-label-icon icon-blue" />
                Category
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter category"
              />
            </div>

            {/* Price and Quantity */}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  <DollarSign className="form-label-icon icon-green" />
                  Price
                  <span className="required-asterisk">*</span>
                </label>
                <div className="price-input-wrapper">
                  <span className="price-symbol">$</span>
                  <input
                    type="number"
                    name="price"
                    value={formData.price || ''}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="form-input price-input"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Package className="form-label-icon icon-purple" />
                  Initial Quantity
                </label>
                <input
                  type="number"
                  name="initialQuantity"
                  value={formData.initialQuantity || ''}
                  onChange={handleChange}
                  min="0"
                  className="form-input"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Minimum Stock */}
            <div className="form-group">
              <label className="form-label">
                <AlertCircle className="form-label-icon icon-orange" />
                Minimum Stock
              </label>
              <input
                type="number"
                name="minimumStock"
                value={formData.minimumStock || ''}
                onChange={handleChange}
                min="0"
                className="form-input"
                placeholder="5"
              />
              <p className="helper-text">
                Alert will trigger when stock falls below this value
              </p>
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
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {product ? 'Update Product' : 'Create Product'}
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
