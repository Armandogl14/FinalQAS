package org.example.repository;

import org.example.entity.MovementType;
import org.example.entity.Product;
import org.example.entity.StockMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {

    // Find movements by product
    List<StockMovement> findByProductOrderByTimestampDesc(Product product);
    Page<StockMovement> findByProductOrderByTimestampDesc(Product product, Pageable pageable);

    // Find movements by type
    List<StockMovement> findByMovementTypeOrderByTimestampDesc(MovementType movementType);
    Page<StockMovement> findByMovementTypeOrderByTimestampDesc(MovementType movementType, Pageable pageable);

    // Find movements by user
    List<StockMovement> findByUsernameOrderByTimestampDesc(String username);
    Page<StockMovement> findByUsernameOrderByTimestampDesc(String username, Pageable pageable);

    // Find movements in date range
    @Query("SELECT sm FROM StockMovement sm WHERE sm.timestamp BETWEEN :startDate AND :endDate ORDER BY sm.timestamp DESC")
    List<StockMovement> findByTimestampBetween(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("SELECT sm FROM StockMovement sm WHERE sm.timestamp BETWEEN :startDate AND :endDate ORDER BY sm.timestamp DESC")
    Page<StockMovement> findByTimestampBetween(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    // Find recent movements
    @Query("SELECT sm FROM StockMovement sm ORDER BY sm.timestamp DESC")
    Page<StockMovement> findRecentMovements(Pageable pageable);

    // Get total stock in by product
    @Query("SELECT COALESCE(SUM(sm.quantity), 0) FROM StockMovement sm WHERE sm.product = :product AND sm.movementType = 'STOCK_IN'")
    Integer getTotalStockInByProduct(@Param("product") Product product);

    // Get total stock out by product
    @Query("SELECT COALESCE(SUM(sm.quantity), 0) FROM StockMovement sm WHERE sm.product = :product AND sm.movementType = 'STOCK_OUT'")
    Integer getTotalStockOutByProduct(@Param("product") Product product);

    // Complex search query
    @Query("SELECT sm FROM StockMovement sm WHERE " +
            "(:productId IS NULL OR sm.product.id = :productId) AND " +
            "(:movementType IS NULL OR sm.movementType = :movementType) AND " +
            "(:username IS NULL OR LOWER(sm.username) LIKE LOWER(CONCAT('%', :username, '%'))) AND " +
            "(:startDate IS NULL OR sm.timestamp >= :startDate) AND " +
            "(:endDate IS NULL OR sm.timestamp <= :endDate)")
    Page<StockMovement> findMovementsByCriteria(
            @Param("productId") Long productId,
            @Param("movementType") MovementType movementType,
            @Param("username") String username,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    // Movement count by product
    Long countByProduct(Product product);

    // Movement count by type
    Long countByMovementType(MovementType movementType);

    // Movement count by user
    Long countByUsername(String username);

    // Most active products (by movement count)
    @Query("SELECT sm.product, COUNT(sm) as movementCount FROM StockMovement sm " +
            "GROUP BY sm.product ORDER BY movementCount DESC")
    List<Object[]> findMostActiveProducts(Pageable pageable);

    // Most active users
    @Query("SELECT sm.username, COUNT(sm) as movementCount FROM StockMovement sm " +
            "GROUP BY sm.username ORDER BY movementCount DESC")
    List<Object[]> findMostActiveUsers(Pageable pageable);
}