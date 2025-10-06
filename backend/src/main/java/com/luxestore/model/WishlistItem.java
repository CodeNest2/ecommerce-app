package com.luxestore.model;

import jakarta.persistence.*;

@Entity
public class WishlistItem {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  private Long userId;
  private Long productId;

  // Explicit public no-arg constructor for Jackson and JPA
  public WishlistItem() {}

  public WishlistItem(Long userId, Long productId) {
    this.userId = userId;
    this.productId = productId;
  }

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public Long getUserId() { return userId; }
  public void setUserId(Long userId) { this.userId = userId; }
  public Long getProductId() { return productId; }
  public void setProductId(Long productId) { this.productId = productId; }
}