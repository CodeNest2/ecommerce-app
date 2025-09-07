package com.luxestore.controller;

import com.luxestore.model.WishlistItem;
import com.luxestore.repository.WishlistRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/wishlist")
@CrossOrigin(origins = "http://localhost:3000")
public class WishlistController {
  private final WishlistRepository repo;
  public WishlistController(WishlistRepository repo) { this.repo = repo; }

  @GetMapping("/{userId}")
  public List<WishlistItem> get(@PathVariable Long userId) { return repo.findByUserId(userId); }

  @PostMapping
  public WishlistItem add(@RequestBody WishlistItem item) { return repo.save(item); }

  @DeleteMapping("/{userId}/{productId}")
  public void remove(@PathVariable Long userId, @PathVariable Long productId) {
    repo.deleteByUserIdAndProductId(userId, productId);
  }

  @GetMapping("/exists/{userId}/{productId}")
  public boolean exists(@PathVariable Long userId, @PathVariable Long productId) {
    return repo.findByUserIdAndProductId(userId, productId).isPresent();
  }
}
