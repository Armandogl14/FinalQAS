// App.js - Versión completa con gestión de stock e historial
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from './Modal';
import StockHistory from './StockHistory';
import StockMovementModal from './StockMovementModal';
import './App.css';

const App = ({ keycloak }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    initialQuantity: '',
    minimumStock: ''
  });

  // Estados de modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState(null);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Estados de roles
  const [userRole, setUserRole] = useState('GUEST');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false);
  const [isGuest, setIsGuest] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [stockFilter, setStockFilter] = useState('all');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Alertas de stock
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(true);

  useEffect(() => {
    if (keycloak.authenticated) {
      const roles = keycloak.tokenParsed?.roles || [];
      console.log('User roles:', roles);

      const adminRole = roles.includes('ROLE_ADMIN');
      const employeeRole = roles.includes('ROLE_EMPLOYEE');

      setIsAdmin(adminRole);
      setIsEmployee(employeeRole);
      setIsGuest(!adminRole && !employeeRole);

      if (adminRole) {
        setUserRole('ADMIN');
      } else if (employeeRole) {
        setUserRole('EMPLOYEE');
      } else {
        setUserRole('GUEST');
      }

      const interval = setInterval(() => {
        keycloak.updateToken(30).then((refreshed) => {
          if (refreshed) console.log('Token refreshed');
        }).catch(() => keycloak.login());
      }, 30000);

      fetchProducts();
      return () => clearInterval(interval);
    } else {
      setUserRole('GUEST');
      setIsGuest(true);
      fetchPublicProducts();
    }
  }, [keycloak]);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1);
  }, [products, searchTerm, categoryFilter, priceRange, stockFilter]);

  useEffect(() => {
    checkLowStockAlerts();
  }, [products]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      console.log('Token exists:', !!keycloak.token);
      console.log('Token preview:', keycloak.token ? keycloak.token.substring(0, 50) + '...' : 'No token');

      const API_BASE_URL = 'http://localhost:8080';
      const response = await axios.get(`${API_BASE_URL}/api/v2/products`, {
        headers: { Authorization: `Bearer ${keycloak.token}` }
      });
      console.log('Fetched products:', response.data);
      setProducts(response.data);
      console.log('Updated products state:', response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    applyFilters();
    setCurrentPage(1);
    console.log('Filtered products:', filteredProducts); // Log after filtering
  }, [products, searchTerm, categoryFilter, priceRange, stockFilter]);

  const fetchPublicProducts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:8080/api/public/products');
      setProducts(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching public products:', err);
      setError('Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  };

  const checkLowStockAlerts = () => {
    if (isGuest) return;

    const lowStockProducts = products.filter(product => {
      const currentStock = product.initialQuantity || 0;
      const minimumStock = product.minimumStock || 5;
      return currentStock <= minimumStock && currentStock > 0;
    });

    const outOfStockProducts = products.filter(product =>
        (product.initialQuantity || 0) === 0
    );

    setLowStockAlerts([...lowStockProducts, ...outOfStockProducts]);
  };

  const dismissAlert = (productId) => {
    setLowStockAlerts(alerts => alerts.filter(alert => alert.id !== productId));
  };

  const updateStock = async (productId, quantity, movementType, reason) => {
    try {
      const response = await axios.post(
          `http://localhost:8080/api/v2/stock/movement`,
          {
            productId,
            quantity,
            movementType,
            reason
          },
          {
            headers: { Authorization: `Bearer ${keycloak.token}` }
          }
      );

      if (response.status === 200) {
        setSuccessMessage('Stock updated successfully');
        fetchProducts(); // Refresh products to get updated quantities
        setIsStockModalOpen(false);
        setSelectedProductForStock(null);

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error updating stock:', err);
      setError(err.response?.data?.message || 'Failed to update stock');
    }
  };

  const applyFilters = () => {
    let result = [...products];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          (p.category && p.category.toLowerCase().includes(term))
      );
    }

    if (categoryFilter !== 'all') {
      result = result.filter(p => p.category === categoryFilter);
    }

    result = result.filter(p =>
        p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    if (!isGuest) {
      if (stockFilter === 'low') {
        result = result.filter(p => {
          const minimumStock = p.minimumStock || 5;
          return p.initialQuantity <= minimumStock && p.initialQuantity > 0;
        });
      } else if (stockFilter === 'out') {
        result = result.filter(p => p.initialQuantity === 0);
      } else if (stockFilter === 'in') {
        result = result.filter(p => p.initialQuantity > (p.minimumStock || 5));
      }
    }

    setFilteredProducts(result);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (isEditModalOpen) {
      setEditingProduct({ ...editingProduct, [name]: value });
    } else {
      setNewProduct({ ...newProduct, [name]: value });
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (isGuest) {
      setError('You need to login to create products');
      return;
    }
    if (!isAdmin && !isEmployee) {
      setError('You need ADMIN or EMPLOYEE role to create products');
      return;
    }
    try {
      await axios.post('http://localhost:8080/api/v2/products', {
        ...newProduct,
        price: parseFloat(newProduct.price),
        initialQuantity: parseInt(newProduct.initialQuantity, 10),
        minimumStock: parseInt(newProduct.minimumStock, 10) || 5
      }, {
        headers: { Authorization: `Bearer ${keycloak.token}` }
      });
      setNewProduct({
        name: '',
        description: '',
        category: '',
        price: '',
        initialQuantity: '',
        minimumStock: ''
      });
      setIsCreateModalOpen(false);
      fetchProducts();
      setError('');
      setSuccessMessage('Product created successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error creating product:', err);
      setError(err.response?.data?.message || 'Failed to create product');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (isGuest) {
      setError('You need to login to edit products');
      return;
    }
    if (!isAdmin && !isEmployee) {
      setError('You need ADMIN or EMPLOYEE role to edit products');
      return;
    }
    try {
      await axios.put(`http://localhost:8080/api/v2/products/${editingProduct.id}`, {
        ...editingProduct,
        price: parseFloat(editingProduct.price),
        initialQuantity: parseInt(editingProduct.initialQuantity, 10),
        minimumStock: parseInt(editingProduct.minimumStock, 10) || 5
      }, {
        headers: { Authorization: `Bearer ${keycloak.token}` }
      });
      setIsEditModalOpen(false);
      fetchProducts();
      setError('');
      setSuccessMessage('Product updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error updating product:', err);
      setError(err.response?.data?.message || 'Failed to update product');
    }
  };

  const deleteProduct = async (id) => {
    if (isGuest) {
      setError('You need to login to delete products');
      return;
    }
    if (!isAdmin) {
      setError('You need ADMIN role to delete products');
      return;
    }
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`http://localhost:8080/api/v2/products/${id}`, {
          headers: { Authorization: `Bearer ${keycloak.token}` }
        });
        fetchProducts();
        setError('');
        setSuccessMessage('Product deleted successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Error deleting product:', err);
        setError('Failed to delete product');
      }
    }
  };

  const openEditModal = (product) => {
    if (isGuest) {
      setError('You need to login to edit products');
      return;
    }
    setEditingProduct({ ...product });
    setIsEditModalOpen(true);
  };

  const openStockModal = (product) => {
    if (isGuest) {
      setError('You need to login to manage stock');
      return;
    }
    setSelectedProductForStock(product);
    setIsStockModalOpen(true);
  };

  const getStockStatusClass = (product) => {
    const quantity = product.initialQuantity || 0;
    const minimumStock = product.minimumStock || 5;

    if (quantity === 0) return 'out-of-stock';
    if (quantity <= minimumStock) return 'low-stock';
    return 'in-stock';
  };

  const getStockStatusText = (product) => {
    const quantity = product.initialQuantity || 0;
    const minimumStock = product.minimumStock || 5;

    if (quantity === 0) return 'Out of Stock';
    if (quantity <= minimumStock) return 'Low Stock';
    return 'In Stock';
  };

  // Estadísticas
  const totalProducts = filteredProducts.length;
  const totalValue = isGuest ? null : filteredProducts.reduce((sum, product) =>
      sum + (product.price * (product.initialQuantity || 0)), 0).toFixed(2);
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const lowStockProducts = isGuest ? null : products.filter(p => {
    const minimumStock = p.minimumStock || 5;
    return p.initialQuantity <= minimumStock && p.initialQuantity > 0;
  }).length;
  const outOfStockProducts = isGuest ? null : products.filter(p =>
      (p.initialQuantity || 0) === 0).length;
  const averagePrice = (filteredProducts.reduce((sum, p) => sum + p.price, 0) /
      (filteredProducts.length || 1)).toFixed(2);

  return (
      <div className="app-container">
        <header className="app-header">
          <h1>Inventory Management System</h1>
          <div className="header-actions">
            {/* Botones de navegación */}
            {(isAdmin || isEmployee) && (
                <button
                    className="nav-button"
                    onClick={() => setIsHistoryModalOpen(true)}
                >
                  📊 View History
                </button>
            )}
            <div className="user-info">
            <span className={`role-badge ${userRole.toLowerCase()}`}>
              {userRole}
            </span>
              {keycloak.authenticated ? (
                  <>
                    <span>Welcome, <strong>{keycloak.tokenParsed?.preferred_username || 'User'}</strong></span>
                    <button className="logout-button" onClick={() => keycloak.logout()}>
                      Logout
                    </button>
                  </>
              ) : (
                  <>
                    <span>Browsing as <strong>Guest</strong></span>
                    <button className="login-button" onClick={() => keycloak.login()}>
                      Login
                    </button>
                  </>
              )}
            </div>
          </div>
        </header>

        <main className="main-content">
          {/* Alertas de Stock Bajo */}
          {!isGuest && showAlerts && lowStockAlerts.length > 0 && (
              <div className="stock-alerts">
                <div className="alerts-header">
                  <h3>⚠️ Stock Alerts ({lowStockAlerts.length})</h3>
                  <button
                      className="hide-alerts-btn"
                      onClick={() => setShowAlerts(false)}
                  >
                    Hide
                  </button>
                </div>
                <div className="alerts-list">
                  {lowStockAlerts.slice(0, 3).map(product => (
                      <div key={product.id} className="alert-item">
                  <span className="alert-text">
                    <strong>{product.name}</strong> -
                    {product.initialQuantity === 0 ? ' Out of Stock' : ` Low Stock (${product.initialQuantity})`}
                  </span>
                        <div className="alert-actions">
                          <button
                              className="update-stock-btn"
                              onClick={() => openStockModal(product)}
                          >
                            Update Stock
                          </button>
                          <button
                              className="dismiss-alert-btn"
                              onClick={() => dismissAlert(product.id)}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                  ))}
                  {lowStockAlerts.length > 3 && (
                      <div className="more-alerts">
                        +{lowStockAlerts.length - 3} more alerts
                      </div>
                  )}
                </div>
              </div>
          )}

          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}

          {(isAdmin || isEmployee) && (
              <button className="add-product-button" onClick={() => setIsCreateModalOpen(true)}>
                + Add New Product
              </button>
          )}

          {/* Panel de filtros */}
          <div className="filters-panel">
            <div className="search-box">
              <input
                  type="text"
                  placeholder="Search by name, description or category"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="search-button">
                <i className="search-icon">🔍</i>
              </button>
            </div>

            <div className="filter-group">
              <label>Category:</label>
              <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Price Range:</label>
              <div className="price-range">
                <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([parseFloat(e.target.value) || 0, priceRange[1]])}
                    min="0"
                />
                <span>to</span>
                <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseFloat(e.target.value) || 10000])}
                    min={priceRange[0]}
                />
              </div>
            </div>

            {!isGuest && (
                <div className="filter-group">
                  <label>Stock Status:</label>
                  <select
                      value={stockFilter}
                      onChange={(e) => setStockFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="low">Low Stock</option>
                    <option value="out">Out of Stock</option>
                    <option value="in">In Stock</option>
                  </select>
                </div>
            )}
          </div>

          {/* Estadísticas */}
          <div className="advanced-stats">
            <div className="stat-card">
              <h3>Total Products</h3>
              <p>{totalProducts}</p>
            </div>
            <div className="stat-card">
              <h3>Categories</h3>
              <p>{categories.length}</p>
            </div>
            <div className="stat-card">
              <h3>Average Price</h3>
              <p>${averagePrice}</p>
            </div>
            {!isGuest && totalValue && (
                <div className="stat-card">
                  <h3>Total Inventory Value</h3>
                  <p>${totalValue}</p>
                </div>
            )}
            {!isGuest && lowStockProducts !== null && (
                <div className="stat-card alert-stat">
                  <h3>Low Stock Items</h3>
                  <p>{lowStockProducts}</p>
                </div>
            )}
            {!isGuest && outOfStockProducts !== null && (
                <div className="stat-card alert-stat">
                  <h3>Out of Stock</h3>
                  <p>{outOfStockProducts}</p>
                </div>
            )}
          </div>

          {/* Modales */}
          {(isAdmin || isEmployee) && (
              <>
                {/* Modal para crear producto */}
                <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
                  <h2>Create New Product</h2>
                  <form className="modal-form" onSubmit={handleCreateSubmit}>
                    <div className="form-group">
                      <label>Name</label>
                      <input
                          type="text"
                          name="name"
                          value={newProduct.name}
                          onChange={handleInputChange}
                          required
                      />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <input
                          type="text"
                          name="description"
                          value={newProduct.description}
                          onChange={handleInputChange}
                          required
                      />
                    </div>
                    <div className="form-group">
                      <label>Category</label>
                      <input
                          type="text"
                          name="category"
                          value={newProduct.category}
                          onChange={handleInputChange}
                          required
                      />
                    </div>
                    <div className="form-group">
                      <label>Price</label>
                      <input
                          type="number"
                          name="price"
                          value={newProduct.price}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          required
                      />
                    </div>
                    <div className="form-group">
                      <label>Initial Quantity</label>
                      <input
                          type="number"
                          name="initialQuantity"
                          value={newProduct.initialQuantity}
                          onChange={handleInputChange}
                          min="0"
                          required
                      />
                    </div>
                    <div className="form-group">
                      <label>Minimum Stock Alert</label>
                      <input
                          type="number"
                          name="minimumStock"
                          value={newProduct.minimumStock}
                          onChange={handleInputChange}
                          min="0"
                          placeholder="5"
                      />
                    </div>
                    <div className="form-actions">
                      <button type="submit">Create Product</button>
                      <button type="button" onClick={() => setIsCreateModalOpen(false)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </Modal>

                {/* Modal para editar producto */}
                <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
                  <h2>Edit Product</h2>
                  {editingProduct && (
                      <form className="modal-form" onSubmit={handleEditSubmit}>
                        <div className="form-group">
                          <label>Name</label>
                          <input
                              type="text"
                              name="name"
                              value={editingProduct.name}
                              onChange={handleInputChange}
                              required
                          />
                        </div>
                        <div className="form-group">
                          <label>Description</label>
                          <input
                              type="text"
                              name="description"
                              value={editingProduct.description}
                              onChange={handleInputChange}
                              required
                          />
                        </div>
                        <div className="form-group">
                          <label>Category</label>
                          <input
                              type="text"
                              name="category"
                              value={editingProduct.category}
                              onChange={handleInputChange}
                              required
                          />
                        </div>
                        <div className="form-group">
                          <label>Price</label>
                          <input
                              type="number"
                              name="price"
                              value={editingProduct.price}
                              onChange={handleInputChange}
                              step="0.01"
                              min="0"
                              required
                          />
                        </div>
                        <div className="form-group">
                          <label>Quantity</label>
                          <input
                              type="number"
                              name="initialQuantity"
                              value={editingProduct.initialQuantity}
                              onChange={handleInputChange}
                              min="0"
                              required
                          />
                        </div>
                        <div className="form-group">
                          <label>Minimum Stock Alert</label>
                          <input
                              type="number"
                              name="minimumStock"
                              value={editingProduct.minimumStock || ''}
                              onChange={handleInputChange}
                              min="0"
                              placeholder="5"
                          />
                        </div>
                        <div className="form-actions">
                          <button type="submit">Update Product</button>
                          <button type="button" onClick={() => setIsEditModalOpen(false)}>
                            Cancel
                          </button>
                        </div>
                      </form>
                  )}
                </Modal>

                {/* Modal para movimiento de stock */}
                <StockMovementModal
                    isOpen={isStockModalOpen}
                    onClose={() => {
                      setIsStockModalOpen(false);
                      setSelectedProductForStock(null);
                    }}
                    product={selectedProductForStock}
                    onUpdateStock={updateStock}
                />

                {/* Modal para historial */}
                <Modal
                    isOpen={isHistoryModalOpen}
                    onClose={() => setIsHistoryModalOpen(false)}
                    className="history-modal"
                >
                  <StockHistory keycloak={keycloak} />
                </Modal>
              </>
          )}

          {/* Lista de productos */}
          <section className="product-list-section">
            <h2>Product List ({filteredProducts.length} items)</h2>
            {isLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading products...</p>
                </div>
            ) : filteredProducts.length === 0 ? (
                <p>No products match your filters.</p>
            ) : (
                <>
                  <div className="product-table-container">
                    <table className="product-table">
                      <thead>
                      <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Price</th>
                        {!isGuest && <th>Quantity</th>}
                        {!isGuest && <th>Min Stock</th>}
                        {isGuest && <th>Availability</th>}
                        <th>Status</th>
                        {(isAdmin || isEmployee) && <th>Actions</th>}
                      </tr>
                      </thead>
                      <tbody>
                      {currentItems.map((product) => (
                          <tr key={product.id}>
                            <td>{product.name}</td>
                            <td>{product.description}</td>
                            <td>{product.category}</td>
                            <td>${product.price.toFixed(2)}</td>
                            {!isGuest && (
                                <td className={getStockStatusClass(product)}>
                                  {product.initialQuantity}
                                </td>
                            )}
                            {!isGuest && (
                                <td>{product.minimumStock || 5}</td>
                            )}
                            {isGuest && (
                                <td className={product.initialQuantity > 0 ? 'available' : 'out-of-stock'}>
                                  {product.initialQuantity > 0 ? 'Available' : 'Out of Stock'}
                                </td>
                            )}
                            <td>
                          <span className={`status-badge ${getStockStatusClass(product)}`}>
                            {getStockStatusText(product)}
                          </span>
                            </td>
                            {(isAdmin || isEmployee) && (
                                <td>
                                  <div className="actions">
                                    <button
                                        className="stock-btn"
                                        onClick={() => openStockModal(product)}
                                        title="Update Stock"
                                    >
                                      📦
                                    </button>
                                    <button
                                        className="edit-btn"
                                        onClick={() => openEditModal(product)}
                                    >
                                      Edit
                                    </button>
                                    {isAdmin && (
                                        <button
                                            className="delete-btn"
                                            onClick={() => deleteProduct(product.id)}
                                        >
                                          Delete
                                        </button>
                                    )}
                                  </div>
                                </td>
                            )}
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginación */}
                  <div className="pagination">
                    <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                      Previous
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                        <button
                            key={number}
                            onClick={() => paginate(number)}
                            className={currentPage === number ? 'active' : ''}
                        >
                          {number}
                        </button>
                    ))}

                    <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                </>
            )}
          </section>
        </main>
      </div>
  );
};

export default App;