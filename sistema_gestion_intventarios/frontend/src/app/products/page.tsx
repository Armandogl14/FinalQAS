'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { productApi, Product, CreateProductDto } from '@/lib/api/products';
import { ProductTable } from '@/components/ProductTable';
import { ProductModal } from '@/components/ProductModal';
import { StockModal } from '@/components/StockModal';
import { FilterBar } from '@/components/FilterBar';
import { Pagination } from '@/components/Pagination';
import { stockApi, MovementType } from '@/lib/api/stock';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function ProductsPage() {
  const { authenticated, token, roles, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState<Product | undefined>();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchProducts();
  }, [authenticated, token]);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = authenticated && token
        ? await productApi.getAll(token)
        : await productApi.getPublic();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...products];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
      );
    }

    if (categoryFilter !== 'all') {
      result = result.filter(p => p.category === categoryFilter);
    }

    if (authenticated && !roles?.isGuest) {
      if (stockFilter === 'low') {
        result = result.filter(p => {
          const minimum = p.minimumStock || 5;
          return p.initialQuantity <= minimum && p.initialQuantity > 0;
        });
      } else if (stockFilter === 'out') {
        result = result.filter(p => p.initialQuantity === 0);
      } else if (stockFilter === 'in') {
        result = result.filter(p => p.initialQuantity > (p.minimumStock || 5));
      }
    }

    setFilteredProducts(result);
    setCurrentPage(1);
  }, [products, searchTerm, categoryFilter, stockFilter, authenticated, roles?.isGuest]);

  const handleCreateProduct = async (data: CreateProductDto) => {
    if (!token) {
      setError('You must be logged in');
      return;
    }
    try {
      await productApi.create(data, token);
      setSuccessMessage('Product created successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleUpdateProduct = async (data: CreateProductDto) => {
    if (!token || !editingProduct) {
      setError('You must be logged in');
      return;
    }
    try {
      await productApi.update(editingProduct.id, data, token);
      setSuccessMessage('Product updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      setIsEditModalOpen(false);
      fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!token || !window.confirm('Are you sure?')) return;
    try {
      await productApi.delete(productId, token);
      setSuccessMessage('Product deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  const handleStockUpdate = async (movementType: MovementType, quantity: number, reason: string) => {
    if (!token || !selectedProductForStock) {
      setError('You must be logged in');
      return;
    }

    try {
      await stockApi.updateStock(
        {
          productId: selectedProductForStock.id,
          quantity,
          movementType,
          reason
        },
        token
      );
      setSuccessMessage('Stock updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      setIsStockModalOpen(false);
      setSelectedProductForStock(undefined);
      fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stock');
    }
  };

  const handleStockClick = (product: Product) => {
    setSelectedProductForStock(product);
    setIsStockModalOpen(true);
  };

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;
  }

  return (
    <div className="space-y-8">
      {error && <div className="p-5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-base">{error}</div>}
      {successMessage && <div className="p-5 bg-green-50 border border-green-200 rounded-xl text-green-700 text-base">{successMessage}</div>}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <h1 className="text-4xl font-bold text-gray-900 text-center sm:text-left w-full sm:w-auto">Products</h1>
        {authenticated && (roles?.isAdmin || roles?.isEmployee) && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition shadow-sm hover:shadow-md text-base"
          >
            <Plus size={22} /> New Product
          </button>
        )}
      </div>

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        categories={categories}
        stockFilter={stockFilter}
        onStockFilterChange={setStockFilter}
        onReset={() => {
          setSearchTerm('');
          setCategoryFilter('all');
          setStockFilter('all');
        }}
      />

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <ProductTable
          products={currentItems}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
          onStock={handleStockClick}
          canEdit={authenticated && (roles?.isAdmin || roles?.isEmployee) || false}
          loading={loading}
        />
        {!loading && filteredProducts.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredProducts.length}
          />
        )}
      </div>

      <ProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProduct}
      />

      <ProductModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingProduct(undefined);
        }}
        onSubmit={handleUpdateProduct}
        product={editingProduct}
      />

      <StockModal
        isOpen={isStockModalOpen}
        onClose={() => {
          setIsStockModalOpen(false);
          setSelectedProductForStock(undefined);
        }}
        product={selectedProductForStock}
        onSubmit={handleStockUpdate}
      />
    </div>
  );
}
