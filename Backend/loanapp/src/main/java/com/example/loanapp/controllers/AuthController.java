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

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<AuthDTO.AuthResponse> login(@Valid @RequestBody AuthDTO.LoginRequest request) {
        log.info("Login attempt: {}", request.getEmail());

        // 1. Authenticate credentials
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // 2. Load UserDetails and Entity
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userService.getUserEntityByEmail(userDetails.getUsername());

        // 3. Generate tokens using the rewritten JwtService (Now with roles!)
        String jwt = jwtService.generateToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        log.info("User {} logged in successfully with role: {}", user.getEmail(), user.getRole());
        return ResponseEntity.ok(mapToAuthResponse(user, jwt, refreshToken));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthDTO.AuthResponse> register(@Valid @RequestBody AuthDTO.RegisterRequest request) {
        log.info("Registration request: {}", request.getEmail());

        // 1. Register user
        User user = userService.registerUser(request);

        // 2. Generate tokens (User implements UserDetails)
        String jwt = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        return ResponseEntity.ok(mapToAuthResponse(user, jwt, refreshToken));
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refreshToken(@Valid @RequestBody AuthDTO.RefreshTokenRequest request) {
        String username = jwtService.extractUsername(request.getRefreshToken());

        if (username != null) {
            UserDetails userDetails = userService.loadUserByUsername(username);

            if (jwtService.isTokenValid(request.getRefreshToken(), userDetails)) {
                // Generate a fresh Access Token with roles
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
    public ResponseEntity<Void> logout() {
        // Stateless logout - handled by frontend clearing localStorage
        return ResponseEntity.ok().build();
    }

    /**
     * Maps the database entity and generated tokens to the DTO.
     * Ensure AuthDTO.AuthResponse has these fields.
     */
    private AuthDTO.AuthResponse mapToAuthResponse(User user, String token, String refreshToken) {
        AuthDTO.AuthResponse response = new AuthDTO.AuthResponse();
        response.setToken(token);
        response.setRefreshToken(refreshToken);
        response.setUserId(user.getId());
        response.setEmail(user.getEmail());
        response.setName(user.getName());

        // Return raw role name (ADMIN) for frontend logic
        response.setRole(user.getRole().name());



        return response;
    }
}