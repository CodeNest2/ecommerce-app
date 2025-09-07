import React from "react";
import "./Orders.css";

const Orders = ({ orders }) => (
  <div className="orders">
    <h2>Order History</h2>
    {orders.length === 0 ? <p>No orders yet</p> : (
      <div>
        {orders.map((o) => (
          <div key={o.id} className="order-card">
            <div className="order-header">
              <span>Order #{o.id}</span>
              <span>{o.date}</span>
            </div>
            <div className="order-items">
              {o.items.map((i) => (
                <p key={i.id}>{i.name} x {i.quantity} = Rs.{i.price * i.quantity}</p>
              ))}
            </div>
            <div className="order-total">Total: Rs.{o.total}</div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default Orders;
