package com.luxestore.repository;

import com.luxestore.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CartRepository extends JpaRepository<CartItem, Long> {
  List<CartItem> findByUserId(Long userId);
  void deleteByUserIdAndProductId(Long userId, Long productId);
}
