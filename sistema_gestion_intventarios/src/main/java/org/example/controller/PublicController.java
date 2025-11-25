package org.example.controller;

import org.example.dto.ProductDTO;
import org.example.service.ProductService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/public")
public class PublicController {

    private final ProductService productService;

    public PublicController(ProductService productService) {
        this.productService = productService;
    }

    // === ENDPOINTS PÚBLICOS PARA USUARIOS GUEST ===

    @GetMapping("/products")
    public List<ProductDTO> getAllProductsPublic() {
        // Solo información básica, sin datos sensibles
        return productService.getAllProducts().stream()
                .map(this::sanitizeProductForGuest)
                .collect(Collectors.toList());
    }

    @GetMapping("/products/{id}")
    public ProductDTO getProductByIdPublic(@PathVariable Long id) {
        ProductDTO product = productService.getProductById(id);
        return sanitizeProductForGuest(product);
    }

    @GetMapping("/products/category/{category}")
    public List<ProductDTO> getProductsByCategoryPublic(@PathVariable String category) {
        return productService.findProductsByCategory(category).stream()
                .map(this::sanitizeProductForGuest)
                .collect(Collectors.toList());
    }

    @GetMapping("/products/available")
    public List<ProductDTO> getAvailableProductsPublic() {
        return productService.getAllProducts().stream()
                .filter(p -> p.getInitialQuantity() > 0) // Solo productos disponibles
                .map(this::sanitizeProductForGuest)
                .collect(Collectors.toList());
    }

    @GetMapping("/categories")
    public List<String> getCategoriesPublic() {
        return productService.getAllCategories();
    }

    @GetMapping("/stats/basic")
    public Map<String, Object> getBasicStatsPublic() {
        Map<String, Object> stats = productService.getBasicStats();
        // Remover información sensible para usuarios GUEST
        return Map.of(
                "totalProducts", stats.get("totalProducts"),
                "categories", stats.get("categories"),
                "availableProducts", stats.get("totalProducts")
        );
    }

    // Método para sanear datos sensibles para usuarios GUEST
    private ProductDTO sanitizeProductForGuest(ProductDTO product) {
        // Crear copia sin información sensible
        ProductDTO publicProduct = new ProductDTO();
        publicProduct.setId(product.getId());
        publicProduct.setName(product.getName());
        publicProduct.setDescription(product.getDescription());
        publicProduct.setCategory(product.getCategory());
        publicProduct.setPrice(product.getPrice());

        // Solo mostrar disponibilidad básica, no cantidades exactas
        publicProduct.setOutOfStock(product.getOutOfStock());
        // NO mostrar: initialQuantity, minimumStock, lowStock, totalValue

        return publicProduct;
    }
}