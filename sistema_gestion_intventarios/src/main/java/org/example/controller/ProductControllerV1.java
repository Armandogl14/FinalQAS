package org.example.controller;

import org.example.entity.Product;
import org.example.service.ProductService;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

//TODO: Spring Validation
//TODO: Crear DTOs

@RestController
@RequestMapping("/api/v1/products")
public class ProductControllerV1 {

    private final ProductService service;

    public ProductControllerV1(ProductService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Product create(@RequestBody Product product) {
        return service.saveLegacy(product);
    }

    @GetMapping
    public List<Product> getAll() {
        return service.findAllLegacy();
    }

    @GetMapping("/{id}")
    public Product getById(@PathVariable Long id) {
        return service.findByIdLegacy(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Product update(@PathVariable Long id, @RequestBody Product product) {
        return service.updateLegacy(id, product);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        service.deleteProduct(id);
    }
}
