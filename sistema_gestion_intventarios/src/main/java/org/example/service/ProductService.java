package org.example.service;

import org.example.dto.ProductDTO;
import org.example.dto.ProductSearchDTO;
import org.example.entity.Product;

import java.util.List;
import java.util.Map;

public interface ProductService {

    // === CRUD BÁSICO ===
    ProductDTO createProduct(ProductDTO productDTO);
    List<ProductDTO> getAllProducts();
    ProductDTO getProductById(Long id);
    ProductDTO updateProduct(Long id, ProductDTO productDTO);
    void deleteProduct(Long id);

    // === BÚSQUEDA SIMPLE ===
    List<ProductDTO> searchProducts(ProductSearchDTO searchDTO);
    List<ProductDTO> findProductsByCategory(String category);

    // === STOCK STATUS ===
    List<ProductDTO> findLowStockProducts();
    List<ProductDTO> findOutOfStockProducts();

    // === UTILIDADES ===
    List<String> getAllCategories();
    Map<String, Object> getBasicStats();

    // === MÉTODOS LEGACY (para v1) ===
    @Deprecated
    Product saveLegacy(Product product);
    @Deprecated
    List<Product> findAllLegacy();
    @Deprecated
    Product findByIdLegacy(Long id);
    @Deprecated
    Product updateLegacy(Long id, Product product);
}