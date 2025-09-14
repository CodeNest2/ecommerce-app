import React from "react";
import "./Orders.css";

const Orders = ({ orders = [], loading = false, setCurrentView }) => {
  const list = Array.isArray(orders) ? orders : [];

  if (loading) {
    return (
      <div className="orders-wrapper">
        <h2 className="orders-title">Order History</h2>
        <div className="orders-loading">Loading orders…</div>
      </div>
    );
  }

  return (
    <div className="orders-wrapper">
      <h2 className="orders-title">Order History</h2>

      {list.length === 0 ? (
        <div className="orders-empty">
          <p>No orders yet</p>
          <button
            className="orders-shop-btn"
            onClick={() => setCurrentView("products")}
          >
            Shop Now
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {list.map((o) => (
            <div key={o.id} className="order-card">
              <div className="order-card-header">
                <div>
                  <div className="order-id">Order #{o.id}</div>
                  <div className="order-date">{o.date || o.createdAt || ""}</div>
                </div>
                <div className="order-meta">
                  <div className="order-total">
                    ₹{Number(o.total ?? 0).toFixed(2)}
                  </div>
                  <div
                    className={`order-status ${
                      String(o.status).toLowerCase() || "processing"
                    }`}
                  >
                    {o.status || "Processing"}
                  </div>
                </div>
              </div>

              <div className="order-items">
                {Array.isArray(o.items) && o.items.length > 0 ? (
                  o.items.map((it) => {
                    const key = it.id ?? it.productId ?? JSON.stringify(it);
                    const name = it.name ?? it.product?.name ?? "Item";
                    const qty = it.quantity ?? it.qty ?? 1;
                    const price = Number(it.price ?? it.product?.price ?? 0);
                    return (
                      <div className="order-item" key={key}>
                        <div className="order-item-left">
                          <img
                            className="order-item-image"
                            src={
                              it.product?.image ??
                              it.image ??
                              `https://picsum.photos/seed/${key}/80/80`
                            }
                            alt={name}
                          />
                          <div className="order-item-meta">
                            <div className="order-item-name">{name}</div>
                            <div className="order-item-qty">Qty: {qty}</div>
                          </div>
                        </div>
                        <div className="order-item-price">
                          ₹{(price * qty).toFixed(2)}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="order-no-items">Item details not available</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
