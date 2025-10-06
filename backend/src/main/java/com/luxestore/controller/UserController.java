package com.luxestore.controller;

import com.luxestore.model.User;
import com.luxestore.repository.UserRepository;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {
  private final UserRepository repo;
  public UserController(UserRepository repo) { this.repo = repo; }

  @PostMapping("/signup")
  public User signup(@RequestBody User user) {
    return repo.save(user);
  }

  @PostMapping("/login")
  public User login(@RequestBody User login) {
    Optional<User> found = repo.findByEmail(login.getEmail());
    return found.filter(u -> u.getPassword().equals(login.getPassword()))
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));
  }

  @PutMapping("/{id}")
  public User update(@PathVariable Long id, @RequestBody User u) {
    User user = repo.findById(id).orElseThrow();
    user.setName(u.getName());
    user.setAddress(u.getAddress());
    user.setPhone(u.getPhone());
    return repo.save(user);
  }

  @GetMapping("/{id}")
  public User get(@PathVariable Long id) {
        return repo.findById(id).orElseThrow();
  }
}