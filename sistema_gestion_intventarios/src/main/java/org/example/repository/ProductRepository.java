package org.example.repository;

import org.example.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    // Métodos existentes
    Optional<Product> findByName(String name);
    List<Product> findByCategory(String category);

    // Nuevos métodos para control de stock

    // Products with low stock (quantity <= minimum stock)
    @Query("SELECT p FROM Product p WHERE p.initialQuantity <= p.minimumStock")
    List<Product> findLowStockProducts();

    // Products out of stock
    @Query("SELECT p FROM Product p WHERE p.initialQuantity = 0")
    List<Product> findOutOfStockProducts();

    // Products with available stock
    @Query("SELECT p FROM Product p WHERE p.initialQuantity > 0")
    List<Product> findInStockProducts();

    // Find products by price range
    List<Product> findByPriceBetween(BigDecimal minPrice, BigDecimal maxPrice);

    // Find products by name (contains text)
    @Query("SELECT p FROM Product p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Product> findByNameContainingIgnoreCase(@Param("name") String name);

    // Find products by description (contains text)
    @Query("SELECT p FROM Product p WHERE LOWER(p.description) LIKE LOWER(CONCAT('%', :description, '%'))")
    List<Product> findByDescriptionContainingIgnoreCase(@Param("description") String description);

    // Combined search (name, description or category)
    @Query("SELECT p FROM Product p WHERE " +
            "LOWER(p.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(p.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(p.category) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<Product> findBySearchTerm(@Param("searchTerm") String searchTerm);

    // Get all unique categories
    @Query("SELECT DISTINCT p.category FROM Product p ORDER BY p.category")
    List<String> findAllCategories();

    // Count products by category
    @Query("SELECT COUNT(p) FROM Product p WHERE p.category = :category")
    Long countByCategory(@Param("category") String category);

    // Total inventory value
    @Query("SELECT COALESCE(SUM(p.price * p.initialQuantity), 0) FROM Product p")
    BigDecimal getTotalInventoryValue();

    // Most expensive products
    @Query("SELECT p FROM Product p ORDER BY p.price DESC")
    List<Product> findTopExpensiveProducts();

    // Products with most stock
    @Query("SELECT p FROM Product p ORDER BY p.initialQuantity DESC")
    List<Product> findTopStockProducts();
}