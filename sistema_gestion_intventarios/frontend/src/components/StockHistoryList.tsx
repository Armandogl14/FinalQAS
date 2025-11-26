'use client';

import React from 'react';
import { StockMovement } from '@/lib/api/stock';
import { Plus, Minus, RefreshCw, RotateCcw, AlertTriangle, Package } from 'lucide-react';
import { format } from 'date-fns';

interface StockHistoryProps {
  movements: StockMovement[];
  loading?: boolean;
}

const movementTypeConfig: Record<string, { icon: React.ReactNode; color: string; bgColor: string; borderColor: string }> = {
  STOCK_IN: { 
    icon: <Plus size={18} />, 
    color: '#059669', 
    bgColor: '#d1fae5', 
    borderColor: '#6ee7b7' 
  },
  STOCK_OUT: { 
    icon: <Minus size={18} />, 
    color: '#dc2626', 
    bgColor: '#fee2e2', 
    borderColor: '#fca5a5' 
  },
  ADJUSTMENT: { 
    icon: <RefreshCw size={18} />, 
    color: '#2563eb', 
    bgColor: '#dbeafe', 
    borderColor: '#93c5fd' 
  },
  RETURN: { 
    icon: <RotateCcw size={18} />, 
    color: '#0891b2', 
    bgColor: '#cffafe', 
    borderColor: '#67e8f9' 
  },
  LOSS: { 
    icon: <AlertTriangle size={18} />, 
    color: '#d97706', 
    bgColor: '#fef3c7', 
    borderColor: '#fcd34d' 
  },
  INITIAL: { 
    icon: <Package size={18} />, 
    color: '#64748b', 
    bgColor: '#f1f5f9', 
    borderColor: '#cbd5e1' 
  }
};

export const StockHistory: React.FC<StockHistoryProps> = ({ movements, loading = false }) => {
  if (loading) {
    return (
      <>
        <style jsx>{`
          .history-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 3rem 2rem;
          }

          .history-spinner {
            width: 48px;
            height: 48px;
            border: 3px solid #e0e7ff;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <div className="history-loading">
          <div className="history-spinner"></div>
        </div>
      </>
    );
  }

  if (movements.length === 0) {
    return (
      <>
        <style jsx>{`
          .history-empty {
            text-align: center;
            padding: 3rem 2rem;
          }

          .history-empty-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 1.5rem;
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .history-empty-text {
            font-size: 1.125rem;
            font-weight: 600;
            color: #64748b;
            margin: 0;
          }
        `}</style>
        <div className="history-empty">
          <div className="history-empty-icon">
            <Package size={40} color="#94a3b8" />
          </div>
          <p className="history-empty-text">No stock movements yet</p>
        </div>
      </>
    );
  }

  return (
    <>
      <style jsx>{`
        .history-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .history-item {
          padding: 1.25rem;
          border-radius: 14px;
          border-left: 4px solid;
          transition: all 0.2s ease;
          background: #ffffff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .history-item:hover {
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .history-item-content {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }

        .history-icon-wrapper {
          padding: 0.75rem;
          border-radius: 12px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .history-details {
          flex: 1;
          min-width: 0;
        }

        .history-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }

        .history-product-name {
          font-weight: 700;
          font-size: 1rem;
          color: #1e293b;
          margin: 0;
        }

        .history-quantity {
          font-size: 0.9375rem;
          font-weight: 700;
          padding: 0.25rem 0.75rem;
          border-radius: 8px;
          white-space: nowrap;
        }

        .history-quantity-positive {
          color: #059669;
          background: #d1fae5;
        }

        .history-quantity-negative {
          color: #dc2626;
          background: #fee2e2;
        }

        .history-reason {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0 0 0.75rem 0;
          line-height: 1.5;
        }

        .history-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
          font-size: 0.75rem;
          color: #94a3b8;
        }

        .history-meta-item {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .history-meta-separator {
          width: 4px;
          height: 4px;
          background: #cbd5e1;
          border-radius: 50%;
        }
      `}</style>

      <div className="history-list">
        {movements.map((movement) => {
          const config = movementTypeConfig[movement.movementType] || movementTypeConfig.INITIAL;
          const isNegative = movement.movementType === 'STOCK_OUT' || movement.movementType === 'LOSS';
          
          // Safe date formatting
          const formatDate = (dateString: string) => {
            if (!dateString) return 'N/A';
            try {
              const date = new Date(dateString);
              if (isNaN(date.getTime())) {
                return 'Invalid date';
              }
              return format(date, 'MMM dd, yyyy hh:mm a');
            } catch (error) {
              return 'Invalid date';
            }
          };
          
          return (
            <div 
              key={movement.id} 
              className="history-item"
              style={{
                borderLeftColor: config.borderColor,
                backgroundColor: config.bgColor + '40'
              }}
            >
              <div className="history-item-content">
                <div 
                  className="history-icon-wrapper"
                  style={{
                    backgroundColor: config.bgColor
                  }}
                >
                  <div style={{ color: config.color }}>
                    {config.icon}
                  </div>
                </div>
                <div className="history-details">
                  <div className="history-header">
                    <p className="history-product-name">{movement.productName}</p>
                    <span className={`history-quantity ${isNegative ? 'history-quantity-negative' : 'history-quantity-positive'}`}>
                      {isNegative ? '-' : '+'}{movement.quantity}
                    </span>
                  </div>
                  <p className="history-reason">{movement.reason}</p>
                  <div className="history-meta">
                    <div className="history-meta-item">
                      <span>By: {movement.createdBy || 'Unknown'}</span>
                    </div>
                    <div className="history-meta-separator"></div>
                    <div className="history-meta-item">
                      <span>{formatDate(movement.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
