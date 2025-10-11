import React, { useEffect } from "react";
import "./Wishlist.css";

const API = process.env.REACT_APP_API_URL || "/api";


const Wishlist = ({
  wishlist,
  setWishlist,
  setCart,
  user,
  reloadWishlist,
  reloadCart,
  setActiveTab // 👈 parent should pass this down
}) => {
  useEffect(() => { /* wishlist is provided by App */ }, []);

  const moveToCart = async (product) => {
    if (!user) { alert("Login required"); return; }
    await fetch(`${API}/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, productId: product.id, quantity: 1 }),
    });
    await fetch(`${API}/wishlist/${user.id}/${product.id}`, { method: "DELETE" });
    await reloadCart?.();
    await reloadWishlist?.();
  };

  const removeFromWishlist = async (product) => {
    if (!user) return;
    await fetch(`${API}/wishlist/${user.id}/${product.id}`, { method: "DELETE" });
    await reloadWishlist?.();
  };

  const handleContinueShopping = () => {
    if (typeof setActiveTab === "function") {
      setActiveTab("products"); // 👈 switch to Products tab
    }
  };

  return (
    <div className="wishlist">
      <h2>My Wishlist</h2>

      {wishlist.length === 0 ? (
        <div className="wishlist-empty">
          <span className="icon">🤍</span>
          <h3>No items saved</h3>
          <p>Browse products and add them to your wishlist for later.</p>
          <button type="button" className="continue-btn" onClick={handleContinueShopping}>
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlist.map((w) => {
            const p = w.product;
            return (
              <div key={w.id} className="wishlist-card">
                <img
                  src={p.image || "https://picsum.photos/480/360"}
                  alt={p.name}
                  onError={(e) => (e.currentTarget.src = "https://picsum.photos/480/360")}
                />
                <h3>{p.name}</h3>
                <p>₹{p.price}</p>
                <div className="wishlist-actions">
                  <button onClick={() => moveToCart(p)}>Move to Cart</button>
                  <button onClick={() => removeFromWishlist(p)}>Remove</button>
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
