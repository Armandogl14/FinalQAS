package com.inventory.stress;

import org.example.dto.ProductDTO;
import org.example.dto.StockMovementDTO;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
public class StressTestDataGenerator {

    private final Random random = new Random();
    private final String[] categories = {"Electronics", "Clothing", "Books", "Food", "Toys"};
    private final String[] names = {"Product A", "Product B", "Product C", "Product D", "Product E"};

    public List<ProductDTO> generateProducts(int count) {
        List<ProductDTO> products = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            ProductDTO product = new ProductDTO();
            product.setName(names[random.nextInt(names.length)] + " " + i);
            product.setDescription("Description for product " + i);
            product.setCategory(categories[random.nextInt(categories.length)]);
            product.setPrice(BigDecimal.valueOf(10.00 + random.nextDouble() * 990.00));
            product.setInitialQuantity(random.nextInt(100) + 1);
            product.setMinimumStock(5);
            products.add(product);
        }

        return products;
    }

    public StockMovementDTO generateStockMovement(Long productId) {
        StockMovementDTO movement = new StockMovementDTO();
        movement.setProductId(productId);
        movement.setQuantity(random.nextInt(10) + 1);
        movement.setReason("Stress test movement");
        return movement;
    }
}