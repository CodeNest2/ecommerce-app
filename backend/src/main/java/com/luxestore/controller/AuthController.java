package com.luxestore.controller;

import com.luxestore.model.User;
import com.luxestore.repository.UserRepository;
import com.luxestore.security.JwtUtils;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
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

    @PostMapping("/signup")
    public User signup(@RequestBody User user) {
        user.setPassword(encoder.encode(user.getPassword()));
        user.setRoles(Set.of("ROLE_USER"));
        return repo.save(user);
    }
    @PostMapping("/login")
    public Map<String, String> login(@RequestBody Map<String, String> body) {
        User user = repo.findByEmail(body.get("email"))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        if (encoder.matches(body.get("password"), user.getPassword())) {
            String token = jwtUtils.generateToken(user.getEmail());
            return Map.of("token", token, "role", user.getRoles().toString(), "name", user.getName(), "id", user.getId().toString());
        } else {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
    }
}