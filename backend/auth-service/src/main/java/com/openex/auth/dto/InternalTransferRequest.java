package com.openex.auth.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record InternalTransferRequest(
        @NotBlank String fromAsset,
        @NotBlank String toAsset,
        @NotNull @DecimalMin(value = "0.00000001", message = "Transfer amount must be greater than 0") BigDecimal amount,
        @NotNull @DecimalMin(value = "0.00000001", message = "BTC price must be greater than 0") BigDecimal btcPrice
) {
}
