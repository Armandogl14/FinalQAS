package org.example.controller;

import org.example.dto.ProductDTO;
import org.example.dto.StockMovementDTO;
import org.example.service.ProductService;
import org.example.service.StockService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/integration")
@PreAuthorize("hasRole('ADMIN')") // Solo Admin puede acceder a la API de integración
public class IntegrationController {

    private final ProductService productService;
    private final StockService stockService;

    public IntegrationController(ProductService productService, StockService stockService) {
        this.productService = productService;
        this.stockService = stockService;
    }

    // === ENDPOINTS DE INTEGRACIÓN PARA SISTEMAS EXTERNOS ===

    @GetMapping("/products/export")
    public ResponseEntity<List<ProductDTO>> exportProducts() {
        List<ProductDTO> products = productService.getAllProducts();
        return ResponseEntity.ok()
                .header("Content-Type", "application/json")
                .header("Content-Disposition", "attachment; filename=products-export.json")
                .body(products);
    }

    @PostMapping("/products/import")
    public ResponseEntity<Map<String, Object>> importProducts(@RequestBody List<ProductDTO> products) {
        int successCount = 0;
        int errorCount = 0;
        List<String> errors = new ArrayList<>();

        for (ProductDTO productDTO : products) {
            try {
                productService.createProduct(productDTO);
                successCount++;
            } catch (Exception e) {
                errorCount++;
                errors.add("Product " + productDTO.getName() + ": " + e.getMessage());
            }
        }

        Map<String, Object> result = Map.of(
                "totalProcessed", products.size(),
                "successful", successCount,
                "errors", errorCount,
                "errorDetails", errors
        );

        return ResponseEntity.ok(result);
    }

    @GetMapping("/products/sync-status")
    public ResponseEntity<Map<String, Object>> getSyncStatus() {
        Map<String, Object> stats = productService.getBasicStats();

        Map<String, Object> syncStatus = Map.of(
                "lastSyncTime", LocalDateTime.now(),
                "totalProducts", stats.get("totalProducts"),
                "lowStockCount", stats.get("lowStockCount"),
                "outOfStockCount", stats.get("outOfStockCount"),
                "systemStatus", "ACTIVE",
                "apiVersion", "v2.0"
        );

        return ResponseEntity.ok(syncStatus);
    }

    @PostMapping("/stock/bulk-update")
    public ResponseEntity<Map<String, Object>> bulkStockUpdate(
            @RequestBody List<Map<String, Object>> updates,
            Authentication authentication) {

        int successCount = 0;
        int errorCount = 0;
        List<String> errors = new ArrayList<>();

        for (Map<String, Object> update : updates) {
            try {
                Long productId = Long.valueOf(update.get("productId").toString());
                Integer newQuantity = Integer.valueOf(update.get("quantity").toString());
                String reason = update.getOrDefault("reason", "Bulk update via API").toString();

                StockMovementDTO adjustmentRequest = new StockMovementDTO();
                adjustmentRequest.setProductId(productId);
                adjustmentRequest.setNewQuantity(newQuantity);
                adjustmentRequest.setQuantity(1); // Placeholder
                adjustmentRequest.setReason(reason);

                stockService.registerAdjustment(adjustmentRequest, authentication.getName());
                successCount++;
            } catch (Exception e) {
                errorCount++;
                errors.add("Product ID " + update.get("productId") + ": " + e.getMessage());
            }
        }

        Map<String, Object> result = Map.of(
                "totalProcessed", updates.size(),
                "successful", successCount,
                "errors", errorCount,
                "errorDetails", errors
        );

        return ResponseEntity.ok(result);
    }

    @GetMapping("/reports/inventory-summary")
    public ResponseEntity<Map<String, Object>> getInventorySummary() {
        Map<String, Object> basicStats = productService.getBasicStats();
        List<ProductDTO> lowStock = productService.findLowStockProducts();
        List<ProductDTO> outOfStock = productService.findOutOfStockProducts();

        Map<String, Object> summary = new HashMap<>(basicStats);
        summary.put("lowStockProducts", lowStock);
        summary.put("outOfStockProducts", outOfStock);
        summary.put("reportGeneratedAt", LocalDateTime.now());
        summary.put("reportType", "INVENTORY_SUMMARY");

        return ResponseEntity.ok(summary);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = Map.of(
                "status", "UP",
                "timestamp", LocalDateTime.now(),
                "version", "2.0",
                "database", "CONNECTED"
        );
        return ResponseEntity.ok(health);
    }
}