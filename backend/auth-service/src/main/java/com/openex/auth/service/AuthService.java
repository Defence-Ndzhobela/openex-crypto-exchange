package com.openex.auth.service;

import com.openex.auth.dto.AuthResponse;
import com.openex.auth.dto.AuthUserResponse;
import com.openex.auth.dto.LoginRequest;
import com.openex.auth.dto.RegisterRequest;
import com.openex.auth.model.UserRecord;
import com.openex.auth.repository.UserRepository;
import com.openex.auth.repository.WalletRepository;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

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

        userRepository.ensureWalletRows(user.id());
        Map<String, Double> balances = walletRepository.getBalances(user.id());

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

        Map<String, Double> balances = walletRepository.getBalances(user.id());

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
}
