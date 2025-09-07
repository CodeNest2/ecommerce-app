import React, { useEffect, useState } from "react";
import { Heart, Star } from "lucide-react";
import "./Products.css";

// make sure this matches the port your backend actually runs on.
// If backend runs on 8081 (your logs), keep 8081. If 8080, change to 8080.
const API = "http://localhost:8081/api";

const Products = ({ user, cart, setCart, wishlist = [], setWishlist = () => {}, searchQuery = "", selectedCategory = "all", reloadCart, reloadWishlist }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // helper that throws on non-2xx so we can log server errors too
  async function fetchJson(url, options) {
    const res = await fetch(url, options);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const msg = `HTTP ${res.status} ${res.statusText} ${text ? "- " + text : ""}`;
      const e = new Error(msg);
      e.status = res.status;
      throw e;
    }
    return res.json();
  }

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const data = await fetchJson(`${API}/products`);
        if (mounted) setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Products fetch failed:", err);
        if (mounted) setError(err.message || "Network error");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []); // load once; add dependencies if you want refetch on change

  const addToCartBackend = async (product) => {
    if (!user) { alert("Please login"); return; }
    try {
      await fetchJson(`${API}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, productId: product.id, quantity: 1 })
      });
      await reloadCart?.();
      alert("Added to cart");
    } catch (err) {
      console.error("Add to cart failed:", err);
      alert("Failed to add to cart: " + (err.message || err));
    }
  };

  const toggleWishlistBackend = async (product) => {
    if (!user) { alert("Please login"); return; }
    try {
      const exists = await fetchJson(`${API}/wishlist/exists/${user.id}/${product.id}`);
      if (exists) {
        // delete
        const res = await fetch(`${API}/wishlist/${user.id}/${product.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(`Delete wishlist failed: ${res.status}`);
      } else {
        await fetchJson(`${API}/wishlist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, productId: product.id })
        });
      }
      await reloadWishlist?.();
    } catch (err) {
      console.error("Toggle wishlist failed:", err);
      alert("Failed to update wishlist: " + (err.message || err));
    }
  };

  const filtered = products.filter(p =>
    (selectedCategory === "all" || p.category === selectedCategory) &&
    p.name.toLowerCase().includes((searchQuery || "").toLowerCase())
  );

  if (loading) return <div className="products-loading">Loading products…</div>;
  if (error) return <div className="products-error">Error loading products: {error}</div>;

  return (
    <div className="products-container">
      {filtered.map(p => (
        <div key={p.id} className="product-card">
          <div className="product-img-wrapper">
            <img src={p.image || "https://picsum.photos/300"} alt={p.name} onError={(e)=>e.currentTarget.src="https://picsum.photos/300"} />
            <button
              className={`wishlist-heart ${wishlist.some(w => w.product && w.product.id === p.id) ? 'active' : ''}`}
              onClick={() => toggleWishlistBackend(p)}
              title="Toggle wishlist"
              aria-label="Toggle wishlist"
            >
              <Heart
                color={wishlist.some(w => w.product && w.product.id === p.id) ? "red" : "gray"}
                fill={wishlist.some(w => w.product && w.product.id === p.id) ? "red" : "none"}
              />
              {/* inline count if you want */}
            </button>
          </div>

          <h3>{p.name}</h3>
          <p className="price">₹{p.price}</p>
          <div className="rating">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={i < Math.floor(p.rating || 4) ? 'star-filled' : 'star-empty'} />
            ))}
          </div>
          <button className="add-btn" onClick={() => addToCartBackend(p)}>Add to Cart</button>
        </div>
      ))}
    </div>
  );
};

export default Products;
