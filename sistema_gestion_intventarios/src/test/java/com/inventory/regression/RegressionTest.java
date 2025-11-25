package com.inventory.regression;

import org.example.Main;
import org.example.dto.ProductDTO;
import org.example.dto.ProductSearchDTO;
import org.example.dto.StockMovementDTO;
import org.example.entity.MovementType;
import org.example.service.ProductService;
import org.example.service.StockService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = Main.class)
@ActiveProfiles("test")
@Transactional
public class RegressionTest {

    @Autowired
    private ProductService productService;

    @Autowired
    private StockService stockService;

    private ProductDTO testProduct;

    @BeforeEach
    void setUp() {
        // Crear un producto de prueba para usar en múltiples tests
        testProduct = new ProductDTO();
        testProduct.setName("Regression Test Product");
        testProduct.setDescription("Product for regression testing");
        testProduct.setCategory("Electronics");
        testProduct.setPrice(new BigDecimal("99.99"));
        testProduct.setInitialQuantity(50);
        testProduct.setMinimumStock(10);
    }

    // === PRUEBAS DE REGRESIÓN PARA PRODUCTOS ===

    @Test
    void testProductCRUD_Regression() {
        // CREATE
        ProductDTO createdProduct = productService.createProduct(testProduct);
        assertNotNull(createdProduct.getId());
        assertEquals("Regression Test Product", createdProduct.getName());
        assertEquals(0, new BigDecimal("99.99").compareTo(createdProduct.getPrice()));
        assertEquals(50, createdProduct.getInitialQuantity());

        // READ
        ProductDTO foundProduct = productService.getProductById(createdProduct.getId());
        assertEquals(createdProduct.getId(), foundProduct.getId());
        assertEquals(createdProduct.getName(), foundProduct.getName());

        // UPDATE
        foundProduct.setPrice(new BigDecimal("129.99"));
        foundProduct.setDescription("Updated description for regression test");
        ProductDTO updatedProduct = productService.updateProduct(foundProduct.getId(), foundProduct);
        assertEquals(0, new BigDecimal("129.99").compareTo(updatedProduct.getPrice()));
        assertEquals("Updated description for regression test", updatedProduct.getDescription());

        // DELETE
        assertDoesNotThrow(() -> productService.deleteProduct(updatedProduct.getId()));

        // Verify deletion
        assertThrows(RuntimeException.class, () ->
                productService.getProductById(updatedProduct.getId()));
    }

    @Test
    void testProductSearch_Regression() {
        // Crear múltiples productos para testing
        createTestProducts();

        // Búsqueda por nombre
        ProductSearchDTO searchByName = new ProductSearchDTO();
        searchByName.setSearchTerm("Laptop");
        List<ProductDTO> results = productService.searchProducts(searchByName);
        assertTrue(results.size() >= 2);
        assertTrue(results.stream().anyMatch(p -> p.getName().contains("Laptop")));

        // Búsqueda por categoría
        ProductSearchDTO searchByCategory = new ProductSearchDTO();
        searchByCategory.setCategory("Electronics");
        results = productService.searchProducts(searchByCategory);
        assertTrue(results.size() >= 2);
        assertTrue(results.stream().allMatch(p -> "Electronics".equals(p.getCategory())));

        // Búsqueda por rango de precio
        ProductSearchDTO searchByPrice = new ProductSearchDTO();
        searchByPrice.setMinPrice(new BigDecimal("800"));
        searchByPrice.setMaxPrice(new BigDecimal("1200"));
        results = productService.searchProducts(searchByPrice);
        assertTrue(results.size() >= 1);
    }

    @Test
    void testProductStockStatus_Regression() {
        // Crear productos con diferentes niveles de stock
        ProductDTO lowStockProduct = createProduct("Low Stock Item", "Electronics",
                new BigDecimal("49.99"), 3, 5);

        ProductDTO outOfStockProduct = createProduct("Out of Stock Item", "Electronics",
                new BigDecimal("29.99"), 0, 5);

        ProductDTO normalStockProduct = createProduct("Normal Stock Item", "Electronics",
                new BigDecimal("79.99"), 20, 5);

        // Verificar estado de stock bajo
        List<ProductDTO> lowStockProducts = productService.findLowStockProducts();
        assertTrue(lowStockProducts.stream()
                .anyMatch(p -> p.getName().equals("Low Stock Item") && p.getLowStock()));

        // Verificar productos agotados
        List<ProductDTO> outOfStockProducts = productService.findOutOfStockProducts();
        assertTrue(outOfStockProducts.stream()
                .anyMatch(p -> p.getName().equals("Out of Stock Item") && p.getOutOfStock()));
    }

    @Test
    void testProductCategories_Regression() {
        // Crear productos en diferentes categorías
        createProduct("Laptop Dell", "Electronics", new BigDecimal("899.99"), 10, 5);
        createProduct("Programming Book", "Books", new BigDecimal("49.99"), 15, 3);
        createProduct("T-Shirt", "Clothing", new BigDecimal("19.99"), 25, 10);

        // Obtener todas las categorías
        List<String> categories = productService.getAllCategories();
        assertTrue(categories.contains("Electronics"));
        assertTrue(categories.contains("Books"));
        assertTrue(categories.contains("Clothing"));
        assertTrue(categories.size() >= 3);
    }

    @Test
    void testProductStatistics_Regression() {
        // Crear productos para estadísticas
        createProduct("Product 1", "Category1", new BigDecimal("100"), 10, 5);
        createProduct("Product 2", "Category1", new BigDecimal("200"), 5, 3);
        createProduct("Product 3", "Category2", new BigDecimal("50"), 20, 10);

        // Obtener estadísticas
        var stats = productService.getBasicStats();

        assertTrue((Integer) stats.get("totalProducts") >= 3);
        assertTrue((Integer) stats.get("categories") >= 2);
        assertNotNull(stats.get("totalValue"));
    }

    // === PRUEBAS DE REGRESIÓN PARA STOCK ===

    @Test
    void testStockOperations_Regression() {
        // Crear producto
        ProductDTO product = productService.createProduct(testProduct);
        Long productId = product.getId();

        // STOCK IN - Añadir stock
        StockMovementDTO stockIn = new StockMovementDTO();
        stockIn.setProductId(productId);
        stockIn.setQuantity(25);
        stockIn.setReason("Initial stock addition");

        StockMovementDTO resultIn = stockService.registerStockIn(stockIn, "testuser");
        assertEquals(MovementType.STOCK_IN, resultIn.getMovementType());
        assertEquals(75, resultIn.getNewQuantity()); // 50 inicial + 25

        // STOCK OUT - Retirar stock
        StockMovementDTO stockOut = new StockMovementDTO();
        stockOut.setProductId(productId);
        stockOut.setQuantity(15);
        stockOut.setReason("Sale");

        StockMovementDTO resultOut = stockService.registerStockOut(stockOut, "testuser");
        assertEquals(MovementType.STOCK_OUT, resultOut.getMovementType());
        assertEquals(60, resultOut.getNewQuantity()); // 75 - 15

        // Verificar stock actual
        Integer currentStock = stockService.getCurrentStock(productId);
        assertEquals(60, currentStock);

        // Verificar que hay stock suficiente
        assertTrue(stockService.hasSufficientStock(productId, 30));
        assertFalse(stockService.hasSufficientStock(productId, 100));
    }

    @Test
    void testStockAdjustment_Regression() {
        // Crear producto
        ProductDTO product = productService.createProduct(testProduct);
        Long productId = product.getId();

        // AJUSTE DE STOCK
        StockMovementDTO adjustment = new StockMovementDTO();
        adjustment.setProductId(productId);
        adjustment.setNewQuantity(30); // Ajustar a 30 unidades
        adjustment.setReason("Inventory correction");

        StockMovementDTO result = stockService.registerAdjustment(adjustment, "testuser");
        assertEquals(MovementType.ADJUSTMENT, result.getMovementType());
        assertEquals(30, result.getNewQuantity());

        // Verificar stock actual
        Integer currentStock = stockService.getCurrentStock(productId);
        assertEquals(30, currentStock);
    }

    @Test
    void testStockHistory_Regression() {
        // Crear producto
        ProductDTO product = productService.createProduct(testProduct);
        Long productId = product.getId();

        // Realizar múltiples movimientos (3 movimientos explícitos)
        performStockMovement(productId, 10, MovementType.STOCK_IN, "Purchase");
        performStockMovement(productId, 5, MovementType.STOCK_OUT, "Sale");
        performStockMovement(productId, 8, MovementType.STOCK_IN, "Restock");

        // Obtener historial - debería tener exactamente 3 movimientos
        List<StockMovementDTO> history = stockService.getProductHistory(productId);

        // Verificar que tenemos exactamente 3 movimientos
        assertEquals(3, history.size(), "Debería haber 3 movimientos en el historial");

        // Verificar tipos de movimiento
        long stockInCount = history.stream()
                .filter(m -> m.getMovementType() == MovementType.STOCK_IN)
                .count();
        long stockOutCount = history.stream()
                .filter(m -> m.getMovementType() == MovementType.STOCK_OUT)
                .count();

        assertEquals(2, stockInCount, "Debería haber 2 movimientos de entrada");
        assertEquals(1, stockOutCount, "Debería haber 1 movimiento de salida");

        // Verificar que los movimientos tienen la información correcta
        for (StockMovementDTO movement : history) {
            assertNotNull(movement.getTimestamp());
            assertNotNull(movement.getUsername());
            assertNotNull(movement.getReason());
            assertTrue(movement.getQuantity() > 0);
        }
    }

    @Test
    void testStockValidation_Regression() {
        // Crear producto
        ProductDTO product = productService.createProduct(testProduct);
        Long productId = product.getId();

        // Intentar retirar más stock del disponible
        StockMovementDTO excessiveOut = new StockMovementDTO();
        excessiveOut.setProductId(productId);
        excessiveOut.setQuantity(1000); // Más del stock disponible
        excessiveOut.setReason("Test excessive withdrawal");

        assertThrows(IllegalArgumentException.class, () ->
                stockService.registerStockOut(excessiveOut, "testuser"));

        // Intentar ajuste con cantidad negativa
        StockMovementDTO negativeAdjustment = new StockMovementDTO();
        negativeAdjustment.setProductId(productId);
        negativeAdjustment.setNewQuantity(-10); // Cantidad negativa
        negativeAdjustment.setReason("Test negative adjustment");

        assertThrows(IllegalArgumentException.class, () ->
                stockService.registerAdjustment(negativeAdjustment, "testuser"));
    }

    // === PRUEBAS DE REGRESIÓN PARA MÚLTIPLES OPERACIONES ===

    @Test
    void testConcurrentOperations_Regression() {
        // Crear producto
        ProductDTO product = productService.createProduct(testProduct);
        Long productId = product.getId();

        // Realizar múltiples operaciones secuenciales
        for (int i = 0; i < 5; i++) {
            // Añadir stock
            StockMovementDTO stockIn = new StockMovementDTO();
            stockIn.setProductId(productId);
            stockIn.setQuantity(5);
            stockIn.setReason("Batch addition " + i);

            stockService.registerStockIn(stockIn, "testuser");

            // Verificar stock
            Integer currentStock = stockService.getCurrentStock(productId);
            assertEquals(50 + (5 * (i + 1)), currentStock);

            // Buscar producto
            ProductDTO currentProduct = productService.getProductById(productId);
            assertEquals(currentStock, currentProduct.getInitialQuantity());
        }

        // Verificar estado final
        Integer finalStock = stockService.getCurrentStock(productId);
        assertEquals(75, finalStock); // 50 + (5 * 5) = 75
    }

    @Test
    void testProductUpdateWithStock_Regression() {
        // Crear producto
        ProductDTO product = productService.createProduct(testProduct);
        Long productId = product.getId();

        // Realizar movimiento de stock
        StockMovementDTO stockIn = new StockMovementDTO();
        stockIn.setProductId(productId);
        stockIn.setQuantity(25);
        stockService.registerStockIn(stockIn, "testuser");

        // Actualizar información del producto
        ProductDTO updatedProduct = productService.getProductById(productId);
        updatedProduct.setName("Updated Product Name");
        updatedProduct.setDescription("Updated description");

        ProductDTO result = productService.updateProduct(productId, updatedProduct);

        // Verificar que la información se actualizó pero el stock se mantuvo
        assertEquals("Updated Product Name", result.getName());
        assertEquals("Updated description", result.getDescription());
        assertEquals(75, result.getInitialQuantity()); // 50 + 25
    }

    // === PRUEBAS DE REGRESIÓN PARA CASOS BORDE ===

    @Test
    void testEdgeCases_Regression() {
        // CASO 1: Producto con cantidad cero (0 unidades)
        ProductDTO zeroQuantityProduct = new ProductDTO();
        zeroQuantityProduct.setName("Zero Quantity Product");
        zeroQuantityProduct.setDescription("Product with zero quantity");
        zeroQuantityProduct.setCategory("Test");
        zeroQuantityProduct.setPrice(new BigDecimal("9.99"));
        zeroQuantityProduct.setInitialQuantity(0);      // Stock cero
        zeroQuantityProduct.setMinimumStock(5);         // Mínimo 5

        ProductDTO created = productService.createProduct(zeroQuantityProduct);
        assertTrue(created.getOutOfStock(),  "0 unidades debería estar out of stock");
        assertTrue(created.getLowStock(),    "0 <= 5 debería estar low stock");

        // CASO 2: Producto en stock mínimo exacto (5 unidades)
        ProductDTO minStockProduct = new ProductDTO();
        minStockProduct.setName("Min Stock Product");
        minStockProduct.setDescription("Product at minimum stock level");
        minStockProduct.setCategory("Test");
        minStockProduct.setPrice(new BigDecimal("19.99"));
        minStockProduct.setInitialQuantity(5);      // Igual al mínimo
        minStockProduct.setMinimumStock(5);         // Mínimo 5

        ProductDTO minStockCreated = productService.createProduct(minStockProduct);
        assertTrue(minStockCreated.getLowStock(),   "5 <= 5 debería estar low stock");
        assertFalse(minStockCreated.getOutOfStock(), "5 > 0 no debería estar out of stock");

        // CASO 3: Producto por encima del stock mínimo (6 unidades)
        ProductDTO aboveMinStockProduct = new ProductDTO();
        aboveMinStockProduct.setName("Above Min Stock Product");
        aboveMinStockProduct.setDescription("Product above minimum stock level");
        aboveMinStockProduct.setCategory("Test");
        aboveMinStockProduct.setPrice(new BigDecimal("29.99"));
        aboveMinStockProduct.setInitialQuantity(6);     // Mayor que mínimo
        aboveMinStockProduct.setMinimumStock(5);        // Mínimo 5

        ProductDTO aboveMinCreated = productService.createProduct(aboveMinStockProduct);
        assertFalse(aboveMinCreated.getLowStock(),    "6 > 5 no debería estar low stock");
        assertFalse(aboveMinCreated.getOutOfStock(),  "6 > 0 no debería estar out of stock");

        // CASO 4: Producto con stock mínimo de 1 (caso borde)
        ProductDTO minStockOneProduct = new ProductDTO();
        minStockOneProduct.setName("Min Stock One Product");
        minStockOneProduct.setDescription("Product with minimum stock of 1");
        minStockOneProduct.setCategory("Test");
        minStockOneProduct.setPrice(new BigDecimal("39.99"));
        minStockOneProduct.setInitialQuantity(1);      // Igual al mínimo
        minStockOneProduct.setMinimumStock(1);         // Mínimo 1

        ProductDTO minStockOneCreated = productService.createProduct(minStockOneProduct);
        assertTrue(minStockOneCreated.getLowStock(),   "1 <= 1 debería estar low stock");
        assertFalse(minStockOneCreated.getOutOfStock(), "1 > 0 no debería estar out of stock");

        // CASO 5: Producto con precio muy alto
        ProductDTO highPriceProduct = new ProductDTO();
        highPriceProduct.setName("High Price Product");
        highPriceProduct.setDescription("Product with very high price");
        highPriceProduct.setCategory("Luxury");
        highPriceProduct.setPrice(new BigDecimal("9999.99"));
        highPriceProduct.setInitialQuantity(1);
        highPriceProduct.setMinimumStock(1);

        ProductDTO highPriceCreated = productService.createProduct(highPriceProduct);
        assertEquals(0, new BigDecimal("9999.99").compareTo(highPriceCreated.getPrice()));
        assertTrue(highPriceCreated.getLowStock(),    "1 <= 1 debería estar low stock");
        assertFalse(highPriceCreated.getOutOfStock(), "1 > 0 no debería estar out of stock");
    }

    @Test
    void testBulkOperations_Regression() {
        // Crear múltiples productos rápidamente
        for (int i = 0; i < 10; i++) {
            ProductDTO product = new ProductDTO();
            product.setName("Bulk Product " + i);
            product.setDescription("Product from bulk test " + i);
            product.setCategory("Bulk");
            product.setPrice(new BigDecimal(i * 10 + 9.99));
            product.setInitialQuantity(i * 5);
            product.setMinimumStock(2);

            ProductDTO created = productService.createProduct(product);
            assertNotNull(created.getId());
        }

        // Verificar que todos se crearon
        List<ProductDTO> allProducts = productService.getAllProducts();
        assertTrue(allProducts.size() >= 10);

        // Verificar búsqueda de productos bulk
        ProductSearchDTO search = new ProductSearchDTO();
        search.setSearchTerm("Bulk Product");
        List<ProductDTO> bulkProducts = productService.searchProducts(search);
        assertTrue(bulkProducts.size() >= 10);
    }

    // === MÉTODOS DE APOYO ===

    private void createTestProducts() {
        createProduct("Laptop HP", "Electronics", new BigDecimal("999.99"), 10, 5);
        createProduct("Laptop Dell", "Electronics", new BigDecimal("899.99"), 8, 5);
        createProduct("Mouse Logitech", "Electronics", new BigDecimal("49.99"), 25, 10);
        createProduct("Programming Book", "Books", new BigDecimal("59.99"), 15, 5);
        createProduct("Desk Lamp", "Home", new BigDecimal("29.99"), 30, 15);
    }

    private ProductDTO createProduct(String name, String category, BigDecimal price,
                                     Integer quantity, Integer minStock) {
        ProductDTO product = new ProductDTO();
        product.setName(name);
        product.setDescription("Test " + name);
        product.setCategory(category);
        product.setPrice(price);
        product.setInitialQuantity(quantity);
        product.setMinimumStock(minStock);
        return productService.createProduct(product);
    }

    private StockMovementDTO performStockMovement(Long productId, Integer quantity,
                                                  MovementType movementType, String reason) {
        StockMovementDTO movement = new StockMovementDTO();
        movement.setProductId(productId);

        if (movementType == MovementType.ADJUSTMENT) {
            movement.setNewQuantity(quantity);
        } else {
            movement.setQuantity(quantity);
        }

        movement.setReason(reason);

        switch (movementType) {
            case STOCK_IN:
                return stockService.registerStockIn(movement, "testuser");
            case STOCK_OUT:
                return stockService.registerStockOut(movement, "testuser");
            case ADJUSTMENT:
                return stockService.registerAdjustment(movement, "testuser");
            default:
                throw new IllegalArgumentException("Unsupported movement type: " + movementType);
        }
    }
}