package org.example.service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.example.dto.StockMovementDTO;
import org.example.entity.MovementType;
import org.example.entity.Product;
import org.example.entity.StockMovement;
import org.example.repository.ProductRepository;
import org.example.repository.StockMovementRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class StockServiceImpl implements StockService {

    private final StockMovementRepository stockMovementRepository;
    private final ProductRepository productRepository;
    private final MeterRegistry meterRegistry;

    public StockServiceImpl(StockMovementRepository stockMovementRepository,
                            ProductRepository productRepository,
                            MeterRegistry meterRegistry) {
        this.stockMovementRepository = stockMovementRepository;
        this.productRepository = productRepository;
        this.meterRegistry = meterRegistry;
    }

    // === MOVIMIENTOS BÁSICOS ===

    @Override
    public StockMovementDTO registerStockIn(StockMovementDTO request, String username) {
        Product product = getProductById(request.getProductId());
        validateQuantity(request.getQuantity());

        Integer previousQuantity = product.getInitialQuantity();
        Integer newQuantity = previousQuantity + request.getQuantity();

        product.setInitialQuantity(newQuantity);
        productRepository.save(product);

        StockMovement movement = createMovement(product, MovementType.STOCK_IN, request.getQuantity(),
                previousQuantity, newQuantity, username, request.getReason());

        // Registrar métrica
        if (meterRegistry != null) {
            Counter.builder("inventory_stock_movements_total")
                    .tag("type", "stock_in")
                    .register(meterRegistry)
                    .increment();
        }

        return StockMovementDTO.from(movement);
    }

    @Override
    public StockMovementDTO registerStockOut(StockMovementDTO request, String username) {
        Product product = getProductById(request.getProductId());
        validateQuantity(request.getQuantity());

        Integer previousQuantity = product.getInitialQuantity();

        if (previousQuantity < request.getQuantity()) {
            throw new IllegalArgumentException(
                    String.format("Insufficient stock. Available: %d, Requested: %d",
                            previousQuantity, request.getQuantity()));
        }

        Integer newQuantity = previousQuantity - request.getQuantity();
        product.setInitialQuantity(newQuantity);
        productRepository.save(product);

        StockMovement movement = createMovement(product, MovementType.STOCK_OUT, request.getQuantity(),
                previousQuantity, newQuantity, username, request.getReason());

        // Registrar métrica
        if (meterRegistry != null) {
            Counter.builder("inventory_stock_movements_total")
                    .tag("type", "stock_out")
                    .register(meterRegistry)
                    .increment();
        }

        return StockMovementDTO.from(movement);
    }

    @Override
    public StockMovementDTO registerAdjustment(StockMovementDTO request, String username) {
        Product product = getProductById(request.getProductId());

        if (request.getNewQuantity() == null) {
            throw new IllegalArgumentException("New quantity is required for adjustment");
        }

        validateQuantity(request.getNewQuantity());

        Integer previousQuantity = product.getInitialQuantity();
        Integer difference = Math.abs(request.getNewQuantity() - previousQuantity);

        product.setInitialQuantity(request.getNewQuantity());
        productRepository.save(product);

        StockMovement movement = createMovement(product, MovementType.ADJUSTMENT, difference,
                previousQuantity, request.getNewQuantity(), username, request.getReason());

        // Registrar métrica
        if (meterRegistry != null) {
            Counter.builder("inventory_stock_movements_total")
                    .tag("type", "adjustment")
                    .register(meterRegistry)
                    .increment();
        }

        return StockMovementDTO.from(movement);
    }

    @Override
    public StockMovementDTO registerReturn(StockMovementDTO request, String username) {
        Product product = getProductById(request.getProductId());
        validateQuantity(request.getQuantity());

        Integer previousQuantity = product.getInitialQuantity();
        Integer newQuantity = previousQuantity + request.getQuantity();

        product.setInitialQuantity(newQuantity);
        productRepository.save(product);

        StockMovement movement = createMovement(product, MovementType.RETURN, request.getQuantity(),
                previousQuantity, newQuantity, username, request.getReason());

        // Registrar métrica
        if (meterRegistry != null) {
            Counter.builder("inventory_stock_movements_total")
                    .tag("type", "return")
                    .register(meterRegistry)
                    .increment();
        }

        return StockMovementDTO.from(movement);
    }

    @Override
    public StockMovementDTO registerLoss(StockMovementDTO request, String username) {
        Product product = getProductById(request.getProductId());
        validateQuantity(request.getQuantity());

        Integer previousQuantity = product.getInitialQuantity();

        if (previousQuantity < request.getQuantity()) {
            throw new IllegalArgumentException(
                    String.format("Insufficient stock for loss registration. Available: %d, Loss: %d",
                            previousQuantity, request.getQuantity()));
        }

        Integer newQuantity = previousQuantity - request.getQuantity();
        product.setInitialQuantity(newQuantity);
        productRepository.save(product);

        StockMovement movement = createMovement(product, MovementType.LOSS, request.getQuantity(),
                previousQuantity, newQuantity, username, request.getReason());

        // Registrar métrica
        if (meterRegistry != null) {
            Counter.builder("inventory_stock_movements_total")
                    .tag("type", "loss")
                    .register(meterRegistry)
                    .increment();
        }

        return StockMovementDTO.from(movement);
    }

    // === CONSULTAS BÁSICAS ===

    @Override
    @Transactional(readOnly = true)
    public List<StockMovementDTO> getProductHistory(Long productId) {
        Product product = getProductById(productId);
        List<StockMovement> movements = stockMovementRepository.findByProductOrderByTimestampDesc(product);

        return movements.stream()
                .map(StockMovementDTO::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockMovementDTO> getRecentMovements(int limit) {
        List<StockMovement> movements = stockMovementRepository.findAll()
                .stream()
                .sorted((m1, m2) -> m2.getTimestamp().compareTo(m1.getTimestamp()))
                .limit(limit)
                .collect(Collectors.toList());

        return movements.stream()
                .map(StockMovementDTO::from)
                .collect(Collectors.toList());
    }

    // === VALIDACIONES SIMPLES ===

    @Override
    @Transactional(readOnly = true)
    public boolean hasSufficientStock(Long productId, Integer quantity) {
        Product product = getProductById(productId);
        return product.getInitialQuantity() >= quantity;
    }

    @Override
    @Transactional(readOnly = true)
    public Integer getCurrentStock(Long productId) {
        Product product = getProductById(productId);
        return product.getInitialQuantity();
    }

    // === MÉTODOS PRIVADOS AUXILIARES ===

    private Product getProductById(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + productId));
    }

    private void validateQuantity(Integer quantity) {
        if (quantity == null || quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }
    }

    private StockMovement createMovement(Product product, MovementType movementType, Integer quantity,
                                         Integer previousQuantity, Integer newQuantity,
                                         String username, String reason) {
        StockMovement movement = StockMovement.builder()
                .product(product)
                .movementType(movementType)
                .quantity(quantity)
                .previousQuantity(previousQuantity)
                .newQuantity(newQuantity)
                .timestamp(LocalDateTime.now())
                .username(username != null ? username : "System")
                .reason(reason != null ? reason : movementType.getDescription())
                .build();

        return stockMovementRepository.save(movement);
    }
}