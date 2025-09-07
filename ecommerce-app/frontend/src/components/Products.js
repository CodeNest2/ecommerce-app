import React, { useState } from "react";
import { Heart, Star } from "lucide-react";
import "./Products.css";

const sampleProducts = [
  { id: 1, name: "Diamond Ring", price: 2499, category: "jewelry", rating: 5, image: "images/diamond_ring.png" },
  { id: 2, name: "Designer Dress", price: 349, category: "clothing", rating: 4, image: "images/designer_dress.jpg" },
  { id: 3, name: "Leather Wallet", price: 1599, category: "Wallet", rating: 5, image: "images/leather-wallet.jpg" },
  { id: 4, name: "Smart Watch", price: 1999, category: "jewelry", rating: 4, image: "images/smart_watch.jpg" },
];

const Products = ({ cart, setCart, wishlist, setWishlist, searchQuery, selectedCategory }) => {
  const addToCart = (p) => {
    const existing = cart.find((i) => i.id === p.id);
    if (existing) {
      setCart(cart.map((i) => (i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i)));
    } else {
      setCart([...cart, { ...p, quantity: 1 }]);
    }
  };

  const toggleWishlist = (p) => {
    if (wishlist.some((i) => i.id === p.id)) {
      setWishlist(wishlist.filter((i) => i.id !== p.id));
    } else {
      setWishlist([...wishlist, p]);
    }
  };

  const filtered = sampleProducts.filter(
    (p) =>
      (selectedCategory === "all" || p.category === selectedCategory) &&
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="products-container">
      {filtered.map((p) => (
        <div key={p.id} className="product-card">
          <div className="product-img-wrapper">
            <img src={p.image} alt={p.name} />
            <button
              className={`wishlist-heart Rs.{wishlist.some((i) => i.id === p.id) ? "active" : ""}`}
              onClick={() => toggleWishlist(p)}
            >
              <Heart
                color={wishlist.some((i) => i.id === p.id) ? "red" : "gray"}
                fill={wishlist.some((i) => i.id === p.id) ? "red" : "none"}
              />
            </button>
          </div>
          <h3>{p.name}</h3>
          <p className="price">Rs.{p.price}</p>
          <div className="rating">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={i < p.rating ? "star-filled" : "star-empty"} />
            ))}
          </div>
          <button className="add-btn" onClick={() => addToCart(p)}>Add to Cart</button>
        </div>
      ))}
    </div>
  );
};

export default Products;
