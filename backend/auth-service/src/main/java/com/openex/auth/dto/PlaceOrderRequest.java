package com.openex.auth.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record PlaceOrderRequest(
        @NotBlank String side,
        @NotBlank String type,
        BigDecimal price,
        @NotNull @DecimalMin(value = "0.00000001", message = "Quantity must be greater than 0") BigDecimal quantity
) {
}
