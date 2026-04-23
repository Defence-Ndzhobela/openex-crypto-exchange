package com.openex.auth.controller;

import com.openex.auth.dto.CreatePaymentMethodRequest;
import com.openex.auth.dto.FaucetDepositRequest;
import com.openex.auth.dto.InternalTransferRequest;
import com.openex.auth.dto.OrderPnlSettlementRequest;
import com.openex.auth.dto.PaymentMethodResponse;
import com.openex.auth.dto.WithdrawRequest;
import com.openex.auth.dto.WalletTransactionResponse;
import com.openex.auth.service.WalletService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/wallet")
public class WalletController {

    private final WalletService walletService;

    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    @GetMapping("/balances")
    public Map<String, Double> getBalances(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        UUID userId = extractUserId(authHeader);
        return walletService.getBalances(userId);
    }

    @GetMapping("/transactions")
    public List<WalletTransactionResponse> getTransactions(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        UUID userId = extractUserId(authHeader);
        return walletService.getTransactions(userId);
    }

    @GetMapping("/payment-methods")
    public List<PaymentMethodResponse> getPaymentMethods(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        UUID userId = extractUserId(authHeader);
        return walletService.getPaymentMethods(userId);
    }

    @PostMapping("/payment-methods")
    public PaymentMethodResponse addPaymentMethod(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                                  @Valid @RequestBody CreatePaymentMethodRequest request) {
        UUID userId = extractUserId(authHeader);
        return walletService.addPaymentMethod(userId, request);
    }

    @PostMapping("/faucet")
    public Map<String, Double> faucet(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                      @Valid @RequestBody FaucetDepositRequest request) {
        UUID userId = extractUserId(authHeader);
        return walletService.faucet(userId, request.amountZar(), request.paymentMethodId());
    }

    @PostMapping("/withdraw")
    public Map<String, Double> withdraw(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                        @Valid @RequestBody WithdrawRequest request) {
        UUID userId = extractUserId(authHeader);
        return walletService.withdraw(userId, request.amount(), request.accountNumber(), request.bankName());
    }

    @PostMapping("/internal-transfer")
    public Map<String, Double> internalTransfer(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                                @Valid @RequestBody InternalTransferRequest request) {
        UUID userId = extractUserId(authHeader);
        return walletService.internalTransfer(userId, request.fromAsset(), request.toAsset(), request.amount(), request.btcPrice());
    }

    @PostMapping("/order-settlement")
    public Map<String, Double> settleOrderPnl(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                              @Valid @RequestBody OrderPnlSettlementRequest request) {
        UUID userId = extractUserId(authHeader);
        return walletService.settleOrderPnl(userId, request.orderId(), request.pnlUsd(), request.btcPrice());
    }

    private UUID extractUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing auth token");
        }

        String token = authHeader.substring("Bearer ".length()).trim();
        try {
            return UUID.fromString(token);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid auth token");
        }
    }
}
