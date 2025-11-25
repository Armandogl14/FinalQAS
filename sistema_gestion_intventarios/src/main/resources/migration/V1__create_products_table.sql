CREATE TABLE products (
                          id SERIAL PRIMARY KEY,
                          name VARCHAR(255) NOT NULL,
                          description TEXT,
                          category VARCHAR(255),
                          price DECIMAL(10, 2),
                          initial_quantity INTEGER
);