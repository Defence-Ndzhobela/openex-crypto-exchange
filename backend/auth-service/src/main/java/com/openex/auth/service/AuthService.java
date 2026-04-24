package com.openex.auth.service;

import com.openex.auth.dto.AuthResponse;
import com.openex.auth.dto.AuthUserResponse;
import com.openex.auth.dto.LoginRequest;
import com.openex.auth.dto.RegisterRequest;
import com.openex.auth.model.UserRecord;
import com.openex.auth.repository.UserRepository;
import com.openex.auth.repository.WalletRepository;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository userRepository, WalletRepository walletRepository) {
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        Optional<UserRecord> existing = userRepository.findByEmail(request.email().trim().toLowerCase());
        if (existing.isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        String hash = passwordEncoder.encode(request.password());

        UserRecord user;
        try {
            user = userRepository.create(
                    request.email().trim().toLowerCase(),
                    request.name().trim(),
                    hash
            );
        } catch (DuplicateKeyException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        Map<String, Double> balances = initializeAndResolveBalances(user.id());

        return new AuthResponse(generateToken(user.id()), new AuthUserResponse(
                user.id(),
                user.displayName(),
                user.email(),
                balances
        ));
    }

    public AuthResponse login(LoginRequest request) {
        UserRecord user = userRepository.findByEmail(request.email().trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.passwordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        Map<String, Double> balances = resolveBalancesSafely(user.id());

        return new AuthResponse(generateToken(user.id()), new AuthUserResponse(
                user.id(),
                user.displayName(),
                user.email(),
                balances
        ));
    }

    private String generateToken(java.util.UUID userId) {
        // For the learning simulation, token is user ID so downstream services can identify the user.
        return userId.toString();
    }

    private Map<String, Double> initializeAndResolveBalances(java.util.UUID userId) {
        try {
            userRepository.ensureWalletRows(userId);
            return walletRepository.getBalances(userId);
        } catch (DataAccessException ex) {
            log.error("Wallet initialization failed for user {}. Returning default balances.", userId, ex);
            return defaultBalances();
        }
    }

    private Map<String, Double> resolveBalancesSafely(java.util.UUID userId) {
        try {
            return walletRepository.getBalances(userId);
        } catch (DataAccessException ex) {
            log.error("Wallet lookup failed for user {}. Returning default balances.", userId, ex);
            return defaultBalances();
        }
    }

    private Map<String, Double> defaultBalances() {
        return Map.of("BTC", 0.0, "USD", 0.0);
    }
}
