package com.inventory.service;

import org.example.dto.ProductDTO;
import org.example.dto.ProductSearchDTO;
import org.example.entity.Product;
import org.example.repository.ProductRepository;
import org.example.service.ProductServiceImpl;
import io.micrometer.core.instrument.Counter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private Counter productCreationsCounter;

    @Mock
    private Counter productDeletionsCounter;

    @InjectMocks
    private ProductServiceImpl productService;

    private Product product;
    private ProductDTO productDTO;

    @BeforeEach
    void setUp() {
        product = new Product();
        product.setId(1L);
        product.setName("Laptop HP");
        product.setDescription("High-end laptop");
        product.setCategory("Electronics");
        product.setPrice(BigDecimal.valueOf(999.99));
        product.setInitialQuantity(10);
        product.setMinimumStock(5);

        productDTO = new ProductDTO();
        productDTO.setId(1L);
        productDTO.setName("Laptop HP");
        productDTO.setDescription("High-end laptop");
        productDTO.setCategory("Electronics");
        productDTO.setPrice(BigDecimal.valueOf(999.99));
        productDTO.setInitialQuantity(10);
        productDTO.setMinimumStock(5);
    }

    // === TESTS PARA MÉTODOS NUEVOS CON DTOs ===

    @Test
    void createProduct_createsAndReturnsProductDTO() throws Exception {
        when(productRepository.save(any(Product.class))).thenReturn(product);

        ProductDTO result = productService.createProduct(productDTO);

        assertNotNull(result);
        assertEquals("Laptop HP", result.getName());
        assertEquals(0, BigDecimal.valueOf(999.99).compareTo(result.getPrice()));
        assertEquals(10, result.getInitialQuantity());
        verify(productRepository, times(1)).save(any(Product.class));
    }

    @Test
    void createProduct_throwsExceptionForInvalidPrice() {
        ProductDTO invalidDTO = new ProductDTO();
        invalidDTO.setName("Laptop HP");
        invalidDTO.setDescription("High-end laptop");
        invalidDTO.setCategory("Electronics");
        invalidDTO.setPrice(BigDecimal.valueOf(-10));
        invalidDTO.setInitialQuantity(10);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> productService.createProduct(invalidDTO));
        assertEquals("Price must be positive", exception.getMessage());
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void getAllProducts_returnsProductDTOList() {
        when(productRepository.findAll()).thenReturn(Collections.singletonList(product));

        List<ProductDTO> result = productService.getAllProducts();

        assertEquals(1, result.size());
        assertEquals("Laptop HP", result.getFirst().getName());
        verify(productRepository, times(1)).findAll();
    }

    @Test
    void getProductById_returnsProductDTO() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        ProductDTO result = productService.getProductById(1L);

        assertNotNull(result);
        assertEquals("Laptop HP", result.getName());
        verify(productRepository, times(1)).findById(1L);
    }

    @Test
    void getProductById_throwsExceptionForInvalidId() {
        when(productRepository.findById(2L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> productService.getProductById(2L));
        assertEquals("Product not found with id: 2", exception.getMessage());
        verify(productRepository, times(1)).findById(2L);
    }

    @Test
    void updateProduct_updatesAndReturnsProductDTO() throws Exception {
        ProductDTO updatedDTO = new ProductDTO();
        updatedDTO.setName("Laptop HP Updated");
        updatedDTO.setDescription("Updated description");
        updatedDTO.setCategory("Electronics");
        updatedDTO.setPrice(BigDecimal.valueOf(1099.99));
        updatedDTO.setInitialQuantity(15);
        updatedDTO.setMinimumStock(3);

        Product updatedProduct = new Product();
        updatedProduct.setId(1L);
        updatedProduct.setName("Laptop HP Updated");
        updatedProduct.setDescription("Updated description");
        updatedProduct.setCategory("Electronics");
        updatedProduct.setPrice(BigDecimal.valueOf(1099.99));
        updatedProduct.setInitialQuantity(15);
        updatedProduct.setMinimumStock(3);

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenReturn(updatedProduct);

        ProductDTO result = productService.updateProduct(1L, updatedDTO);

        assertEquals("Laptop HP Updated", result.getName());
        assertEquals("Updated description", result.getDescription());
        assertEquals(0, BigDecimal.valueOf(1099.99).compareTo(result.getPrice()));
        assertEquals(15, result.getInitialQuantity());
        verify(productRepository, times(1)).findById(1L);
        verify(productRepository, times(1)).save(any(Product.class));
    }

    @Test
    void deleteProduct_deletesProduct() {
        when(productRepository.existsById(1L)).thenReturn(true);
        doNothing().when(productRepository).deleteById(1L);

        assertDoesNotThrow(() -> productService.deleteProduct(1L));

        verify(productRepository, times(1)).existsById(1L);
        verify(productRepository, times(1)).deleteById(1L);
    }

    // === TESTS PARA BÚSQUEDA Y FILTROS ===

    @Test
    void searchProducts_returnsFilteredResults() {
        when(productRepository.findBySearchTerm("Laptop")).thenReturn(Collections.singletonList(product));

        ProductSearchDTO searchDTO = new ProductSearchDTO();
        searchDTO.setSearchTerm("Laptop");

        List<ProductDTO> result = productService.searchProducts(searchDTO);

        assertEquals(1, result.size());
        assertEquals("Laptop HP", result.getFirst().getName());
        verify(productRepository, times(1)).findBySearchTerm("Laptop");
    }

    @Test
    void findProductsByCategory_returnsProducts() {
        when(productRepository.findByCategory("Electronics")).thenReturn(Collections.singletonList(product));

        List<ProductDTO> result = productService.findProductsByCategory("Electronics");

        assertEquals(1, result.size());
        assertEquals("Laptop HP", result.getFirst().getName());
        verify(productRepository, times(1)).findByCategory("Electronics");
    }

    @Test
    void findLowStockProducts_returnsLowStockProducts() {
        Product lowStockProduct = new Product();
        lowStockProduct.setId(2L);
        lowStockProduct.setName("Low Stock Item");
        lowStockProduct.setInitialQuantity(3);
        lowStockProduct.setMinimumStock(5);
        lowStockProduct.setPrice(BigDecimal.valueOf(1));

        when(productRepository.findLowStockProducts()).thenReturn(Collections.singletonList(lowStockProduct));

        List<ProductDTO> result = productService.findLowStockProducts();

        assertEquals(1, result.size());
        assertEquals("Low Stock Item", result.getFirst().getName());
        assertTrue(result.getFirst().getLowStock());
        verify(productRepository, times(1)).findLowStockProducts();
    }

    @Test
    void findOutOfStockProducts_returnsOutOfStockProducts() {
        Product outOfStockProduct = new Product();
        outOfStockProduct.setId(3L);
        outOfStockProduct.setName("Out of Stock Item");
        outOfStockProduct.setInitialQuantity(0);
        outOfStockProduct.setMinimumStock(5);
        outOfStockProduct.setPrice(BigDecimal.valueOf(1));

        when(productRepository.findOutOfStockProducts()).thenReturn(Collections.singletonList(outOfStockProduct));

        List<ProductDTO> result = productService.findOutOfStockProducts();

        assertEquals(1, result.size());
        assertEquals("Out of Stock Item", result.getFirst().getName());
        assertTrue(result.getFirst().getOutOfStock());
        verify(productRepository, times(1)).findOutOfStockProducts();
    }

    // === TESTS PARA UTILIDADES ===

    @Test
    void getAllCategories_returnsUniqueCategories() {
        when(productRepository.findAllCategories()).thenReturn(List.of("Electronics", "Books", "Clothing"));

        List<String> result = productService.getAllCategories();

        assertEquals(3, result.size());
        assertTrue(result.contains("Electronics"));
        verify(productRepository, times(1)).findAllCategories();
    }

    @Test
    void getBasicStats_returnsStatistics() {
        List<Product> allProducts = List.of(product);
        List<Product> lowStockProducts = List.of();
        List<Product> outOfStockProducts = List.of();

        when(productRepository.findAll()).thenReturn(allProducts);
        when(productRepository.findLowStockProducts()).thenReturn(lowStockProducts);
        when(productRepository.findOutOfStockProducts()).thenReturn(outOfStockProducts);
        when(productRepository.getTotalInventoryValue()).thenReturn(BigDecimal.valueOf(9999.99));
        when(productRepository.findAllCategories()).thenReturn(List.of("Electronics"));

        var result = productService.getBasicStats();

        assertEquals(1, result.get("totalProducts"));
        assertEquals(0, result.get("lowStockCount"));
        assertEquals(0, result.get("outOfStockCount"));
        assertEquals(0, BigDecimal.valueOf(9999.99).compareTo((BigDecimal) result.get("totalValue")));
        assertEquals(1, result.get("categories"));
    }

    // === TESTS PARA LÓGICA DE NEGOCIO ===

    @Test
    void productIsLowStock_whenQuantityLessThanMinimum() {
        Product lowStockProduct = new Product();
        lowStockProduct.setInitialQuantity(3);
        lowStockProduct.setMinimumStock(5);

        assertTrue(lowStockProduct.isLowStock());
    }

    @Test
    void productIsOutOfStock_whenQuantityIsZero() {
        Product outOfStockProduct = new Product();
        outOfStockProduct.setInitialQuantity(0);

        assertTrue(outOfStockProduct.isOutOfStock());
    }

    @Test
    void productTotalValue_isCalculatedCorrectly() {
        Product p = new Product();
        p.setPrice(BigDecimal.valueOf(100));
        p.setInitialQuantity(5);
        p.setMinimumStock(0);

        ProductDTO result = ProductDTO.from(p);
        assertEquals(0, BigDecimal.valueOf(500).compareTo(result.getTotalValue()));
    }

    @Test
    void searchWithMultipleFilters_returnsCorrectResults() {
        Product product1 = new Product();
        product1.setName("Laptop Dell");
        product1.setCategory("Electronics");
        product1.setPrice(BigDecimal.valueOf(800));
        product1.setInitialQuantity(5);
        product1.setMinimumStock(5);

        Product product2 = new Product();
        product2.setName("Laptop HP");
        product2.setCategory("Electronics");
        product2.setPrice(BigDecimal.valueOf(1200));
        product2.setInitialQuantity(2);
        product2.setMinimumStock(5);

        when(productRepository.findAll()).thenReturn(List.of(product1, product2));

        ProductSearchDTO searchDTO = new ProductSearchDTO();
        searchDTO.setCategory("Electronics");
        searchDTO.setMinPrice(BigDecimal.valueOf(1000));
        searchDTO.setMaxPrice(BigDecimal.valueOf(1500));
        searchDTO.setLowStockOnly(true);

        List<ProductDTO> result = productService.searchProducts(searchDTO);

        assertEquals(1, result.size());
        assertEquals("Laptop HP", result.getFirst().getName());
        assertTrue(result.getFirst().getLowStock());
    }
}