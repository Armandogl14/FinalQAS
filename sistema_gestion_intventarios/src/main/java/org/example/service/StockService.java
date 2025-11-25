package org.example.service;

import org.example.dto.StockMovementDTO;

import java.util.List;

public interface StockService {

    // === MOVIMIENTOS BÁSICOS ===
    StockMovementDTO registerStockIn(StockMovementDTO request, String username);
    StockMovementDTO registerStockOut(StockMovementDTO request, String username);
    StockMovementDTO registerAdjustment(StockMovementDTO request, String username);
    StockMovementDTO registerReturn(StockMovementDTO request, String username);
    StockMovementDTO registerLoss(StockMovementDTO request, String username);

    // === CONSULTAS BÁSICAS ===
    List<StockMovementDTO> getProductHistory(Long productId);
    List<StockMovementDTO> getRecentMovements(int limit);

    // === VALIDACIONES SIMPLES ===
    boolean hasSufficientStock(Long productId, Integer quantity);
    Integer getCurrentStock(Long productId);
}