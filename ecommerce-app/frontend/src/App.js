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
// import slider1 from '../src/assets/images/slider1.webp';
// import slider2 from '../src/assets/images/slider2.webp';
// import slider3 from '../src/assets/images/slider3.webp';
// import slider4 from '../src/assets/images/slider4.webp';
// ✅ Stripe
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Checkout from "./components/Checkout";

// Import css files
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
// import Slider from "react-slick";
const API = "http://localhost:8081/api";
const stripePromise = loadStripe("pk_test_YourPublishableKeyHere"); // your publishable key
// const sliders = [
//   { name: 'slider1', imageUrl: slider1 },
//   { name: 'slider2', imageUrl: slider2 },
//   { name: 'slider3', imageUrl: slider3 },
//   { name: 'slider4', imageUrl: slider4 }
// ]
function App() {
    var settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1
  };
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
    // cart
    fetch(`${API}/cart/${user.id}`).then(r=>r.json()).then(setCart).catch(()=>setCart([]));
    // wishlist
    fetch(`${API}/wishlist/${user.id}`).then(r=>r.json()).then(async (list) => {
      const prods = await fetch(`${API}/products`).then(r=>r.json());
      const joined = list.map(wi => ({ id: wi.id, product: prods.find(p=>p.id === wi.productId) }));
      setWishlist(joined);
    }).catch(()=>setWishlist([]));
    // (your original duplicated cart fetch kept as-is)
    fetch(`${API}/cart/${user.id}`)
      .then(res => res.ok ? res.json() : Promise.reject(`Cart fetch failed ${res.status}`))
      .then(setCart)
      .catch(err => { console.error("Failed to load cart:", err); setCart([]); });

    // ✅ fetch orders
    fetch(`${API}/orders/${user.id}`)
      .then(res => res.ok ? res.json() : Promise.reject(`Orders fetch failed ${res.status}`))
      .then((o) => setOrders(Array.isArray(o) ? o : []))
      .catch(err => { console.error("Failed to load orders:", err); setOrders([]); });

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
    setCart([]); setWishlist([]); setOrders([]);
    setCurrentView("home");
  };

  // helper to refresh cart from backend
  const reloadCart = async () => {
    if (!user) return;
    const c = await fetch(`${API}/cart/${user.id}`).then(r=>r.json()).catch(()=>[]);
    setCart(Array.isArray(c) ? c : []);
  };

  // helper to refresh wishlist
  const reloadWishlist = async () => {
    if (!user) return;
    const list = await fetch(`${API}/wishlist/${user.id}`).then(r=>r.json()).catch(()=>[]);
    const prods = await fetch(`${API}/products`).then(r=>r.json()).catch(()=>[]);
    const joined = (list || []).map(wi => ({ id: wi.id, product: prods.find(p=>p.id === wi.productId) }));
    setWishlist(joined);
  };

  // ✅ helper to refresh orders after payment
  const reloadOrders = async () => {
    if (!user) return;
    try {
      const o = await fetch(`${API}/orders/${user.id}`).then(r => r.json());
      setOrders(Array.isArray(o) ? o : []);
    } catch {
      setOrders([]);
    }
  };
  return (
    <div className="app-container">
      {/* <div style={{backgroundColor: '#fff'}}>
        {(sliders && sliders.length>0) ?
        <Slider {...settings}>
          {
            sliders.map((item, index)=>{
              <div key={item.imageUrl}>
                <img src={item.imageUrl} />
              </div>
            })
          }
        </Slider> : ''
        }
      </div> */}
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

      {/* ✅ Checkout view */}
      {currentView === "checkout" && (
        <Elements stripe={stripePromise}>
          <Checkout
            user={user}
            cart={cart}
            setCurrentView={setCurrentView}
            reloadCart={reloadCart}      // allow clearing/refreshing cart after payment
            reloadOrders={reloadOrders}  // allow refreshing orders after payment
          />
        </Elements>
      )}

      {currentView === "login" && (
        <Login handleLogin={handleLogin} handleSignup={handleSignup} />
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
