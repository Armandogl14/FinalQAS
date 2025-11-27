package com.inventory.stress;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.Main;
import org.example.dto.ProductDTO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.List;
import java.util.ArrayList;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = org.example.Main.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
public class SimpleStressTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testConcurrentProductReads() throws InterruptedException {
        int numberOfThreads = 20;
        int requestsPerThread = 10;
        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch latch = new CountDownLatch(numberOfThreads);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger errorCount = new AtomicInteger(0);

        long startTime = System.currentTimeMillis();

        for (int i = 0; i < numberOfThreads; i++) {
            executor.submit(() -> {
                try {
                    for (int j = 0; j < requestsPerThread; j++) {
                        try {
                            MvcResult result = mockMvc.perform(get("/api/public/products"))
                                    .andExpect(status().isOk())
                                    .andReturn();
                            successCount.incrementAndGet();

                            // Simular tiempo de procesamiento del cliente
                            Thread.sleep(10);
                        } catch (Exception e) {
                            errorCount.incrementAndGet();
                            System.err.println("Error en request: " + e.getMessage());
                        }
                    }
                } finally {
                    latch.countDown();
                }
            });
        }

        boolean finished = latch.await(60, TimeUnit.SECONDS);
        long endTime = System.currentTimeMillis();

        executor.shutdown();

        // Métricas de rendimiento
        int totalRequests = numberOfThreads * requestsPerThread;
        double durationSeconds = (endTime - startTime) / 1000.0;
        double requestsPerSecond = totalRequests / durationSeconds;
        double successRate = (double) successCount.get() / totalRequests * 100;

        System.out.println("=== RESULTADOS DE PRUEBA DE ESTRÉS ===");
        System.out.printf("Hilos concurrentes: %d%n", numberOfThreads);
        System.out.printf("Requests por hilo: %d%n", requestsPerThread);
        System.out.printf("Total requests: %d%n", totalRequests);
        System.out.printf("Requests exitosos: %d%n", successCount.get());
        System.out.printf("Requests con error: %d%n", errorCount.get());
        System.out.printf("Duración: %.2f segundos%n", durationSeconds);
        System.out.printf("Requests por segundo: %.2f%n", requestsPerSecond);
        System.out.printf("Tasa de éxito: %.2f%%%n", successRate);

        assertTrue(finished, "La prueba debería completarse dentro del tiempo límite");
        assertTrue(successRate > 95, "La tasa de éxito debería ser mayor al 95%");
        assertTrue(requestsPerSecond > 10, "Debería manejar al menos 10 requests por segundo");
    }

    @Test
    void testProductCreationUnderLoad() throws InterruptedException {
        int numberOfThreads = 8;
        int productsPerThread = 4;
        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch latch = new CountDownLatch(numberOfThreads);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger errorCount = new AtomicInteger(0);
        List<String> errors = new CopyOnWriteArrayList<>();

        for (int i = 0; i < numberOfThreads; i++) {
            final int threadId = i;
            executor.submit(() -> {
                try {
                    for (int j = 0; j < productsPerThread; j++) {
                        try {
                            ProductDTO product = createTestProduct(threadId, j);
                            String json = objectMapper.writeValueAsString(product);

                            mockMvc.perform(post("/api/v2/products")
                                            .contentType(MediaType.APPLICATION_JSON)
                                            .content(json))
                                    .andExpect(status().isCreated());

                            successCount.incrementAndGet();
                        } catch (Exception e) {
                            errorCount.incrementAndGet();
                            errors.add(String.format("Thread %d, Product %d: %s",
                                    threadId, j, e.getMessage()));
                        }
                    }
                } finally {
                    latch.countDown();
                }
            });
        }

        boolean finished = latch.await(45, TimeUnit.SECONDS);
        executor.shutdown();

        int totalProducts = numberOfThreads * productsPerThread;
        double successRate = (double) successCount.get() / totalProducts * 100;

        System.out.println("=== PRUEBA DE CREACIÓN BAJO CARGA ===");
        System.out.printf("Productos creados exitosamente: %d/%d%n",
                successCount.get(), totalProducts);
        System.out.printf("Errores: %d%n", errorCount.get());
        System.out.printf("Tasa de éxito: %.2f%%%n", successRate);

        if (!errors.isEmpty()) {
            System.out.println("Errores encontrados:");
            errors.forEach(System.out::println);
        }

        assertTrue(finished, "La prueba debería completarse dentro del tiempo límite");
        assertTrue(successRate > 70, "La tasa de éxito en creación debería ser mayor al 70%");
    }

    @Test
    void testMemoryUsageUnderLoad() throws InterruptedException {
        Runtime runtime = Runtime.getRuntime();

        // Medición inicial
        System.gc();
        long initialMemory = runtime.totalMemory() - runtime.freeMemory();

        int iterations = 100;
        ExecutorService executor = Executors.newFixedThreadPool(5);
        CountDownLatch latch = new CountDownLatch(iterations);

        for (int i = 0; i < iterations; i++) {
            executor.submit(() -> {
                try {
                    // Simular carga de trabajo con múltiples requests
                    mockMvc.perform(get("/api/public/products"))
                            .andExpect(status().isOk());

                    mockMvc.perform(get("/api/v2/products/categories"))
                            .andExpect(status().isOk());

                } catch (Exception e) {
                    System.err.println("Error en prueba de memoria: " + e.getMessage());
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await(30, TimeUnit.SECONDS);
        executor.shutdown();

        // Medición final
        System.gc();
        Thread.sleep(1000); // Dar tiempo al GC
        long finalMemory = runtime.totalMemory() - runtime.freeMemory();

        long memoryIncrease = finalMemory - initialMemory;
        double memoryIncreaseMB = memoryIncrease / (1024.0 * 1024.0);

        System.out.println("=== ANÁLISIS DE MEMORIA ===");
        System.out.printf("Memoria inicial: %.2f MB%n", initialMemory / (1024.0 * 1024.0));
        System.out.printf("Memoria final: %.2f MB%n", finalMemory / (1024.0 * 1024.0));
        System.out.printf("Incremento de memoria: %.2f MB%n", memoryIncreaseMB);

        // Validar que no haya fugas de memoria significativas
        assertTrue(memoryIncreaseMB < 50,
                String.format("El incremento de memoria (%.2f MB) parece excesivo", memoryIncreaseMB));
    }

    @Test
    void testDatabaseConnectionPoolUnderStress() throws InterruptedException {
        int numberOfThreads = 25; // Más que el pool size típico
        int queriesPerThread = 8;
        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch latch = new CountDownLatch(numberOfThreads);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger timeoutCount = new AtomicInteger(0);

        long startTime = System.currentTimeMillis();

        for (int i = 0; i < numberOfThreads; i++) {
            executor.submit(() -> {
                try {
                    for (int j = 0; j < queriesPerThread; j++) {
                        try {
                            // Mix de operaciones que requieren DB
                            mockMvc.perform(get("/api/public/products"))
                                    .andExpect(status().isOk());

                            mockMvc.perform(get("/api/v2/products/stats"))
                                    .andExpect(status().isOk());

                            successCount.incrementAndGet();

                        } catch (Exception e) {
                            if (e.getMessage().contains("timeout") ||
                                    e.getMessage().contains("connection")) {
                                timeoutCount.incrementAndGet();
                            }
                        }
                    }
                } finally {
                    latch.countDown();
                }
            });
        }

        boolean finished = latch.await(45, TimeUnit.SECONDS);
        long endTime = System.currentTimeMillis();
        executor.shutdown();

        int totalQueries = numberOfThreads * queriesPerThread;
        double durationSeconds = (endTime - startTime) / 1000.0;
        double successRate = (double) successCount.get() / totalQueries * 100;

        System.out.println("=== PRUEBA DE POOL DE CONEXIONES ===");
        System.out.printf("Hilos concurrentes: %d%n", numberOfThreads);
        System.out.printf("Consultas exitosas: %d/%d%n", successCount.get(), totalQueries);
        System.out.printf("Timeouts de conexión: %d%n", timeoutCount.get());
        System.out.printf("Tasa de éxito: %.2f%%%n", successRate);
        System.out.printf("Duración: %.2f segundos%n", durationSeconds);

        assertTrue(finished, "La prueba debería completarse sin timeouts generales");
        assertTrue(successRate > 90, "La tasa de éxito debería ser mayor al 90%");
        assertTrue(timeoutCount.get() < totalQueries * 0.05,
                "Los timeouts de conexión deberían ser menos del 5%");
    }

    private ProductDTO createTestProduct(int threadId, int productId) {
        ProductDTO product = new ProductDTO();
        product.setName(String.format("StressTest-T%d-P%d", threadId, productId));
        product.setDescription("Producto creado durante prueba de estrés");
        product.setCategory("Test");
        product.setPrice(BigDecimal.valueOf(Math.random() * 100 + 10));
        product.setInitialQuantity((int) (Math.random() * 50 + 1));
        product.setMinimumStock(5);
        return product;
    }
}