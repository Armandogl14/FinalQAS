package org.example.controller;

import jakarta.validation.Valid;
import org.example.dto.ProductDTO;
import org.example.dto.ProductSearchDTO;
import org.example.service.ProductService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v2/products")
public class ProductControllerV2 {

    private final ProductService productService;

    public ProductControllerV2(ProductService productService) {
        this.productService = productService;
    }

    // === CRUD BÁSICO ===

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE')")
    public ResponseEntity<ProductDTO> createProduct(@Valid @RequestBody ProductDTO request) {
        try {
            ProductDTO product = productService.createProduct(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(product);
        } catch (Exception e) {
            throw new RuntimeException("Error creating product", e);
        }
    }

    @GetMapping
    @PreAuthorize("permitAll()") // Todos pueden ver (incluyendo GUEST)
    public List<ProductDTO> getAllProducts() {
        return productService.getAllProducts();
    }

    @GetMapping("/{id}")
    @PreAuthorize("permitAll()") // Todos pueden ver
    public ProductDTO getProductById(@PathVariable Long id) {
        return productService.getProductById(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE')")
    public ProductDTO updateProduct(@PathVariable Long id, @Valid @RequestBody ProductDTO request) {
        try {
            return productService.updateProduct(id, request);
        } catch (Exception e) {
            throw new RuntimeException("Error updating product", e);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    // === BÚSQUEDA ===

    @PostMapping("/search")
    @PreAuthorize("permitAll()")
    public List<ProductDTO> searchProducts(@RequestBody ProductSearchDTO searchRequest) {
        return productService.searchProducts(searchRequest);
    }


    @GetMapping("/search")
    public List<ProductDTO> simpleSearch(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean lowStock,
            @RequestParam(required = false) Boolean outOfStock) {

        ProductSearchDTO search = new ProductSearchDTO();
        search.setSearchTerm(searchTerm);
        search.setCategory(category);
        search.setLowStockOnly(lowStock);
        search.setOutOfStockOnly(outOfStock);

        return productService.searchProducts(search);
    }

    @GetMapping("/category/{category}")
    @PreAuthorize("permitAll()")
    public List<ProductDTO> getByCategory(@PathVariable String category) {
        return productService.findProductsByCategory(category);
    }
    // === STOCK STATUS ===

    @GetMapping("/low-stock")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE')") // Info sensible
    public List<ProductDTO> getLowStockProducts() {
        return productService.findLowStockProducts();
    }

    @GetMapping("/out-of-stock")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE')") // Info sensible
    public List<ProductDTO> getOutOfStockProducts() {
        return productService.findOutOfStockProducts();
    }

    // === UTILIDADES ===

    @GetMapping("/categories")
    @PreAuthorize("permitAll()") // Stats básicas públicas
    public List<String> getAllCategories() {
        return productService.getAllCategories();
    }

    @GetMapping("/stats")
    @PreAuthorize("permitAll()")
    public Map<String, Object> getBasicStats() {
        return productService.getBasicStats();
    }

    // === REPORTES DETALLADOS SOLO PARA ADMIN ===

    @GetMapping("/admin/detailed-stats")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> getDetailedStats() {
        // Implementar stats detalladas para administradores
        return productService.getBasicStats(); // Expandir según necesidades
    }
}