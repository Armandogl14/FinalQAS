package org.example.service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.example.dto.ProductDTO;
import org.example.dto.ProductSearchDTO;
import org.example.entity.Product;
import org.example.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProductServiceImpl implements ProductService {

    private final ProductRepository repository;
    private final Counter productCreationsCounter;
    private final Counter productDeletionsCounter;


    public ProductServiceImpl(ProductRepository repository,
                              Counter productCreationsCounter,
                              Counter productDeletionsCounter) {
        this.repository = repository;
        this.productCreationsCounter = productCreationsCounter;
        this.productDeletionsCounter = productDeletionsCounter;
    }

    // === CRUD BÁSICO ===

    @Override
    public ProductDTO createProduct(ProductDTO productDTO) {
        Product product = productDTO.toEntity();
        validateProduct(product);
        Product saved = repository.save(product);

        // Incrementar métrica de productos creados
        productCreationsCounter.increment();

        return ProductDTO.from(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductDTO> getAllProducts() {
        return repository.findAll().stream()
                .map(ProductDTO::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ProductDTO getProductById(Long id) {
        Product product = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        return ProductDTO.from(product);
    }

    @Override
    public ProductDTO updateProduct(Long id, ProductDTO productDTO) {
        Product existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        productDTO.updateEntity(existing);
        validateProduct(existing);
        Product updated = repository.save(existing);
        return ProductDTO.from(updated);
    }

    @Override
    public void deleteProduct(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Product not found with id: " + id);
        }
        repository.deleteById(id);

        // Incrementar métrica de productos eliminados
        productDeletionsCounter.increment();
    }

    // === Resto de métodos sin cambios ===

    @Override
    @Transactional(readOnly = true)
    public List<ProductDTO> searchProducts(ProductSearchDTO searchDTO) {
        List<Product> products = repository.findAll();

        // Filtros básicos
        if (searchDTO.getSearchTerm() != null && !searchDTO.getSearchTerm().trim().isEmpty()) {
            products = repository.findBySearchTerm(searchDTO.getSearchTerm());
        }

        if (searchDTO.getCategory() != null && !searchDTO.getCategory().trim().isEmpty()) {
            products = products.stream()
                    .filter(p -> searchDTO.getCategory().equals(p.getCategory()))
                    .collect(Collectors.toList());
        }

        if (searchDTO.getMinPrice() != null && searchDTO.getMaxPrice() != null) {
            products = products.stream()
                    .filter(p -> p.getPrice().compareTo(searchDTO.getMinPrice()) >= 0 &&
                            p.getPrice().compareTo(searchDTO.getMaxPrice()) <= 0)
                    .collect(Collectors.toList());
        }

        if (Boolean.TRUE.equals(searchDTO.getLowStockOnly())) {
            products = products.stream()
                    .filter(Product::isLowStock)
                    .collect(Collectors.toList());
        }

        if (Boolean.TRUE.equals(searchDTO.getOutOfStockOnly())) {
            products = products.stream()
                    .filter(Product::isOutOfStock)
                    .collect(Collectors.toList());
        }

        return products.stream()
                .map(ProductDTO::from)
                .collect(Collectors.toList());
    }

    // === Resto de métodos mantienen la implementación original ===

    @Override
    @Transactional(readOnly = true)
    public List<ProductDTO> findProductsByCategory(String category) {
        return repository.findByCategory(category).stream()
                .map(ProductDTO::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductDTO> findLowStockProducts() {
        return repository.findLowStockProducts().stream()
                .map(ProductDTO::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductDTO> findOutOfStockProducts() {
        return repository.findOutOfStockProducts().stream()
                .map(ProductDTO::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getAllCategories() {
        return repository.findAllCategories();
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getBasicStats() {
        List<Product> allProducts = repository.findAll();
        List<Product> lowStock = repository.findLowStockProducts();
        List<Product> outOfStock = repository.findOutOfStockProducts();
        BigDecimal totalValue = repository.getTotalInventoryValue();

        return Map.of(
                "totalProducts", allProducts.size(),
                "lowStockCount", lowStock.size(),
                "outOfStockCount", outOfStock.size(),
                "totalValue", totalValue != null ? totalValue : BigDecimal.ZERO,
                "categories", getAllCategories().size()
        );
    }

    // === MÉTODOS LEGACY sin cambios ===

    @Override
    @Deprecated
    public Product saveLegacy(Product product) {
        validateProduct(product);
        if (product.getMinimumStock() == null) {
            product.setMinimumStock(5);
        }
        return repository.save(product);
    }

    @Override
    @Deprecated
    @Transactional(readOnly = true)
    public List<Product> findAllLegacy() {
        return repository.findAll();
    }

    @Override
    @Deprecated
    @Transactional(readOnly = true)
    public Product findByIdLegacy(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
    }

    @Override
    @Deprecated
    public Product updateLegacy(Long id, Product product) {
        Product existing = findByIdLegacy(id);
        existing.setName(product.getName());
        existing.setDescription(product.getDescription());
        existing.setCategory(product.getCategory());
        existing.setPrice(product.getPrice());
        existing.setInitialQuantity(product.getInitialQuantity());

        if (product.getMinimumStock() != null) {
            existing.setMinimumStock(product.getMinimumStock());
        }

        validateProduct(existing);
        return repository.save(existing);
    }

    // === VALIDACIÓN PRIVADA sin cambios ===

    private void validateProduct(Product product) {
        if (product.getName() == null || product.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Name cannot be empty");
        }
        if (product.getPrice() == null || product.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Price must be positive");
        }
        if (product.getInitialQuantity() == null || product.getInitialQuantity() < 0) {
            throw new IllegalArgumentException("Quantity must be non-negative");
        }
        if (product.getMinimumStock() != null && product.getMinimumStock() < 0) {
            throw new IllegalArgumentException("Minimum stock must be non-negative");
        }
    }
}