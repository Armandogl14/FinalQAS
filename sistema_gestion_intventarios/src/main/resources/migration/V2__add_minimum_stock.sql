-- Migration to add minimum_stock field to products table
-- and create stock_movements table

-- Add minimum_stock column to products
ALTER TABLE products ADD COLUMN minimum_stock INTEGER DEFAULT 5;

-- Update existing products with default minimum stock
UPDATE products SET minimum_stock = 5 WHERE minimum_stock IS NULL;

-- Create stock_movements table
CREATE TABLE stock_movements (
                                 id BIGSERIAL PRIMARY KEY,
                                 product_id BIGINT NOT NULL,
                                 movement_type VARCHAR(20) NOT NULL,
                                 quantity INTEGER NOT NULL,
                                 previous_quantity INTEGER,
                                 new_quantity INTEGER,
                                 timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                 username VARCHAR(100) NOT NULL,
                                 reason VARCHAR(500),

                                 CONSTRAINT fk_movement_product
                                     FOREIGN KEY (product_id)
                                         REFERENCES products(id)
                                         ON DELETE CASCADE,

                                 CONSTRAINT chk_movement_type
                                     CHECK (movement_type IN ('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'RETURN', 'LOSS', 'INITIAL')),

                                 CONSTRAINT chk_quantity_positive
                                     CHECK (quantity > 0)
);

-- Create indexes for better performance
CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_timestamp ON stock_movements(timestamp DESC);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_username ON stock_movements(username);

-- Create additional indexes on products for new queries
CREATE INDEX idx_products_minimum_stock ON products(minimum_stock);
CREATE INDEX idx_products_initial_quantity ON products(initial_quantity);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_price ON products(price);

-- Table comments
COMMENT ON TABLE stock_movements IS 'Records of all stock movements for products';
COMMENT ON COLUMN stock_movements.movement_type IS 'Type of movement: STOCK_IN, STOCK_OUT, ADJUSTMENT, RETURN, LOSS, INITIAL';
COMMENT ON COLUMN stock_movements.quantity IS 'Movement quantity (always positive)';
COMMENT ON COLUMN stock_movements.previous_quantity IS 'Stock before the movement';
COMMENT ON COLUMN stock_movements.new_quantity IS 'Stock after the movement';

COMMENT ON COLUMN products.minimum_stock IS 'Minimum stock level before generating alerts';