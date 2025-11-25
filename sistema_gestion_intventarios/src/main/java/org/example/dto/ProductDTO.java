package org.example.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.example.entity.Product;
import org.example.entity.StockMovement;
import org.example.entity.MovementType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// === PRODUCT DTO UNIFICADO ===
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductDTO {

    private Long id; // null para create, con valor para response

    @NotBlank(message = "Name is required")
    @Size(max = 255, message = "Name cannot exceed 255 characters")
    private String name;

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;

    @Size(max = 100, message = "Category cannot exceed 100 characters")
    private String category;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be positive")
    private BigDecimal price;

    @NotNull(message = "Quantity is required")
    @Min(value = 0, message = "Quantity cannot be negative")
    private Integer initialQuantity;

    @Min(value = 0, message = "Minimum stock cannot be negative")
    private Integer minimumStock = 5;

    // Campos computados (solo para response)
    private Boolean lowStock;
    private Boolean outOfStock;
    private BigDecimal totalValue;

    // === FACTORY METHODS ===

    public static ProductDTO from(Product product) {
        if (product == null) return null;

        ProductDTO dto = new ProductDTO();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setCategory(product.getCategory());
        dto.setPrice(product.getPrice());
        dto.setInitialQuantity(product.getInitialQuantity());
        dto.setMinimumStock(product.getMinimumStock() != null ? product.getMinimumStock() : 5);

        // Campos computados
        dto.setLowStock(product.isLowStock());
        dto.setOutOfStock(product.isOutOfStock());
        dto.setTotalValue(product.getPrice().multiply(BigDecimal.valueOf(product.getInitialQuantity())));

        return dto;
    }

    public Product toEntity() {
        Product product = new Product();
        product.setId(this.id);
        product.setName(this.name);
        product.setDescription(this.description);
        product.setCategory(this.category);
        product.setPrice(this.price);
        product.setInitialQuantity(this.initialQuantity);
        product.setMinimumStock(this.minimumStock != null ? this.minimumStock : 5);
        return product;
    }

    public void updateEntity(Product product) {
        product.setName(this.name);
        product.setDescription(this.description);
        product.setCategory(this.category);
        product.setPrice(this.price);
        product.setInitialQuantity(this.initialQuantity);
        if (this.minimumStock != null) {
            product.setMinimumStock(this.minimumStock);
        }
    }
}

