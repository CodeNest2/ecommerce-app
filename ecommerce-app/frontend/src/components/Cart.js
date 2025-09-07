import React from "react";
import { Plus, Minus, X } from "lucide-react";
import "./Cart.css";

const Cart = ({ cart, setCart, user, setOrders, setCurrentView }) => {
  const updateQty = (id, qty) => {
    if (qty <= 0) setCart(cart.filter((i) => i.id !== id));
    else setCart(cart.map((i) => (i.id === id ? { ...i, quantity: qty } : i)));
  };

  const placeOrder = () => {
    const order = {
      id: Date.now(),
      items: [...cart],
      total: cart.reduce((t, i) => t + i.price * i.quantity, 0),
      date: new Date().toLocaleDateString(),
    };
    setOrders((prev) => [order, ...prev]);
    setCart([]);
    setCurrentView("orders");
  };

  return (
    <div className="cart">
      <h2>Shopping Cart</h2>
      {cart.length === 0 ? <p>Your cart is empty</p> : (
        <div>
          {cart.map((item) => (
            <div key={item.id} className="cart-item">
              <img src={item.image} alt={item.name} />
              <div>
                <h3>{item.name}</h3>
                <p>Rs.{item.price}</p>
              </div>
              <div className="cart-actions">
                <button onClick={() => updateQty(item.id, item.quantity - 1)}><Minus /></button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQty(item.id, item.quantity + 1)}><Plus /></button>
                <button onClick={() => setCart(cart.filter((i) => i.id !== item.id))}><X /></button>
              </div>
            </div>
          ))}
          <button className="checkout-btn" onClick={placeOrder}>Place Order</button>
        </div>
      )}
    </div>
  );
};

export default Cart;
