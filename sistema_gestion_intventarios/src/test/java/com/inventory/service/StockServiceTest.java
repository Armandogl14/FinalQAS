package com.inventory.service;

import org.example.dto.StockMovementDTO;
import org.example.entity.MovementType;
import org.example.entity.Product;
import org.example.entity.StockMovement;
import org.example.repository.ProductRepository;
import org.example.repository.StockMovementRepository;
import org.example.service.StockServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StockServiceTest {

    @Mock
    private StockMovementRepository stockMovementRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private StockServiceImpl stockService;

    private Product product;
    private StockMovementDTO stockMovementDTO;

    @BeforeEach
    void setUp() {
        product = new Product();
        product.setId(1L);
        product.setName("Test Product");
        product.setPrice(BigDecimal.valueOf(100));
        product.setInitialQuantity(50);
        product.setMinimumStock(5);

        stockMovementDTO = new StockMovementDTO();
        stockMovementDTO.setProductId(1L);
        stockMovementDTO.setQuantity(10);
        stockMovementDTO.setReason("Test movement");
    }

    @Test
    void registerStockIn_increasesStockAndCreatesMovement() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(stockMovementRepository.save(any(StockMovement.class))).thenAnswer(invocation -> {
            StockMovement movement = invocation.getArgument(0);
            movement.setId(1L);
            return movement;
        });

        StockMovementDTO result = stockService.registerStockIn(stockMovementDTO, "testuser");

        assertNotNull(result);
        assertEquals(MovementType.STOCK_IN, result.getMovementType());
        assertEquals(50, result.getPreviousQuantity());
        assertEquals(60, result.getNewQuantity());
        assertEquals("testuser", result.getUsername());
        verify(productRepository, times(1)).save(product);
        verify(stockMovementRepository, times(1)).save(any(StockMovement.class));
    }

    @Test
    void registerStockOut_decreasesStockAndCreatesMovement() {
        stockMovementDTO.setQuantity(20);

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(stockMovementRepository.save(any(StockMovement.class))).thenAnswer(invocation -> {
            StockMovement movement = invocation.getArgument(0);
            movement.setId(1L);
            return movement;
        });

        StockMovementDTO result = stockService.registerStockOut(stockMovementDTO, "testuser");

        assertNotNull(result);
        assertEquals(MovementType.STOCK_OUT, result.getMovementType());
        assertEquals(50, result.getPreviousQuantity());
        assertEquals(30, result.getNewQuantity());
        verify(productRepository, times(1)).save(product);
    }

    @Test
    void registerStockOut_throwsExceptionForInsufficientStock() {
        stockMovementDTO.setQuantity(100); // Más del stock disponible

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> stockService.registerStockOut(stockMovementDTO, "testuser"));

        assertTrue(exception.getMessage().contains("Insufficient stock"));
        verify(productRepository, never()).save(any(Product.class));
        verify(stockMovementRepository, never()).save(any(StockMovement.class));
    }

    @Test
    void registerAdjustment_updatesStockAndCreatesMovement() {
        stockMovementDTO.setNewQuantity(25); // Ajustar a 25 unidades

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(stockMovementRepository.save(any(StockMovement.class))).thenAnswer(invocation -> {
            StockMovement movement = invocation.getArgument(0);
            movement.setId(1L);
            return movement;
        });

        StockMovementDTO result = stockService.registerAdjustment(stockMovementDTO, "testuser");

        assertNotNull(result);
        assertEquals(MovementType.ADJUSTMENT, result.getMovementType());
        assertEquals(50, result.getPreviousQuantity());
        assertEquals(25, result.getNewQuantity());
        assertEquals(25, result.getQuantity()); // Diferencia absoluta
        verify(productRepository, times(1)).save(product);
    }

    @Test
    void hasSufficientStock_returnsTrueWhenStockIsSufficient() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        boolean result = stockService.hasSufficientStock(1L, 30);

        assertTrue(result);
    }

    @Test
    void hasSufficientStock_returnsFalseWhenStockIsInsufficient() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        boolean result = stockService.hasSufficientStock(1L, 60);

        assertFalse(result);
    }

    @Test
    void getCurrentStock_returnsCurrentQuantity() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        Integer result = stockService.getCurrentStock(1L);

        assertEquals(50, result);
    }
}