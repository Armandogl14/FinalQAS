package org.example.config;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.example.repository.ProductRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;

@Configuration
public class MetricsConfig {

    private final MeterRegistry meterRegistry;
    private final ProductRepository productRepository;

    public MetricsConfig(MeterRegistry meterRegistry, ProductRepository productRepository) {
        this.meterRegistry = meterRegistry;
        this.productRepository = productRepository;
    }

    @PostConstruct
    public void initializeGauges() {
        // Registrar gauges directamente sin usar @Bean
        meterRegistry.gauge("inventory_products_total",
                productRepository,
                repo -> {
                    try {
                        return (double) repo.count();
                    } catch (Exception e) {
                        return 0.0;
                    }
                });

        meterRegistry.gauge("inventory_products_low_stock",
                productRepository,
                repo -> {
                    try {
                        return (double) repo.findLowStockProducts().size();
                    } catch (Exception e) {
                        return 0.0;
                    }
                });

        meterRegistry.gauge("inventory_products_out_of_stock",
                productRepository,
                repo -> {
                    try {
                        return (double) repo.findOutOfStockProducts().size();
                    } catch (Exception e) {
                        return 0.0;
                    }
                });

        meterRegistry.gauge("inventory_total_value",
                productRepository,
                repo -> {
                    try {
                        return repo.getTotalInventoryValue().doubleValue();
                    } catch (Exception e) {
                        return 0.0;
                    }
                });

        meterRegistry.gauge("inventory_categories_total",
                productRepository,
                repo -> {
                    try {
                        return (double) repo.findAllCategories().size();
                    } catch (Exception e) {
                        return 0.0;
                    }
                });
    }

    @Bean
    public Counter productCreationsCounter(MeterRegistry meterRegistry) {
        return Counter.builder("inventory_products_created_total")
                .description("Total number of products created")
                .register(meterRegistry);
    }

    @Bean
    public Counter productDeletionsCounter(MeterRegistry meterRegistry) {
        return Counter.builder("inventory_products_deleted_total")
                .description("Total number of products deleted")
                .register(meterRegistry);
    }

    @Bean
    public Timer productOperationTimer(MeterRegistry meterRegistry) {
        return Timer.builder("inventory_product_operation_duration_seconds")
                .description("Time taken for product operations")
                .register(meterRegistry);
    }
}