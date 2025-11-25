package org.example.controller;

import jakarta.validation.Valid;
import lombok.Getter;
import lombok.Setter;
import org.example.dto.StockMovementDTO;
import org.example.service.StockService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v2/stock")
public class StockController {

    private final StockService stockService;

    public StockController(StockService stockService) {
        this.stockService = stockService;
    }

    // === MOVIMIENTOS DE STOCK ===
    @PostMapping("/movement")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE')")
    public ResponseEntity<StockMovementDTO> registerStockMovement(
            @Valid @RequestBody StockMovementRequest request,
            Authentication authentication) {

        StockMovementDTO movementDTO = new StockMovementDTO();
        movementDTO.setProductId(request.getProductId());
        movementDTO.setQuantity(request.getQuantity());
        movementDTO.setReason(request.getReason());

        StockMovementDTO result;

        switch (request.getMovementType()) {
            case "STOCK_IN":
                result = stockService.registerStockIn(movementDTO, authentication.getName());
                break;
            case "STOCK_OUT":
                result = stockService.registerStockOut(movementDTO, authentication.getName());
                break;
            case "ADJUSTMENT":
                movementDTO.setNewQuantity(request.getQuantity());
                result = stockService.registerAdjustment(movementDTO, authentication.getName());
                break;
            case "RETURN":
                result = stockService.registerReturn(movementDTO, authentication.getName());
                break;
            case "LOSS":
                result = stockService.registerLoss(movementDTO, authentication.getName());
                break;
            default:
                throw new IllegalArgumentException("Invalid movement type: " + request.getMovementType());
        }

        return ResponseEntity.ok(result);
    }

    @Setter
    @Getter
    public static class StockMovementRequest {
        // Getters y setters
        private Long productId;
        private Integer quantity;
        private String movementType;
        private String reason;

    }

    @PostMapping("/in")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE')")
    public StockMovementDTO registerStockIn(
            @Valid @RequestBody StockMovementDTO request,
            Authentication authentication) {
        return stockService.registerStockIn(request, authentication.getName());
    }

    @PostMapping("/out")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE')")
    public StockMovementDTO registerStockOut(
            @Valid @RequestBody StockMovementDTO request,
            Authentication authentication) {
        return stockService.registerStockOut(request, authentication.getName());
    }

    @PostMapping("/adjustment")
    @PreAuthorize("hasRole('ADMIN')")
    public StockMovementDTO registerAdjustment(
            @Valid @RequestBody StockMovementDTO request,
            Authentication authentication) {
        return stockService.registerAdjustment(request, authentication.getName());
    }

    @PostMapping("/return")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE')")
    public StockMovementDTO registerReturn(
            @Valid @RequestBody StockMovementDTO request,
            Authentication authentication) {
        return stockService.registerReturn(request, authentication.getName());
    }

    @PostMapping("/loss")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE')")
    public StockMovementDTO registerLoss(
            @Valid @RequestBody StockMovementDTO request,
            Authentication authentication) {
        return stockService.registerLoss(request, authentication.getName());
    }

    // === CONSULTAS ===

    @GetMapping("/history/{productId}")
    public List<StockMovementDTO> getProductHistory(@PathVariable Long productId) {
        return stockService.getProductHistory(productId);
    }

    @GetMapping("/recent")
    public List<StockMovementDTO> getRecentMovements(
            @RequestParam(defaultValue = "20") int limit) {
        return stockService.getRecentMovements(limit);
    }

    // === VALIDACIONES ===

    @GetMapping("/validate/{productId}")
    public ResponseEntity<Map<String, Object>> validateStock(
            @PathVariable Long productId,
            @RequestParam Integer quantity) {

        boolean sufficient = stockService.hasSufficientStock(productId, quantity);
        Integer currentStock = stockService.getCurrentStock(productId);

        Map<String, Object> response = Map.of(
                "productId", productId,
                "requestedQuantity", quantity,
                "currentStock", currentStock,
                "hasSufficientStock", sufficient
        );

        return ResponseEntity.ok(response);
    }
}