package com.luxestore.controller;

import com.luxestore.model.OrderEntity;
import com.luxestore.repository.OrderRepository;
import org.springframework.web.bind.annotation.*;
import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "http://localhost:3000")
public class OrderController {
  private final OrderRepository repo;
  public OrderController(OrderRepository repo) { this.repo = repo; }

  @PostMapping
  public OrderEntity place(@RequestBody OrderEntity order) {
    order.setOrderDate(new Date());
    return repo.save(order);
  }

  @GetMapping("/{userId}")
  public List<OrderEntity> byUser(@PathVariable Long userId) {
    return repo.findByUserId(userId);
  }
}
