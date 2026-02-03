package com.example.loanapp.controllers;

import com.example.loanapp.DTO.AuthDTO;
import com.example.loanapp.Entity.User;
import com.example.loanapp.Service.UserService;
import com.example.loanapp.configuration.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j // Enables log.info for easier debugging
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<AuthDTO.AuthResponse> login(@Valid @RequestBody AuthDTO.LoginRequest request) {
        log.info("Login attempt for email: {}", request.getEmail());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userService.getUserEntityByEmail(userDetails.getUsername());

        String jwt = jwtService.generateToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        return ResponseEntity.ok(mapToAuthResponse(user, jwt, refreshToken));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthDTO.AuthResponse> register(@Valid @RequestBody AuthDTO.RegisterRequest request) {
        log.info("Received registration request for: {}", request.getEmail());

        // 1. Register the user via service
        // Make sure your UserService.registerUser accepts AuthDTO.RegisterRequest
        User user = userService.registerUser(request);

        // 2. Generate tokens
        // Since User entity implements UserDetails, we pass 'user' directly
        String jwt = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        log.info("Registration successful for user ID: {}", user.getId());
        return ResponseEntity.ok(mapToAuthResponse(user, jwt, refreshToken));
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refreshToken(@Valid @RequestBody AuthDTO.RefreshTokenRequest request) {
        String username = jwtService.extractUsername(request.getRefreshToken());

        if (username != null) {
            UserDetails userDetails = userService.loadUserByUsername(username);

            if (jwtService.isTokenValid(request.getRefreshToken(), userDetails)) {
                String newAccessToken = jwtService.generateToken(userDetails);

                Map<String, String> response = new HashMap<>();
                response.put("token", newAccessToken);
                response.put("refreshToken", request.getRefreshToken());
                response.put("type", "Bearer");

                return ResponseEntity.ok(response);
            }
        }
        return ResponseEntity.status(401).build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader(value = "Authorization", required = false) String token) {
        // JWT is stateless, so we just return 200.
        // The client handles logout by clearing the token from localStorage.
        return ResponseEntity.ok().build();
    }

    /**
     * Map User entity and tokens to the AuthResponse DTO
     */
    private AuthDTO.AuthResponse mapToAuthResponse(User user, String token, String refreshToken) {
        AuthDTO.AuthResponse response = new AuthDTO.AuthResponse();
        response.setToken(token);
        response.setRefreshToken(refreshToken);
        response.setUserId(user.getId());
        response.setEmail(user.getEmail());
        response.setName(user.getName());
        response.setRole(user.getRole().name());
        response.setExpiresIn(jwtService.getExpirationTime());
        return response;
    }
}