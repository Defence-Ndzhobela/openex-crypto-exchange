package com.openex.auth.service;

import com.openex.auth.dto.OrderResponse;
import com.openex.auth.dto.PlaceOrderRequest;
import com.openex.auth.repository.OrderRepository;
import com.openex.auth.repository.WalletRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final WalletRepository walletRepository;

    public OrderService(OrderRepository orderRepository, WalletRepository walletRepository) {
        this.orderRepository = orderRepository;
        this.walletRepository = walletRepository;
    }

    public OrderResponse placeOrder(UUID userId, PlaceOrderRequest request) {
        String side = request.side() == null ? "" : request.side().trim().toLowerCase();
        String type = request.type() == null ? "" : request.type().trim().toLowerCase();

        if (!"buy".equals(side) && !"sell".equals(side)) {
            throw new ResponseStatusException(BAD_REQUEST, "Order side must be buy or sell");
        }

        if (!"limit".equals(type) && !"market".equals(type)) {
            throw new ResponseStatusException(BAD_REQUEST, "Order type must be limit or market");
        }

        BigDecimal quantity = request.quantity();
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(BAD_REQUEST, "Quantity must be greater than 0");
        }

        BigDecimal price = request.price();
        if ("limit".equals(type)) {
            if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
                throw new ResponseStatusException(BAD_REQUEST, "Price must be greater than 0 for limit orders");
            }
        } else {
            if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
                throw new ResponseStatusException(BAD_REQUEST, "Price is required for market orders");
            }
        }

        if ("sell".equals(side)) {
            double btcBalance = walletRepository.getBalances(userId).getOrDefault("BTC", 0.0);
            if (quantity.compareTo(BigDecimal.valueOf(btcBalance)) > 0) {
                throw new ResponseStatusException(BAD_REQUEST, "Sell amount exceeds available BTC balance");
            }
        }

        return orderRepository.placeOrder(userId,
                new PlaceOrderRequest(side, type, price, quantity));
    }

    public List<OrderResponse> getOrders(UUID userId) {
        return orderRepository.getOrders(userId);
    }

    public OrderResponse cancelOrder(UUID userId, UUID orderId) {
        OrderResponse cancelled = orderRepository.cancelOrder(userId, orderId);
        if (cancelled == null) {
            throw new ResponseStatusException(NOT_FOUND, "Open order not found for cancel");
        }
        return cancelled;
    }
}
