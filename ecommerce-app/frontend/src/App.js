import React, { useState } from "react";
import Header from "./components/Header";
import Home from "./components/Home";
import Products from "./components/Products";
import Cart from "./components/Cart";
import Login from "./components/Login";
import Orders from "./components/Orders";
import Wishlist from "./components/Wishlist";
import Profile from "./components/Profile";
import "./App.css";

const App = () => {
  const [currentView, setCurrentView] = useState("home");
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // 🔹 Authentication (mock for now)
  const handleLogin = (email, password) => {
    if (email && password) {
      setUser({ email, name: email.split("@")[0] });
      setCurrentView("home");
      return true;
    }
    return false;
  };

  const handleSignup = (email, password, name, address, phone) => {
    if (email && password && name && address && phone) {
      setUser({ email, name, address, phone });
      setCurrentView("home");
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setUser(null);
    setCart([]);
    setWishlist([]);
    setOrders([]);
    setCurrentView("home");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header always visible */}
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

      {/* Views */}
      {currentView === "home" && <Home setCurrentView={setCurrentView} />}

      {currentView === "products" && (
        <Products
          cart={cart}
          setCart={setCart}
          wishlist={wishlist}
          setWishlist={setWishlist}
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
      )}

      {currentView === "cart" && (
        <Cart
          cart={cart}
          setCart={setCart}
          user={user}
          setOrders={setOrders}
          setCurrentView={setCurrentView}
        />
      )}

      {currentView === "login" && (
        <Login handleLogin={handleLogin} handleSignup={handleSignup} />
      )}

      {currentView === "orders" && user && <Orders orders={orders} />}

      {currentView === "wishlist" && (
        <Wishlist
          wishlist={wishlist}
          setWishlist={setWishlist}
          setCart={setCart}
        />
      )}

      {currentView === "profile" && user && (
        <Profile user={user} setUser={setUser} />
      )}
    </div>
  );
};

export default App;
