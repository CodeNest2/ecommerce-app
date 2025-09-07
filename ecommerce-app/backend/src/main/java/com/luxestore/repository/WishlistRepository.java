package com.luxestore.repository;

import com.luxestore.model.WishlistItem;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import jakarta.transaction.Transactional;

@Repository
public interface WishlistRepository extends JpaRepository<WishlistItem, Long> {
  List<WishlistItem> findByUserId(Long userId);
  Optional<WishlistItem> findByUserIdAndProductId(Long userId, Long productId);
  //void deleteByUserIdAndProductId(Long userId, Long productId);

@Modifying
@Transactional
@Query("DELETE FROM WishlistItem w WHERE w.userId = :userId AND w.productId = :productId")
void deleteByUserIdAndProductId(@Param("userId") Long userId, @Param("productId") Long productId);

}
