package org.example.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.entity.MovementType;
import org.example.entity.StockMovement;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockMovementDTO {

    private Long id; // null para request, con valor para response

    @NotNull(message = "Product ID is required")
    private Long productId;

    // Solo para response
    private String productName;

    // Solo para request de ajuste
    private Integer newQuantity;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be positive")
    private Integer quantity;

    @Size(max = 500, message = "Reason cannot exceed 500 characters")
    private String reason;

    // Campos de response
    private MovementType movementType;
    private String movementTypeDescription;
    private Integer previousQuantity;
    private LocalDateTime timestamp;
    private String username;

    // === FACTORY METHODS ===

    public static StockMovementDTO from(StockMovement movement) {
        if (movement == null) return null;

        StockMovementDTO dto = new StockMovementDTO();
        dto.setId(movement.getId());
        dto.setProductId(movement.getProduct().getId());
        dto.setProductName(movement.getProduct().getName());
        dto.setQuantity(movement.getQuantity());
        dto.setReason(movement.getReason());
        dto.setMovementType(movement.getMovementType());
        dto.setMovementTypeDescription(movement.getMovementType().getDescription());
        dto.setPreviousQuantity(movement.getPreviousQuantity());
        dto.setNewQuantity(movement.getNewQuantity());
        dto.setTimestamp(movement.getTimestamp());
        dto.setUsername(movement.getUsername());
        return dto;
    }
}
