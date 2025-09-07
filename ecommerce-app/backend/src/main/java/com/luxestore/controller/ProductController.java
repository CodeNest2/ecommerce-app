package com.luxestore.controller;

import com.luxestore.model.Product;
import com.luxestore.repository.ProductRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:3000")
public class ProductController {
  private final ProductRepository repo;
  public ProductController(ProductRepository repo) { this.repo = repo; }

  @GetMapping
  public List<Product> all() { return repo.findAll(); }

  @PutMapping("/{id}/decrease")
  public Product decrease(@PathVariable Long id, @RequestParam int qty) {
    Product p = repo.findById(id).orElseThrow();
    if (p.getQuantity() < qty) throw new RuntimeException("Not enough stock");
    p.setQuantity(p.getQuantity() - qty);
    return repo.save(p);
  }
}
