import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Home from "./components/Home";
import Products from "./components/Products";
import Cart from "./components/Cart";
import Login from "./components/Login";
import Orders from "./components/Orders";
import Wishlist from "./components/Wishlist";
import Profile from "./components/Profile";
import "./App.css";

const API = "http://localhost:8081/api";

function App() {
  const [currentView, setCurrentView] = useState("home");
  const [user, setUser] = useState(null); // {id, name, email, address, phone}
  const [cart, setCart] = useState([]); // cart items from backend
  const [wishlist, setWishlist] = useState([]); // wishlist items from backend
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // load cart & wishlist & orders when user changes
  useEffect(() => {
    if (!user) {
      setCart([]); setWishlist([]); setOrders([]);
      return;
    }
    // get cart
    fetch(`${API}/cart/${user.id}`).then(r=>r.json()).then(setCart).catch(()=>setCart([]));
    // get wishlist -> returns WishlistItem objects with productId
    fetch(`${API}/wishlist/${user.id}`).then(r=>r.json()).then(async (list) => {
      // fetch product details for each wishlist item
      const prodIds = list.map(i => i.productId);
      const prods = await fetch(`${API}/products`).then(r=>r.json());
      const joined = list.map(wi => ({ id: wi.id, product: prods.find(p=>p.id === wi.productId) }));
      setWishlist(joined);
    }).catch(()=>setWishlist([]));
    // get orders 
      fetch(`${API}/cart/${user.id}`)
    .then(res => res.ok ? res.json() : Promise.reject(`Cart fetch failed ${res.status}`))
    .then(setCart)
    .catch(err => {
      console.error("Failed to load cart:", err);
      setCart([]);
    
  });
  }, [user]);




  // login/signup handlers interact with backend
  const handleLogin = async (email, password) => {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST", headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) return false;
    const u = await res.json();
    setUser(u);
    setCurrentView("home");
    return true;
  };

  const handleSignup = async (email, password, name, address, phone) => {
    const res = await fetch(`${API}/auth/signup`, {
      method: "POST", headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ email, password, name, address, phone })
    });
    if (!res.ok) return false;
    const u = await res.json();
    setUser(u);
    setCurrentView("home");
    return true;
  };

  const handleLogout = () => {
    setUser(null);
    setCart([]);
    setWishlist([]);
    setOrders([]);
    setCurrentView("home");
  };

  // helper to refresh cart from backend
  const reloadCart = async () => {
    if (!user) return;
    const c = await fetch(`${API}/cart/${user.id}`).then(r=>r.json());
    setCart(c);
  };

  // helper to refresh wishlist
  const reloadWishlist = async () => {
    if (!user) return;
    const list = await fetch(`${API}/wishlist/${user.id}`).then(r=>r.json());
    const prods = await fetch(`${API}/products`).then(r=>r.json());
    const joined = list.map(wi => ({ id: wi.id, product: prods.find(p=>p.id === wi.productId) }));
    setWishlist(joined);
  };

  return (
    <div className="app-container">
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        user={user}
        cart={cart}
        wishlist={wishlist}
        handleLogout={handleLogout}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {currentView === "home" && <Home setCurrentView={setCurrentView} />}
      {currentView === "products" && (
        <Products
          user={user}
          cart={cart}
          setCart={setCart}
          wishlist={wishlist}
          setWishlist={setWishlist}
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          reloadCart={reloadCart}
          reloadWishlist={reloadWishlist}
        />
      )}
      {currentView === "cart" && (
        <Cart user={user} cart={cart} reloadCart={reloadCart} setCurrentView={setCurrentView} />
      )}
      {currentView === "login" && (
        <Login handleLogin={handleLogin} handleSignup={handleSignup} />
      )}

      {currentView === "orders" && user && (
        <Orders orders={orders} setCurrentView={setCurrentView} />
        )}
      
      {currentView === "wishlist" && (
        <Wishlist
          wishlist={wishlist}
          setWishlist={setWishlist}
          setCart={setCart}
          user={user}
          reloadWishlist={reloadWishlist}
          reloadCart={reloadCart}
        />
      )}
      {currentView === "profile" && user && <Profile user={user} setUser={setUser} />}

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <p>📍 LuxeStore, Banjara Hills, Hyderabad, India</p>
          <p>📧 support@luxestore.com | ☎ +91-8501832044, +91-7207192618</p>
          <p>© {new Date().getFullYear()} LuxeStore. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;