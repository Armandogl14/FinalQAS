package com.inventory.cucumber.steps;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.cucumber.datatable.DataTable;
import io.cucumber.java.Before;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.When;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.And;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.transaction.annotation.Transactional;
import org.example.Main;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = Main.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Transactional
public class ProductApiStepDefinitions {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, Long> productIds = new HashMap<>();
    private MvcResult lastResponse;

    @Before
    public void setup() {
        this.mockMvc = MockMvcBuilders
                .webAppContextSetup(this.webApplicationContext)
                .build();

        // Clear the productIds map
        productIds.clear();

        // Clear all existing products before each scenario
        try {
            System.out.println(">>>>> SETUP: Clearing all products before scenario");

            MvcResult result = mockMvc.perform(get("/api/v2/products")
                            .contentType("application/json"))
                    .andReturn();

            if (result.getResponse().getStatus() == 200) {
                JsonNode products = objectMapper.readTree(result.getResponse().getContentAsString());
                System.out.println(">>>>> SETUP: Found " + products.size() + " products to delete");

                for (JsonNode product : products) {
                    Long id = product.get("id").asLong();
                    String name = product.get("name").asText();
                    System.out.println(">>>>> SETUP: Deleting product: " + name + " (ID: " + id + ")");

                    mockMvc.perform(delete("/api/v2/products/" + id)
                            .contentType("application/json"));
                }

                // Verify cleanup
                MvcResult verifyResult = mockMvc.perform(get("/api/v2/products")
                                .contentType("application/json"))
                        .andReturn();

                JsonNode remainingProducts = objectMapper.readTree(verifyResult.getResponse().getContentAsString());
                System.out.println(">>>>> SETUP: Products remaining after cleanup: " + remainingProducts.size());
            }
        } catch (Exception e) {
            System.out.println(">>>>> SETUP ERROR: Could not clear products: " + e.getMessage());
        }

        System.out.println(">>>>> SETUP: Cleanup complete, starting fresh scenario");
    }

    @Given("the system has the following products:")
    public void systemHasProducts(DataTable dataTable) throws Exception {
        for (Map<String, String> productData : dataTable.asMaps()) {
            String json = String.format(
                    "{\"name\":\"%s\",\"description\":\"%s\",\"category\":\"%s\",\"price\":%s,\"initialQuantity\":%s}",
                    productData.get("name"),
                    productData.get("description"),
                    productData.get("category"),
                    productData.get("price"),
                    productData.get("quantity")
            );

            MvcResult result = mockMvc.perform(post("/api/v2/products")
                            .contentType("application/json")
                            .content(json))
                    .andExpect(status().isCreated())
                    .andReturn();

            JsonNode product = objectMapper.readTree(result.getResponse().getContentAsString());
            productIds.put(productData.get("name"), product.get("id").asLong());
        }
    }

    @Given("the product {string} has ID {int}")
    public void productHasId(String productName, int id) {
        productIds.put(productName, (long) id);
    }

    @When("I send a GET request to {string}")
    public void sendGetRequest(String endpoint) throws Exception {
        lastResponse = mockMvc.perform(get(endpoint)
                        .contentType("application/json"))
                .andReturn();
    }

    @When("I send a POST request to {string} with:")
    public void sendPostRequest(String endpoint, DataTable dataTable) throws Exception {
        Map<String, String> productData = dataTable.asMaps().get(0);

        String json = String.format(
                "{\"name\":\"%s\",\"description\":\"%s\",\"category\":\"%s\",\"price\":%s,\"initialQuantity\":%s}",
                productData.get("name"),
                productData.get("description"),
                productData.get("category"),
                productData.get("price"),
                productData.get("quantity")
        );

        lastResponse = mockMvc.perform(post(endpoint)
                        .contentType("application/json")
                        .content(json))
                .andReturn();

        // Store the created product ID if successful
        if (lastResponse.getResponse().getStatus() == 200) {
            JsonNode product = objectMapper.readTree(lastResponse.getResponse().getContentAsString());
            productIds.put(productData.get("name"), product.get("id").asLong());
        }
    }

    @When("I send a PUT request to {string} with:")
    public void sendPutRequest(String endpoint, DataTable dataTable) throws Exception {
        Map<String, String> updates = dataTable.asMap();
        String productName = updates.get("name");

        // Find the product ID by name
        MvcResult listResult = mockMvc.perform(get("/api/v2/products")
                        .contentType("application/json"))
                .andReturn();

        JsonNode products = objectMapper.readTree(listResult.getResponse().getContentAsString());
        Long productId = null;
        JsonNode existingProduct = null;

        for (JsonNode product : products) {
            if (productName.equals(product.get("name").asText())) {
                productId = product.get("id").asLong();
                existingProduct = product;
                break;
            }
        }

        if (productId == null) {
            throw new RuntimeException("Product not found: " + productName);
        }

        String json = String.format(
                "{\"name\":\"%s\",\"description\":\"%s\",\"category\":\"%s\",\"price\":%s,\"initialQuantity\":%s}",
                existingProduct.get("name").asText(),
                updates.getOrDefault("description", existingProduct.get("description").asText()),
                existingProduct.get("category").asText(),
                updates.getOrDefault("price", existingProduct.get("price").asText()),
                existingProduct.get("initialQuantity").asText()
        );

        lastResponse = mockMvc.perform(put("/api/v2/products/" + productId)
                        .contentType("application/json")
                        .content(json))
                .andReturn();
    }

    @When("I send a DELETE request for product {string}")
    public void sendDeleteRequestForProduct(String productName) throws Exception {
        // Find the product ID by name
        MvcResult listResult = mockMvc.perform(get("/api/v2/products")
                        .contentType("application/json"))
                .andReturn();

        JsonNode products = objectMapper.readTree(listResult.getResponse().getContentAsString());
        Long productId = null;

        for (JsonNode product : products) {
            if (productName.equals(product.get("name").asText())) {
                productId = product.get("id").asLong();
                break;
            }
        }

        if (productId == null) {
            throw new RuntimeException("Product not found: " + productName);
        }

        lastResponse = mockMvc.perform(delete("/api/v2/products/" + productId)
                        .contentType("application/json"))
                .andReturn();

        // Debug: Log the delete response
        System.out.println("DELETE Response Status: " + lastResponse.getResponse().getStatus());
        System.out.println("DELETE Response Body: " + lastResponse.getResponse().getContentAsString());
        System.out.println("Deleted product ID: " + productId);
    }

    @Then("I should receive status {int}")
    public void verifyStatusCode(int expectedStatus) {
        assertEquals(expectedStatus, lastResponse.getResponse().getStatus());
    }

    @And("the response should contain {int} products")
    public void verifyProductCount(int expectedCount) throws Exception {
        String content = lastResponse.getResponse().getContentAsString();
        JsonNode products = objectMapper.readTree(content);
        assertEquals(expectedCount, products.size());
    }

    @And("the response should contain product {string}")
    public void verifyProductInResponse(String productName) throws Exception {
        String content = lastResponse.getResponse().getContentAsString();
        JsonNode products = objectMapper.readTree(content);

        boolean found = false;
        for (JsonNode product : products) {
            if (productName.equals(product.get("name").asText())) {
                found = true;
                break;
            }
        }
        assertTrue(found, "Product " + productName + " not found in response");
    }

    @And("the response should contain product with name {string}")
    public void verifyProductNameInResponse(String expectedName) throws Exception {
        String content = lastResponse.getResponse().getContentAsString();
        JsonNode product = objectMapper.readTree(content);
        assertEquals(expectedName, product.get("name").asText());
    }

    @And("the response should contain product with price {int}")
    public void verifyProductPriceInResponse(int expectedPrice) throws Exception {
        String content = lastResponse.getResponse().getContentAsString();
        JsonNode product = objectMapper.readTree(content);
        assertEquals(expectedPrice, product.get("price").asInt());
    }

    @And("the product {string} should exist in the system")
    public void verifyProductExists(String productName) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v2/products")
                        .contentType("application/json"))
                .andExpect(status().isOk())
                .andReturn();

        String content = result.getResponse().getContentAsString();
        JsonNode products = objectMapper.readTree(content);

        boolean found = false;
        for (JsonNode product : products) {
            if (productName.equals(product.get("name").asText())) {
                found = true;
                break;
            }
        }
        assertTrue(found, "Product " + productName + " should exist but was not found");
    }

    @And("the product {string} should have quantity {int}")
    public void verifyProductQuantity(String productName, int expectedQuantity) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v2/products")
                        .contentType("application/json"))
                .andExpect(status().isOk())
                .andReturn();

        String content = result.getResponse().getContentAsString();
        JsonNode products = objectMapper.readTree(content);

        boolean found = false;
        for (JsonNode product : products) {
            if (productName.equals(product.get("name").asText())) {
                assertEquals(expectedQuantity, product.get("initialQuantity").asInt());
                found = true;
                break;
            }
        }
        assertTrue(found, "Product " + productName + " not found");
    }

    @And("the product {string} should have description {string}")
    public void verifyProductDescription(String productName, String expectedDescription) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v2/products")
                        .contentType("application/json"))
                .andExpect(status().isOk())
                .andReturn();

        String content = result.getResponse().getContentAsString();
        JsonNode products = objectMapper.readTree(content);

        boolean found = false;
        for (JsonNode product : products) {
            if (productName.equals(product.get("name").asText())) {
                assertEquals(expectedDescription, product.get("description").asText());
                found = true;
                break;
            }
        }
        assertTrue(found, "Product " + productName + " not found");
    }

    @And("the product {string} should have price {int}")
    public void verifyProductPrice(String productName, int expectedPrice) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v2/products")
                        .contentType("application/json"))
                .andExpect(status().isOk())
                .andReturn();

        String content = result.getResponse().getContentAsString();
        JsonNode products = objectMapper.readTree(content);

        boolean found = false;
        for (JsonNode product : products) {
            if (productName.equals(product.get("name").asText())) {
                assertEquals(expectedPrice, product.get("price").asInt());
                found = true;
                break;
            }
        }
        assertTrue(found, "Product " + productName + " not found");
    }

    @And("the product {string} should not exist in the system")
    public void verifyProductDoesNotExist(String productName) throws Exception {
        System.out.println(">>>>> VERIFY: Checking that " + productName + " does not exist");

        // Wait for delete transaction to complete
        Thread.sleep(500);

        MvcResult result = mockMvc.perform(get("/api/v2/products")
                        .contentType("application/json"))
                .andExpect(status().isOk())
                .andReturn();

        String content = result.getResponse().getContentAsString();
        JsonNode products = objectMapper.readTree(content);

        System.out.println(">>>>> VERIFY: Total products found: " + products.size());

        boolean found = false;
        for (JsonNode product : products) {
            String name = product.get("name").asText();
            if (productName.equals(name)) {
                found = true;
                System.out.println(">>>>> VERIFY: ERROR - Found " + productName + " (ID: " + product.get("id").asText() + ")");
            }
        }

        if (!found) {
            System.out.println(">>>>> VERIFY: SUCCESS - " + productName + " not found!");
        }

        assertFalse(found, "Product " + productName + " should not exist but was found");
    }

    @And("the total inventory value should be {int}")
    public void verifyTotalInventoryValue(int expectedValue) throws Exception {
        String content = lastResponse.getResponse().getContentAsString();
        JsonNode products = objectMapper.readTree(content);

        double totalValue = 0;
        System.out.println("=== INVENTORY CALCULATION DEBUG ===");
        System.out.println("Total products found: " + products.size());

        for (JsonNode product : products) {
            String name = product.get("name").asText();
            double price = product.get("price").asDouble();
            int quantity = product.get("initialQuantity").asInt();
            double productValue = price * quantity;

            System.out.println(String.format("Product: %s | Price: %.2f | Qty: %d | Value: %.2f",
                    name, price, quantity, productValue));

            totalValue += productValue;
        }

        System.out.println("Expected total: " + expectedValue);
        System.out.println("Actual total: " + (int) totalValue);
        System.out.println("=====================================");

        assertEquals(expectedValue, (int) totalValue);
    }
}