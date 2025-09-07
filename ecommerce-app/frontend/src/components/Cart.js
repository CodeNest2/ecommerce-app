import React, { useEffect, useState } from "react";
import { Plus, Minus, X } from "lucide-react";
import "./Cart.css";
const API = "http://localhost:8081/api";

const Cart = ({ user, cart: propCart, reloadCart, setCurrentView }) => {
  const [cart, setCart] = useState([]);

  useEffect(()=>{ setCart(propCart); },[propCart]);

  const changeQty = async (id, qty) => {
    if (qty <= 0) {
      // find productId to remove: backend uses userId/productId delete - but easier: find cart item id
      await fetch(`${API}/cart/${user.id}/${id}`, { method: "DELETE" }); // this assumes id is productId
      await reloadCart();
      return;
    }
    // here 'id' is cartItem id; update
    await fetch(`${API}/cart/${id}?qty=${qty}`, { method: "PUT" });
    await reloadCart();
  };

  const placeOrder = async () => {
    if (!user) { alert("Login required"); return; }
    if (!cart.length) { alert("Cart empty"); return; }
    const total = cart.reduce((s,i)=>s + (i.product?.price || i.price) * i.quantity, 0);
    const items = cart.map(i => ({ productId: i.product?.id || i.productId, quantity: i.quantity, price: i.product?.price || i.price }));
    await fetch(`${API}/orders`, {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ userId: user.id, total, itemsJson: JSON.stringify(items) })
    });
    // clear user's cart items
    for(const ci of cart) {
      await fetch(`${API}/cart/${user.id}/${ci.productId}`, { method: "DELETE" });
    }
    await reloadCart();
    setCurrentView("orders");
    alert("Order placed");
  };

  return (
    <div className="cart">
      <h2>Shopping Cart</h2>
      {cart.length===0 ? <p>Your cart is empty</p> : (
        <div>
          {cart.map(item => (
            <div key={item.id} className="cart-item">
              <img src={item.product?.image} alt={item.product?.name} />
              <div>
                <h3>{item.product?.name}</h3>
                <p>${item.product?.price}</p>
              </div>
              <div className="cart-actions">
                <button onClick={()=>changeQty(item.productId, item.quantity - 1)}><Minus/></button>
                <span>{item.quantity}</span>
                <button onClick={()=>changeQty(item.productId, item.quantity + 1)}><Plus/></button>
                <button onClick={()=>changeQty(item.productId, 0)}><X/></button>
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
