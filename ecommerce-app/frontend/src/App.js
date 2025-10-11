import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Home from "./components/Home";
import Products from "./components/Products";
import Cart from "./components/Cart";
import Login from "./components/Login";
import Orders from "./components/Orders";
import Wishlist from "./components/Wishlist";
import Profile from "./components/Profile";
import Checkout from "./components/Checkout";
import "./App.css";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API = "http://localhost:8081/api";
const stripePromise = loadStripe("pk_test_YourPublishableKeyHere");

function App() {
  const [currentView, setCurrentView] = useState("home");
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    if (!user) {
      setCart([]);
      setWishlist([]);
      setOrders([]);
      return;
    }

    fetch(`${API}/cart/${user.id}`)
      .then((r) => r.json())
      .then(setCart)
      .catch(() => setCart([]));

    fetch(`${API}/wishlist/${user.id}`)
      .then((r) => r.json())
      .then(async (list) => {
        const prods = await fetch(`${API}/products`).then((r) => r.json());
        const joined = list.map((wi) => ({
          id: wi.id,
          product: prods.find((p) => p.id === wi.productId),
        }));
        setWishlist(joined);
      })
      .catch(() => setWishlist([]));

    fetch(`${API}/orders/${user.id}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((o) => setOrders(Array.isArray(o) ? o : []))
      .catch(() => setOrders([]));
  }, [user]);

  const handleLogin = async (email, password) => {
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          body?.message ||
          (res.status === 401
            ? "Invalid email or password"
            : "Login failed. Try again.");
        toast.error(msg, { position: "top-center" });
        return false;
      }

      const token = body.token;
      const userObj = body.user;

      if (!token || !userObj) {
        toast.error("Invalid response from server", { position: "top-center" });
        console.error("Invalid login response:", body);
        return false;
      }

      localStorage.setItem("token", token);
      setUser({
        id: userObj.id,
        name: userObj.name,
        email: userObj.email,
        roles: userObj.roles,
      });

      toast.success(`✅ Welcome back, ${userObj.name || "User"}!`, {
        position: "top-center",
      });
      setCurrentView("home");
      return true;
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Something went wrong. Please try again.", {
        position: "top-center",
      });
      return false;
    }
  };

  const handleSignup = async (email, password, name, address, phone) => {
    try {
      console.info("Signup request:", { email, name, address, phone });

      const res = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, address, phone }),
      });

      const rawText = await res.text().catch(() => "");
      let body = {};
      try {
        body = rawText ? JSON.parse(rawText) : {};
      } catch (e) {}

      console.info("Signup response:", res.status, body || rawText);

      if (res.status === 409) {
        toast.error("❌ Email or phone already exists.", {
          position: "top-center",
        });
        return false;
      }

      if (!res.ok) {
        const msg =
          body.message ||
          body.error ||
          rawText ||
          "Signup failed. Please try again.";
        toast.error(msg, { position: "top-center" });
        return false;
      }

      toast.success("🎉 Account created successfully! Redirecting to login...", {
        position: "top-center",
        autoClose: 1500,
      });

      // trigger login view (immediate + delayed)
      setCurrentView("login");
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setCurrentView("login");
      }, 1600);

      return true;
    } catch (err) {
      console.error("Signup error:", err);
      toast.error("Something went wrong. Please try again.", {
        position: "top-center",
      });
      return false;
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCart([]);
    setWishlist([]);
    setOrders([]);
    localStorage.removeItem("token");
    setCurrentView("home");
    toast.info("👋 Logged out successfully!", { position: "top-center" });
  };

  const reloadCart = async () => {
    if (!user) return;
    const c = await fetch(`${API}/cart/${user.id}`).then((r) => r.json());
    setCart(Array.isArray(c) ? c : []);
  };

  const reloadWishlist = async () => {
    if (!user) return;
    const list = await fetch(`${API}/wishlist/${user.id}`).then((r) => r.json());
    const prods = await fetch(`${API}/products`).then((r) => r.json());
    const joined = (list || []).map((wi) => ({
      id: wi.id,
      product: prods.find((p) => p.id === wi.productId),
    }));
    setWishlist(joined);
  };

  const reloadOrders = async () => {
    if (!user) return;
    try {
      const o = await fetch(`${API}/orders/${user.id}`).then((r) => r.json());
      setOrders(Array.isArray(o) ? o : []);
    } catch {
      setOrders([]);
    }
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
        <Cart
          user={user}
          cart={cart}
          reloadCart={reloadCart}
          setCurrentView={setCurrentView}
        />
      )}

      {currentView === "checkout" && (
        <Elements stripe={stripePromise}>
          <Checkout
            user={user}
            cart={cart}
            setCurrentView={setCurrentView}
            reloadCart={reloadCart}
            reloadOrders={reloadOrders}
          />
        </Elements>
      )}

      {/* IMPORTANT: pass initialAuthView="login" so the Login component shows the login tab */}
      {currentView === "login" && (
        <Login
          handleLogin={handleLogin}
          handleSignup={handleSignup}
          initialAuthView="login"
        />
      )}

      {currentView === "orders" && user && (
        <Orders orders={orders} user={user} setCurrentView={setCurrentView} />
      )}

      {currentView === "wishlist" && (
        <Wishlist
          wishlist={wishlist}
          setWishlist={setWishlist}
          setCart={setCart}
          user={user}
          reloadWishlist={reloadWishlist}
          reloadCart={reloadCart}
          setActiveTab={setCurrentView}
        />
      )}

      {currentView === "profile" && user && (
        <Profile user={user} setUser={setUser} />
      )}

      <footer className="footer">
        <div className="footer-content">
          <p>📍 LuxeStore, Banjara Hills, Hyderabad, India</p>
          <p>📧 support@luxestore.com | ☎ +91-8501832044, +91-7207192618</p>
          <p>© {new Date().getFullYear()} LuxeStore. All rights reserved.</p>
        </div>
      </footer>

      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}

export default App;
