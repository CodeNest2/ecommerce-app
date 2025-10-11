package com.luxestore.controller;

import com.luxestore.model.User;
import com.luxestore.repository.UserRepository;
import com.luxestore.security.JwtUtils;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Optional;
import java.util.Set;

@RestController
@RequestMapping("/api/auth") // Changed base path to avoid conflicts
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    private final UserRepository repo;
    private final PasswordEncoder encoder;
    private final JwtUtils jwtUtils;

    public AuthController(UserRepository repo, PasswordEncoder encoder, JwtUtils jwtUtils) {
        this.repo = repo;
        this.encoder = encoder;
        this.jwtUtils = jwtUtils;
    }

    // Signup with duplicate check -> return 409 if email exists
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody User user) {
        if (user.getEmail() == null || user.getPassword() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "email and password are required"));
        }
        Optional<User> exists = repo.findByEmail(user.getEmail());
        if (exists.isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Email already exists"));
        }
        try {
            user.setPassword(encoder.encode(user.getPassword()));
            user.setRoles(Set.of("ROLE_USER"));
            User saved = repo.save(user);
            // clear password before returning
            saved.setPassword(null);
            return ResponseEntity.ok(saved);
        } catch (DataIntegrityViolationException dive) {
            // defensive: unique constraint violation
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Email already exists"));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Failed to create account"));
        }
    }

    // Login returns token + user info (no password)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "email and password required"));
        }

        User user = repo.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!encoder.matches(password, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        // generate token
        String token = jwtUtils.generateToken(user.getEmail());

        // prepare user object to return (mask password)
        user.setPassword(null);

        Map<String, Object> resp = Map.of(
            "token", token,
            "user", Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "roles", user.getRoles()
            )
        );
        return ResponseEntity.ok(resp);
    }
}