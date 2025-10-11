import React, { useState } from "react";
import { ShoppingCart, User, Search, Menu, X, Heart } from "lucide-react";
import "./Header.css";

const Header = ({ currentView, setCurrentView, user, cart, wishlist, handleLogout, searchQuery, setSearchQuery }) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <header className="header">
      <div className="header-container">
        <h1 className="logo" onClick={() => setCurrentView("home")}>LuxeStore</h1>

        <nav className="nav">
          <button onClick={() => setCurrentView("home")} className={currentView === "home" ? "active" : ""}>Home</button>
          <button onClick={() => setCurrentView("products")} className={currentView === "products" ? "active" : ""}>Products</button>
          <button onClick={() => setCurrentView("wishlist")} className={currentView === "wishlist" ? "active" : ""}>Wishlist</button>
          {user && <button onClick={() => setCurrentView("orders")} className={currentView === "orders" ? "active" : ""}>My Orders</button>}
        </nav>

        <div className="actions">
          {/* Search */}
          <div className="search">
            <Search className="icon" />
            <input type="text" placeholder="Search Products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          {/* Cart */}
          <button className="cart-btn" onClick={() => setCurrentView("cart")}>
            <ShoppingCart />
            {cart.length > 0 && <span className="cart-count">{cart.reduce((s, i) => s + i.quantity, 0)}</span>}
          </button>

          {/* Wishlist */}
          <button className="wishlist-icon" onClick={() => setCurrentView("wishlist")}>
            <Heart color="black" fill="antiquewhite" />
            {wishlist.length > 0 && <span className="wishlist-count">{wishlist.length}</span>}
          </button>

          {/* User */}
          {user ? (
            <div className="user-menu">
              <button className="user-btn"><User color="black" /> {user.name}</button>
              <div className="dropdown">
                <button onClick={() => setCurrentView("profile")}>☰ Profile</button>
                <button onClick={handleLogout}>Logout</button>
              </div>
            </div>
          ) : (
            <button className="login-btn" onClick={() => setCurrentView("login")}>Login</button>
          )}

          {/* Mobile Menu */}
          <button className="menu-btn" onClick={() => setShowMobileMenu(!showMobileMenu)}>
            {showMobileMenu ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
