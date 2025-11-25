import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import {
    Package,
    TrendingUp,
    TrendingDown,
    RefreshCw,
    RotateCcw,
    AlertTriangle,
    Info,
    CheckCircle,
    XCircle
} from 'lucide-react';
import './App.css';

const StockMovementModal = ({ isOpen, onClose, product, onUpdateStock }) => {
    const [movementType, setMovementType] = useState('STOCK_IN');
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when modal opens/closes or product changes
    useEffect(() => {
        if (isOpen && product) {
            setMovementType('STOCK_IN');
            setQuantity('');
            setReason('');
            setError('');
        }
    }, [isOpen, product]);

    const movementTypes = [
        {
            value: 'STOCK_IN',
            label: 'Stock In',
            description: 'Add inventory',
            icon: TrendingUp,
            color: 'var(--success)',
            symbol: '+'
        },
        {
            value: 'STOCK_OUT',
            label: 'Stock Out',
            description: 'Remove inventory',
            icon: TrendingDown,
            color: 'var(--danger)',
            symbol: '-'
        },
        {
            value: 'ADJUSTMENT',
            label: 'Adjustment',
            description: 'Adjust for discrepancies',
            icon: RefreshCw,
            color: 'var(--info)',
            symbol: '±'
        },
        {
            value: 'RETURN',
            label: 'Return',
            description: 'Customer/supplier return',
            icon: RotateCcw,
            color: 'var(--success-light)',
            symbol: '+'
        },
        {
            value: 'LOSS',
            label: 'Loss',
            description: 'Damaged, expired, or stolen',
            icon: AlertTriangle,
            color: 'var(--warning)',
            symbol: '-'
        }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!quantity || isNaN(quantity) || parseInt(quantity) <= 0) {
            setError('Please enter a valid quantity greater than 0');
            return;
        }

        const quantityInt = parseInt(quantity);
        const currentStock = product.initialQuantity || 0;

        // Validate stock operations
        if ((movementType === 'STOCK_OUT' || movementType === 'LOSS') && quantityInt > currentStock) {
            setError(`Cannot remove ${quantityInt} items. Current stock is ${currentStock}`);
            return;
        }

        if (!reason.trim()) {
            setError('Please provide a reason for this stock movement');
            return;
        }

        setIsSubmitting(true);
        try {
            await onUpdateStock(product.id, quantityInt, movementType, reason.trim());
        } catch (err) {
            setError('Failed to update stock. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getNewStockPreview = () => {
        if (!quantity || isNaN(quantity)) return product?.initialQuantity || 0;

        const quantityInt = parseInt(quantity);
        const currentStock = product?.initialQuantity || 0;

        switch (movementType) {
            case 'STOCK_IN':
            case 'RETURN':
                return currentStock + quantityInt;
            case 'STOCK_OUT':
            case 'LOSS':
                return Math.max(0, currentStock - quantityInt);
            case 'ADJUSTMENT':
                // For adjustment, the quantity represents the final desired stock
                return quantityInt;
            default:
                return currentStock;
        }
    };

    const getQuantityLabel = () => {
        switch (movementType) {
            case 'ADJUSTMENT':
                return 'New Stock Level';
            default:
                return 'Quantity';
        }
    };

    const getQuantityPlaceholder = () => {
        switch (movementType) {
            case 'ADJUSTMENT':
                return 'Enter final stock quantity';
            default:
                return 'Enter quantity to move';
        }
    };

    const getCurrentMovementType = () => {
        return movementTypes.find(type => type.value === movementType);
    };

    if (!product) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="stock-movement-modal">
            <div className="modal-header">
                <div className="modal-title-section">
                    <div className="product-icon">
                        <Package size={24} />
                    </div>
                    <div>
                        <h2>Update Stock</h2>
                        <p className="product-name">{product.name}</p>
                    </div>
                </div>
                <div className="current-stock-info">
                    <div className="stock-info-item">
                        <span className="label">Current Stock:</span>
                        <span className="value highlight">{product.initialQuantity || 0} units</span>
                    </div>
                    <div className="stock-info-item">
                        <span className="label">Min Stock:</span>
                        <span className="value">{product.minimumStock || 5} units</span>
                    </div>
                </div>
            </div>

            <form className="stock-movement-form" onSubmit={handleSubmit}>
                {error && (
                    <div className="error-message">
                        <XCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <div className="form-section">
                    <h3>Movement Details</h3>

                    <div className="form-group">
                        <label>Movement Type</label>
                        <div className="movement-type-selector">
                            {movementTypes.map(type => {
                                const IconComponent = type.icon;
                                return (
                                    <div
                                        key={type.value}
                                        className={`movement-type-option ${movementType === type.value ? 'active' : ''}`}
                                        onClick={() => setMovementType(type.value)}
                                        style={{ borderColor: type.color }}
                                    >
                                        <div className="movement-icon" style={{ backgroundColor: type.color }}>
                                            <IconComponent size={16} color="white" />
                                        </div>
                                        <div className="movement-info">
                                            <span className="movement-label">{type.label}</span>
                                            <span className="movement-desc">{type.description}</span>
                                        </div>
                                        <span className="movement-symbol" style={{ color: type.color }}>
                                            {type.symbol}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="quantity-input">{getQuantityLabel()}</label>
                        <div className="input-with-guide">
                            <input
                                id="quantity-input"
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                min={movementType === 'ADJUSTMENT' ? '0' : '1'}
                                max={movementType === 'STOCK_OUT' || movementType === 'LOSS' ? product.initialQuantity : undefined}
                                placeholder={getQuantityPlaceholder()}
                                className="quantity-input"
                                required
                            />
                            {movementType === 'ADJUSTMENT' && (
                                <div className="input-guide">
                                    <Info size={14} />
                                    <span>Enter the total quantity you want in stock after adjustment</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="reason-textarea">Reason</label>
                        <textarea
                            id="reason-textarea"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Explain the reason for this stock movement..."
                            className="reason-textarea"
                            rows="3"
                            required
                        />
                    </div>
                </div>

                {/* Stock Preview */}
                <div className="form-section">
                    <h3>Stock Preview</h3>
                    <div className="stock-preview-card">
                        <div className="preview-row">
                            <span className="label">Current Stock</span>
                            <span className="current-value">{product.initialQuantity || 0}</span>
                        </div>

                        {movementType !== 'ADJUSTMENT' && (
                            <div className="preview-row movement-preview">
                                <span className="label">{getCurrentMovementType()?.label}</span>
                                <span className={`change-value ${['STOCK_IN', 'RETURN'].includes(movementType) ? 'positive' : 'negative'}`}>
                                    {['STOCK_IN', 'RETURN'].includes(movementType) ? '+' : '-'}{quantity || 0}
                                </span>
                            </div>
                        )}

                        <div className="preview-divider">
                            <div className="divider-line"></div>
                            <ArrowRight size={16} />
                            <div className="divider-line"></div>
                        </div>

                        <div className="preview-row result">
                            <span className="label">New Stock Level</span>
                            <span className={`new-value ${getNewStockPreview() <= (product.minimumStock || 5) ? 'warning' : 'success'}`}>
                                {getNewStockPreview()}
                                {getNewStockPreview() <= (product.minimumStock || 5) && (
                                    <span className="status-indicator">
                                        {getNewStockPreview() === 0 ? ' (Out of Stock)' : ' (Low Stock)'}
                                    </span>
                                )}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        className="cancel-btn"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="spinner"></div>
                                Updating...
                            </>
                        ) : (
                            <>
                                <CheckCircle size={18} />
                                Update Stock
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

// Componente de flecha simple para el divider
const ArrowRight = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default StockMovementModal;