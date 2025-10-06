import React from "react";
import "./Home.css";

const Home = ({ setCurrentView }) => (
  <section className="home">
    <h2>Luxury Jewelry & Fashion</h2>
    <p>Discover our exquisite collection of jewelry and designer clothing</p>
    <button onClick={() => setCurrentView("products")}>Shop Now</button>
  </section>
);

export default Home;
