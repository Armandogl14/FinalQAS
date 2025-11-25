package org.example.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.Objects;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    private String category;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(name = "initial_quantity", nullable = false)
    private Integer initialQuantity;

    @Column(name = "minimum_stock", columnDefinition = "integer default 5")
    private Integer minimumStock; // Default value

    // equals method
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Product product = (Product) o;
        return Objects.equals(id, product.id) &&
                Objects.equals(name, product.name) &&
                Objects.equals(description, product.description) &&
                Objects.equals(category, product.category) &&
                Objects.equals(price, product.price) &&
                Objects.equals(initialQuantity, product.initialQuantity) &&
                Objects.equals(minimumStock, product.minimumStock);
    }

    // hashCode method
    @Override
    public int hashCode() {
        return Objects.hash(id, name, description, category, price, initialQuantity, minimumStock);
    }

    // toString method
    @Override
    public String toString() {
        return "Product{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", description='" + description + '\'' +
                ", category='" + category + '\'' +
                ", price=" + price +
                ", initialQuantity=" + initialQuantity +
                ", minimumStock=" + minimumStock +
                '}';
    }

    // Utility method to check low stock
    public boolean isLowStock() {
        return this.initialQuantity <= this.minimumStock;
    }

    // Utility method to check out of stock
    public boolean isOutOfStock() {
        return this.initialQuantity == 0;
    }

    // Asegura que siempre devuelva un valor no nulo
    public Integer getMinimumStock() {
        return minimumStock != null ? minimumStock : 5;
    }

    public void setMinimumStock(Integer minimumStock) {
        this.minimumStock = minimumStock != null ? minimumStock : 5;
    }

}