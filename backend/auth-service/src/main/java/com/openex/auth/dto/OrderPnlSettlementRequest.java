package com.openex.auth.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record OrderPnlSettlementRequest(
        @NotBlank String orderId,
        @NotNull BigDecimal pnlUsd,
        @NotNull @DecimalMin(value = "0.00000001", message = "BTC price must be greater than 0") BigDecimal btcPrice
) {
}