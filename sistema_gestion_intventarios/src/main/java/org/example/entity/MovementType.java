package org.example.entity;

public enum MovementType {
    STOCK_IN("Stock In"),
    STOCK_OUT("Stock Out"),
    ADJUSTMENT("Inventory Adjustment"),
    RETURN("Return"),
    LOSS("Loss or Damage"),
    INITIAL("Initial Stock");

    private final String description;

    MovementType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}