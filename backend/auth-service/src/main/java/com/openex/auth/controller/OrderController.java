package com.openex.auth.controller;

import com.openex.auth.dto.OrderResponse;
import com.openex.auth.dto.PlaceOrderRequest;
import com.openex.auth.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public List<OrderResponse> getOrders(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        UUID userId = extractUserId(authHeader);
        return orderService.getOrders(userId);
    }

    @PostMapping
    public OrderResponse placeOrder(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                    @Valid @RequestBody PlaceOrderRequest request) {
        UUID userId = extractUserId(authHeader);
        return orderService.placeOrder(userId, request);
    }

    @DeleteMapping("/{orderId}")
    public OrderResponse cancelOrder(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                     @PathVariable String orderId) {
        UUID userId = extractUserId(authHeader);
        try {
            return orderService.cancelOrder(userId, UUID.fromString(orderId));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid order id");
        }
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
