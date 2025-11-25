Feature: Product Management API
  As a system administrator
  I want to manage products through the REST API
  So that I can maintain the inventory system

  Background:
    Given the system has the following products:
      | name       | description        | category    | price | quantity |
      | Laptop HP  | Business laptop    | Electronics | 1200  | 10       |
      | Mouse Logi | Wireless mouse     | Accessories | 25    | 50       |

  Scenario: Get all products
    When I send a GET request to "/api/v2/products"
    Then I should receive status 200
    And the response should contain 2 products
    And the response should contain product "Laptop HP"
    And the response should contain product "Mouse Logi"

  Scenario: Get product by ID
    When I send a GET request to "/api/v2/products"
    Then I should receive status 200
    And the response should contain product "Laptop HP"

  Scenario: Create a new product
    When I send a POST request to "/api/v2/products" with:
      | name         | description       | category    | price | quantity |
      | MacBook Pro  | Premium laptop    | Electronics | 2500  | 5        |
    Then I should receive status 201
    And the product "MacBook Pro" should exist in the system
    And the product "MacBook Pro" should have quantity 5

  Scenario: Update an existing product
    When I send a PUT request to "/api/v2/products" with:
      | field       | value            |
      | name        | Laptop HP        |
      | description | Gaming laptop    |
      | price       | 1500             |
    Then I should receive status 200
    And the product "Laptop HP" should have description "Gaming laptop"
    And the product "Laptop HP" should have price 1500

  Scenario: Delete a product
    When I send a DELETE request for product "Mouse Logi"
    Then I should receive status 204
    And the product "Mouse Logi" should not exist in the system

  Scenario: Calculate inventory totals
    When I send a GET request to "/api/v2/products"
    Then I should receive status 200
    And the total inventory value should be 13250