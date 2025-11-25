import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Clock,
    User,
    Package,
    ArrowUp,
    ArrowDown,
    RefreshCw,
    AlertTriangle,
    RotateCcw,
    Filter,
    Download,
    Search,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight
} from 'lucide-react';
import './App.css';
import config from './config';

const StockHistory = ({ keycloak }) => {
    const [movements, setMovements] = useState([]);
    const [filteredMovements, setFilteredMovements] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Filtros
    const [selectedProduct, setSelectedProduct] = useState('all');
    const [selectedMovementType, setSelectedMovementType] = useState('all');
    const [selectedUser, setSelectedUser] = useState('all');
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(15);
    const [totalPages, setTotalPages] = useState(0);

    // Estados para estadísticas
    const [stats, setStats] = useState({
        totalMovements: 0,
        stockInCount: 0,
        stockOutCount: 0,
        adjustmentCount: 0,
        returnCount: 0,
        lossCount: 0
    });

    const movementTypeConfig = {
        STOCK_IN: { icon: ArrowUp, color: 'var(--success)', bgColor: 'rgba(16, 185, 129, 0.1)', label: 'Stock In' },
        STOCK_OUT: { icon: ArrowDown, color: 'var(--danger)', bgColor: 'rgba(239, 68, 68, 0.1)', label: 'Stock Out' },
        ADJUSTMENT: { icon: RefreshCw, color: 'var(--info)', bgColor: 'rgba(59, 130, 246, 0.1)', label: 'Adjustment' },
        RETURN: { icon: RotateCcw, color: 'var(--success-light)', bgColor: 'rgba(16, 185, 129, 0.1)', label: 'Return' },
        LOSS: { icon: AlertTriangle, color: 'var(--warning)', bgColor: 'rgba(245, 158, 11, 0.1)', label: 'Loss' },
        INITIAL: { icon: Package, color: 'var(--gray-600)', bgColor: 'var(--gray-100)', label: 'Initial' }
    };

    useEffect(() => {
        fetchProducts();
        fetchRecentMovements();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [movements, selectedProduct, selectedMovementType, selectedUser, dateRange, searchQuery]);

    const fetchProducts = async () => {
        try {
            const response = await fetch(`${config.API_BASE_URL}/api/v2/products`, {
                headers: keycloak.authenticated ? { Authorization: `Bearer ${keycloak.token}` } : {}
            });
            if (response.ok) {
                const data = await response.json();
                setProducts(data);
            }
        } catch (err) {
            console.error('Error fetching products:', err);
        }
    };

    const fetchRecentMovements = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${config.API_BASE_URL}/api/v2/stock/recent?limit=500`, {
                headers: { Authorization: `Bearer ${keycloak.token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setMovements(data);
                calculateStats(data);
            } else {
                throw new Error('Failed to fetch movements');
            }
        } catch (err) {
            console.error('Error fetching movements:', err);
            setError('Failed to fetch stock movements. Make sure you have appropriate permissions.');
        } finally {
            setLoading(false);
        }
    };

    const fetchProductHistory = async (productId) => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${config.API_BASE_URL}/api/v2/stock/history/${productId}`, {
                headers: { Authorization: `Bearer ${keycloak.token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setMovements(data);
                calculateStats(data);
            } else {
                throw new Error('Failed to fetch product history');
            }
        } catch (err) {
            console.error('Error fetching product history:', err);
            setError('Failed to fetch product history.');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (movementData) => {
        const stats = {
            totalMovements: movementData.length,
            stockInCount: movementData.filter(m => m.movementType === 'STOCK_IN').length,
            stockOutCount: movementData.filter(m => m.movementType === 'STOCK_OUT').length,
            adjustmentCount: movementData.filter(m => m.movementType === 'ADJUSTMENT').length,
            returnCount: movementData.filter(m => m.movementType === 'RETURN').length,
            lossCount: movementData.filter(m => m.movementType === 'LOSS').length
        };
        setStats(stats);
    };

    const applyFilters = () => {
        let filtered = [...movements];

        // Filtro por producto
        if (selectedProduct !== 'all') {
            filtered = filtered.filter(m => m.productId === parseInt(selectedProduct));
        }

        // Filtro por tipo de movimiento
        if (selectedMovementType !== 'all') {
            filtered = filtered.filter(m => m.movementType === selectedMovementType);
        }

        // Filtro por usuario
        if (selectedUser !== 'all') {
            filtered = filtered.filter(m => m.username === selectedUser);
        }

        // Filtro por fechas
        if (dateRange.startDate) {
            filtered = filtered.filter(m => new Date(m.timestamp) >= new Date(dateRange.startDate));
        }
        if (dateRange.endDate) {
            const endDate = new Date(dateRange.endDate);
            endDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(m => new Date(m.timestamp) <= endDate);
        }

        // Filtro por búsqueda
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(m =>
                m.productName.toLowerCase().includes(query) ||
                m.username.toLowerCase().includes(query) ||
                (m.reason && m.reason.toLowerCase().includes(query)) ||
                m.movementType.toLowerCase().includes(query)
            );
        }

        setFilteredMovements(filtered);
        setTotalPages(Math.ceil(filtered.length / itemsPerPage));
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setSelectedProduct('all');
        setSelectedMovementType('all');
        setSelectedUser('all');
        setDateRange({ startDate: '', endDate: '' });
        setSearchQuery('');
    };

    // Paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredMovements.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    const formatDateTime = (timestamp) => {
        const date = new Date(timestamp);
        return {
            date: date.toLocaleDateString(),
            time: date.toLocaleTimeString()
        };
    };

    const getUniqueUsers = () => {
        return [...new Set(movements.map(m => m.username))].sort();
    };

    const renderMovementIcon = (movementType) => {
        const config = movementTypeConfig[movementType] || movementTypeConfig.INITIAL;
        const Icon = config.icon;
        return (
            <div className="movement-icon" style={{ backgroundColor: config.bgColor, color: config.color }}>
                <Icon size={16} />
            </div>
        );
    };

    const exportToCSV = () => {
        const headers = ['Date', 'Time', 'Product', 'Movement Type', 'Quantity', 'User', 'Reason', 'Previous Qty', 'New Qty'];
        const csvData = filteredMovements.map(movement => {
            const { date, time } = formatDateTime(movement.timestamp);
            return [
                date,
                time,
                movement.productName,
                movementTypeConfig[movement.movementType]?.label || movement.movementType,
                movement.quantity,
                movement.username,
                movement.reason || 'N/A',
                movement.previousQuantity,
                movement.newQuantity
            ];
        });

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.map(field => `"${field}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `stock-history-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!keycloak.authenticated) {
        return (
            <div className="auth-required-message">
                <div className="message-icon">
                    <User size={32} />
                </div>
                <h2>Authentication Required</h2>
                <p>Please login to view stock movement history.</p>
            </div>
        );
    }

    return (
        <div className="stock-history-container">
            <div className="stock-history-header">
                <div className="header-content">
                    <div className="title-section">
                        <h1>Stock Movement History</h1>
                        <p>Track all inventory movements, including who made them and when</p>
                    </div>
                    <button className="export-btn" onClick={exportToCSV}>
                        <Download size={18} />
                        Export CSV
                    </button>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    <AlertTriangle size={18} />
                    <span>{error}</span>
                </div>
            )}

            {/* Statistics Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--info)' }}>
                        <Package size={20} />
                    </div>
                    <div className="stat-content">
                        <h3>Total Movements</h3>
                        <p>{stats.totalMovements}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                        <ArrowUp size={20} />
                    </div>
                    <div className="stat-content">
                        <h3>Stock In</h3>
                        <p>{stats.stockInCount}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                        <ArrowDown size={20} />
                    </div>
                    <div className="stat-content">
                        <h3>Stock Out</h3>
                        <p>{stats.stockOutCount}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--info)' }}>
                        <RefreshCw size={20} />
                    </div>
                    <div className="stat-content">
                        <h3>Adjustments</h3>
                        <p>{stats.adjustmentCount}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                        <RotateCcw size={20} />
                    </div>
                    <div className="stat-content">
                        <h3>Returns</h3>
                        <p>{stats.returnCount}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
                        <AlertTriangle size={20} />
                    </div>
                    <div className="stat-content">
                        <h3>Losses</h3>
                        <p>{stats.lossCount}</p>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="filters-section">
                <div className="section-header">
                    <div className="section-title">
                        <Filter size={20} />
                        <h2>Filters</h2>
                    </div>
                    <div className="filter-actions">
                        <button className="secondary-btn" onClick={clearFilters}>
                            Clear All
                        </button>
                        <button className="primary-btn" onClick={fetchRecentMovements}>
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="filters-grid">
                    <div className="search-filter">
                        <div className="search-input">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search products, users, or reasons..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="filter-group">
                        <label>Product</label>
                        <select
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                        >
                            <option value="all">All Products</option>
                            {products.map(product => (
                                <option key={product.id} value={product.id}>{product.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Movement Type</label>
                        <select
                            value={selectedMovementType}
                            onChange={(e) => setSelectedMovementType(e.target.value)}
                        >
                            <option value="all">All Types</option>
                            {Object.entries(movementTypeConfig).map(([key, config]) => (
                                <option key={key} value={key}>{config.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>User</label>
                        <select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                        >
                            <option value="all">All Users</option>
                            {getUniqueUsers().map(user => (
                                <option key={user} value={user}>{user}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Start Date</label>
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                    </div>

                    <div className="filter-group">
                        <label>End Date</label>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                    </div>
                </div>
            </div>

            {/* Results Section */}
            <div className="results-section">
                <div className="section-header">
                    <h2>Movement History</h2>
                    <span className="results-count">{filteredMovements.length} records found</span>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading movements...</p>
                    </div>
                ) : currentItems.length === 0 ? (
                    <div className="empty-state">
                        <Package size={48} />
                        <h3>No movements found</h3>
                        <p>Try adjusting your filters or check back later</p>
                    </div>
                ) : (
                    <>
                        <div className="table-container">
                            <table className="movements-table">
                                <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Product</th>
                                    <th>Quantity</th>
                                    <th>Stock Change</th>
                                    <th>User</th>
                                    <th>Date & Time</th>
                                    <th>Reason</th>
                                </tr>
                                </thead>
                                <tbody>
                                {currentItems.map((movement) => {
                                    const { date, time } = formatDateTime(movement.timestamp);
                                    const config = movementTypeConfig[movement.movementType] || movementTypeConfig.INITIAL;
                                    return (
                                        <tr key={movement.id}>
                                            <td>
                                                <div className="movement-type-cell">
                                                    {renderMovementIcon(movement.movementType)}
                                                    <span>{config.label}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="product-cell">
                                                    <div className="product-name">{movement.productName}</div>
                                                    <div className="product-id">ID: {movement.productId}</div>
                                                </div>
                                            </td>
                                            <td>
                                                    <span className={`quantity-badge ${movement.movementType}`}>
                                                        {['STOCK_IN', 'RETURN'].includes(movement.movementType) ? '+' :
                                                            ['STOCK_OUT', 'LOSS'].includes(movement.movementType) ? '-' : '±'}
                                                        {movement.quantity}
                                                    </span>
                                            </td>
                                            <td>
                                                <div className="stock-change-cell">
                                                    <span className="previous-quantity">{movement.previousQuantity}</span>
                                                    <span className="arrow">→</span>
                                                    <span className="new-quantity">{movement.newQuantity}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="user-cell">
                                                    <User size={16} />
                                                    <span>{movement.username}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="datetime-cell">
                                                    <div className="date">{date}</div>
                                                    <div className="time">{time}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="reason-cell">
                                                    {movement.reason || 'No reason specified'}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="pagination">
                                <div className="pagination-info">
                                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredMovements.length)} of {filteredMovements.length} entries
                                </div>
                                <div className="pagination-controls">
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                        className="items-per-page"
                                    >
                                        <option value={10}>10 per page</option>
                                        <option value={15}>15 per page</option>
                                        <option value={25}>25 per page</option>
                                        <option value={50}>50 per page</option>
                                    </select>

                                    <button
                                        onClick={() => paginate(1)}
                                        disabled={currentPage === 1}
                                        className="pagination-btn"
                                    >
                                        <ChevronsLeft size={16} />
                                    </button>
                                    <button
                                        onClick={() => paginate(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="pagination-btn"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>

                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => paginate(pageNum)}
                                                className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}

                                    {totalPages > 5 && currentPage < totalPages - 2 && (
                                        <span className="pagination-ellipsis">...</span>
                                    )}

                                    <button
                                        onClick={() => paginate(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="pagination-btn"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                    <button
                                        onClick={() => paginate(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="pagination-btn"
                                    >
                                        <ChevronsRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default StockHistory;