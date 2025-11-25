package org.example.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

// === SIMPLE SEARCH DTO ===
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductSearchDTO {
    private String searchTerm;
    private String category;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private Boolean lowStockOnly;
    private Boolean outOfStockOnly;
}
