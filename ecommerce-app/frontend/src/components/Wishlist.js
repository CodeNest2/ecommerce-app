import React, { useEffect } from "react";
import "./Wishlist.css";
const API = "http://localhost:8081/api";

const Wishlist = ({ wishlist, setWishlist, setCart, user, reloadWishlist, reloadCart }) => {

  useEffect(()=>{ /* wishlist is provided by App */ }, []);

  const moveToCart = async (product) => {
    if (!user) { alert("Login required"); return; }
    await fetch(`${API}/cart`, { method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ userId: user.id, productId: product.id, quantity: 1 }) });
    // remove wishlist item
    await fetch(`${API}/wishlist/${user.id}/${product.id}`, { method: "DELETE" });
    await reloadCart();
    await reloadWishlist();
  };

  const removeFromWishlist = async (product) => {
    if (!user) return;
    await fetch(`${API}/wishlist/${user.id}/${product.id}`, { method: "DELETE" });
    await reloadWishlist();
  };

  return (
    <div className="wishlist">
      <h2>My Wishlist</h2>
      {wishlist.length===0 ? <p>No items in wishlist</p> : (
        <div className="wishlist-grid">
          {wishlist.map(w => {
            const p = w.product;
            return (
              <div key={w.id} className="wishlist-card">
                <img src={p.image} alt={p.name} />
                <h3>{p.name}</h3>
                <p>${p.price}</p>
                <div className="wishlist-actions">
                  <button onClick={()=>moveToCart(p)}>Move to Cart</button>
                  <button onClick={()=>removeFromWishlist(p)}>Remove</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
