import React, { useEffect, useMemo, useState } from "react";
import { Plus, Minus, X } from "lucide-react";
import "./Cart.css";

const API = "http://localhost:8081/api";

const Cart = ({ user, cart: propCart, reloadCart, setCurrentView }) => {
  const [cart, setCart] = useState([]);
  const [productsById, setProductsById] = useState({});

  // keep local cart in sync
  useEffect(() => {
    setCart(Array.isArray(propCart) ? propCart : []);
  }, [propCart]);

  // fetch product catalog once, build id->product map
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${API}/products`);
        const list = res.ok ? await res.json() : [];
        if (!mounted) return;
        const map = {};
        for (const p of list) map[p.id] = p;
        setProductsById(map);
      } catch {
        setProductsById({});
      }
    })();
    return () => { mounted = false; };
  }, []);

  // helper parsers
  const toNumber = (v) => {
    if (v == null) return 0;
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;
    const n = Number(String(v).replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  // join cart rows with products (to get name, image, price fallback)
  const rows = useMemo(() => {
    return (cart || []).map((row) => {
      const product = row.product || productsById[row.productId] || null;
      // prefer row.price if backend stores price snapshot; else product.price
      const unitPrice = toNumber(row.price ?? product?.price);
      const qty = toNumber(row.quantity);
      const subtotal = unitPrice * qty;
      return { ...row, product, unitPrice, qty, subtotal };
    });
  }, [cart, productsById]);

  const changeQty = async (productId, qty) => {
    if (!user) { alert("Login required"); return; }
    if (qty <= 0) {
      await fetch(`${API}/cart/${user.id}/${productId}`, { method: "DELETE" });
      await reloadCart?.();
      return;
    }
    await fetch(`${API}/cart/${productId}?qty=${qty}`, { method: "PUT" });
    await reloadCart?.();
  };

  const money = (n) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(n || 0);

  const subtotal = rows.reduce((s, r) => s + r.subtotal, 0);
  const estimatedTax = 0; // adjust if you calculate tax
  const total = subtotal + estimatedTax;

  return (
    <div className="cart">
      <h2>Shopping Cart</h2>

      {rows.length === 0 ? (
        <div className="cart-empty">
          <span className="icon">🛒</span>
          <h3>Your cart is empty</h3>
          <p>Browse products and add them to your cart.</p>
          <button
            type="button"
            className="cart-continue"
            onClick={() => setCurrentView?.("products")}
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          {/* Items list */}
          <div className="cart-list">
            {rows.map((item) => {
              const p = item.product || {};
              return (
                <div key={item.id || item.productId} className="cart-item">
                  <div className="cart-thumb">
                    {p?.image ? (
                      <img src={p.image} alt={p.name || "Product"} />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </div>

                  <div className="cart-info">
                    <h3 className="cart-title">{p?.name || "Product"}</h3>
                    <div className="cart-meta">
                      <span className="price-unit">
                        {money(item.unitPrice)} × {item.qty}
                      </span>
                    </div>

                    <div className="cart-controls">
                      <button
                        className="qty-btn"
                        onClick={() => changeQty(item.productId, item.qty - 1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="qty">{item.qty}</span>
                      <button
                        className="qty-btn"
                        onClick={() => changeQty(item.productId, item.qty + 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus size={16} />
                      </button>

                      <button
                        className="remove-btn"
                        onClick={() => changeQty(item.productId, 0)}
                        aria-label="Remove item"
                        title="Remove"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="cart-line-sub">{money(item.subtotal)}</div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <aside className="cart-summary">
            <h4>Order Summary</h4>
            <div className="row">
              <span>Items ({rows.length})</span>
              <span>{money(subtotal)}</span>
            </div>
            <div className="row">
              <span>Estimated Tax</span>
              <span>{money(estimatedTax)}</span>
            </div>
            <div className="divider" />
            <div className="row total">
              <span>Total</span>
              <span>{money(total)}</span>
            </div>

            <button
              className="checkout-btn"
              onClick={() => setCurrentView?.("checkout")}
            >
              Proceed to Checkout
            </button>
            <button className="link-btn" onClick={() => setCurrentView?.("products")}>
              ← Continue shopping
            </button>
          </aside>
        </div>
      )}
    </div>
  );
};

export default Cart;
