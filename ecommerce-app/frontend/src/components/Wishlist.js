import React from "react";
import "./Wishlist.css";

const Wishlist = ({ wishlist, setWishlist, setCart }) => {
  const addToCart = (product) => {
    setCart((prev) => [...prev, { ...product, quantity: 1 }]);
    setWishlist(wishlist.filter((item) => item.id !== product.id));
  };

  return (
    <div className="wishlist">
      <h2>My Wishlist</h2>
      {wishlist.length === 0 ? (
        <p>No items in wishlist</p>
      ) : (
        <div className="wishlist-grid">
          {wishlist.map((p) => (
            <div key={p.id} className="wishlist-card">
              <img src={p.image} alt={p.name} />
              <h3>{p.name}</h3>
              <p>Rs.{p.price}</p>
              <div className="wishlist-actions">
                <button onClick={() => addToCart(p)}>Move to Cart</button>
                <button onClick={() => setWishlist(wishlist.filter((i) => i.id !== p.id))}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
