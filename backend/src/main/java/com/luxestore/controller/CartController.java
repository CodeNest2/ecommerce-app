package com.luxestore.controller;

import com.luxestore.model.CartItem;
import com.luxestore.repository.CartRepository;

import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.luxestore.repository.ProductRepository;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "http://localhost:3000")
public class CartController {
  private final CartRepository repo;
  private final ProductRepository productRepo;
  public CartController(CartRepository repo, ProductRepository productRepo) {
    this.repo = repo;
    this.productRepo = productRepo;
  }

  @GetMapping("/{userId}")
  public List<CartItem> getForUser(@PathVariable Long userId) {
    return repo.findByUserId(userId);
  }

  @PostMapping
  public CartItem add(@RequestBody CartItem ci) {
    // if exists, update quantity (simple naive approach)
    List<CartItem> existing = repo.findByUserId(ci.getUserId()).stream().filter(i -> i.getProductId().equals(ci.getProductId())).toList();
    if (!existing.isEmpty()) {
      CartItem e = existing.get(0);
      e.setQuantity(e.getQuantity() + ci.getQuantity());
      return repo.save(e);
    }
    return repo.save(ci);
  }

  @PutMapping("/{id}")
  public int update(@PathVariable Long id, @RequestParam int qty) {
    return repo.updateQuantityById(id, qty);
  }

  @DeleteMapping("/{userId}/{productId}")
  public void remove(@PathVariable Long userId, @PathVariable Long productId) {
    repo.deleteByUserIdAndProductId(userId, productId);
  }
}
