package com.openex.auth.service;

import com.openex.auth.dto.CreatePaymentMethodRequest;
import com.openex.auth.dto.PaymentMethodResponse;
import com.openex.auth.dto.WalletTransactionResponse;
import com.openex.auth.repository.WalletRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class WalletService {

    private static final BigDecimal MIN_DEPOSIT_ZAR = new BigDecimal("100.00");
    private static final BigDecimal ZAR_PER_USD = new BigDecimal("19.00");
        private static final Set<String> SUPPORTED_BANKS = new HashSet<>(List.of(
            "Standard Bank",
            "Absa",
            "First National Bank (FNB)",
            "Nedbank",
            "Capitec Bank"
        ));

    private final WalletRepository walletRepository;

    public WalletService(WalletRepository walletRepository) {
        this.walletRepository = walletRepository;
    }

    public Map<String, Double> getBalances(UUID userId) {
        return walletRepository.getBalances(userId);
    }

    public List<WalletTransactionResponse> getTransactions(UUID userId) {
        return walletRepository.getTransactions(userId, 50);
    }

    public List<PaymentMethodResponse> getPaymentMethods(UUID userId) {
        return walletRepository.getPaymentMethods(userId);
    }

    public PaymentMethodResponse addPaymentMethod(UUID userId, CreatePaymentMethodRequest request) {
        return walletRepository.addPaymentMethod(userId, request);
    }

    public Map<String, Double> faucet(UUID userId, BigDecimal amountZar, UUID paymentMethodId) {
        if (amountZar == null || amountZar.compareTo(MIN_DEPOSIT_ZAR) < 0) {
            throw new ResponseStatusException(BAD_REQUEST, "Minimum deposit is 100 ZAR");
        }

        if (paymentMethodId == null || !walletRepository.paymentMethodExists(userId, paymentMethodId)) {
            throw new ResponseStatusException(BAD_REQUEST, "Please select a valid saved payment method");
        }

        BigDecimal usdAmount = amountZar.divide(ZAR_PER_USD, 2, RoundingMode.HALF_UP);
        return walletRepository.applyFaucetDeposit(userId, usdAmount, amountZar, paymentMethodId);
    }

    public Map<String, Double> withdraw(UUID userId, BigDecimal amountUsd, String accountNumber, String bankName) {
        if (amountUsd == null || amountUsd.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(BAD_REQUEST, "Withdrawal amount must be greater than 0");
        }

        if (bankName == null || bankName.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Bank name is required");
        }

        if (!SUPPORTED_BANKS.contains(bankName)) {
            throw new ResponseStatusException(BAD_REQUEST, "Please select a valid bank");
        }

        double currentUsd = walletRepository.getBalances(userId).getOrDefault("USD", 0.0);
        if (amountUsd.compareTo(BigDecimal.valueOf(currentUsd)) > 0) {
            throw new ResponseStatusException(BAD_REQUEST, "Withdrawal amount exceeds available USD balance");
        }

        Map<String, Double> balances = walletRepository.applyWithdrawal(userId, amountUsd, accountNumber, bankName);
        if (balances == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Withdrawal amount exceeds available USD balance");
        }

        return balances;
    }

    public Map<String, Double> internalTransfer(UUID userId,
                                                String fromAsset,
                                                String toAsset,
                                                BigDecimal amount,
                                                BigDecimal btcPrice) {
        String sourceAsset = fromAsset == null ? "" : fromAsset.trim().toUpperCase();
        String targetAsset = toAsset == null ? "" : toAsset.trim().toUpperCase();

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(BAD_REQUEST, "Transfer amount must be greater than 0");
        }

        if ((!"USD".equals(sourceAsset) && !"BTC".equals(sourceAsset)) ||
                (!"USD".equals(targetAsset) && !"BTC".equals(targetAsset))) {
            throw new ResponseStatusException(BAD_REQUEST, "Transfer assets must be USD or BTC");
        }

        if (sourceAsset.equals(targetAsset)) {
            throw new ResponseStatusException(BAD_REQUEST, "Source and destination assets must be different");
        }

        if (btcPrice == null || btcPrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(BAD_REQUEST, "BTC price must be greater than 0");
        }

        Map<String, Double> currentBalances = walletRepository.getBalances(userId);
        double sourceBalance = currentBalances.getOrDefault(sourceAsset, 0.0);
        if (amount.compareTo(BigDecimal.valueOf(sourceBalance)) > 0) {
            throw new ResponseStatusException(BAD_REQUEST, "Transfer amount exceeds available balance");
        }

        BigDecimal convertedAmount;
        if ("USD".equals(sourceAsset) && "BTC".equals(targetAsset)) {
            convertedAmount = amount.divide(btcPrice, 8, RoundingMode.HALF_UP);
        } else if ("BTC".equals(sourceAsset) && "USD".equals(targetAsset)) {
            convertedAmount = amount.multiply(btcPrice).setScale(2, RoundingMode.HALF_UP);
        } else {
            throw new ResponseStatusException(BAD_REQUEST, "Unsupported transfer pair");
        }

        if (convertedAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(BAD_REQUEST, "Converted amount must be greater than 0");
        }

        Map<String, Double> balances = walletRepository.applyInternalTransfer(
                userId,
                sourceAsset,
                targetAsset,
                amount,
                convertedAmount,
                btcPrice
        );

        if (balances == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Transfer amount exceeds available balance");
        }

        return balances;
    }

    public Map<String, Double> settleOrderPnl(UUID userId,
                                              String orderId,
                                              BigDecimal pnlUsd,
                                              BigDecimal btcPrice) {
        String normalizedOrderId = orderId == null ? "" : orderId.trim();
        if (normalizedOrderId.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "Order ID is required");
        }

        if (pnlUsd == null) {
            throw new ResponseStatusException(BAD_REQUEST, "PnL amount is required");
        }

        if (btcPrice == null || btcPrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(BAD_REQUEST, "BTC price must be greater than 0");
        }

        Map<String, Double> balances = walletRepository.applyOrderPnlSettlement(userId, normalizedOrderId, pnlUsd, btcPrice);
        if (balances == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Insufficient BTC balance for loss settlement");
        }

        return balances;
    }
}
