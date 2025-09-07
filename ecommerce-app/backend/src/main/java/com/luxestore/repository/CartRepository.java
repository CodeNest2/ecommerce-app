package com.luxestore.repository;

import com.luxestore.model.CartItem;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import jakarta.transaction.Transactional;

@Repository
public interface CartRepository extends JpaRepository<CartItem, Long> {
  List<CartItem> findByUserId(Long userId);
  //void deleteByUserIdAndProductId(Long userId, Long productId);

  @Modifying
  @Transactional
  @Query("DELETE FROM CartItem c WHERE c.userId = :userId AND c.productId = :productId")
  void deleteByUserIdAndProductId(@Param("userId") Long userId, @Param("productId") Long productId);
}
