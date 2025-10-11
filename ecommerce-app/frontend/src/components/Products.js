import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Heart } from "lucide-react";
import { toast } from "react-toastify";
import "./Products.css";

const API = "http://localhost:8081/api";

const CATEGORY_LABELS = {
  all: "All Categories",
  clothing: "Clothing",
  fashion: "Fashion",
  electronics: "Electronics",
  accessories: "Accessories",
  home: "Home & Lifestyle",
  health: "Health & Beauty",
  books: "Books & Music",
  gifts: "Gifts & Cakes",
  groceries: "Groceries",
};

const CATEGORY_IMAGES = {
  all: "🛍️",
  clothing: "🥻",
  fashion: "👗",
  electronics: "📱",
  accessories: "⌚",
  home: "🏠",
  health: "💅",
  books: "📚",
  gifts: "🎁",
  groceries: "🛒",
};

const norm = (s) => String(s || "").trim().toLowerCase();

function buildDetails(p = {}) {
  const name = (p.name || "").toLowerCase();
  const cat = norm(p.category);
  const isSaree = name.includes("saree") || name.includes("sari");
  const isLehenga = name.includes("lehenga") || cat === "fashion";
  const isClothing = cat === "clothing" || isSaree || isLehenga;

  if (isClothing) {
    const fabric = name.includes("silk")
      ? "Premium art silk with soft fall"
      : name.includes("cotton")
      ? "Breathable cotton for all-day comfort"
      : "Blended fabric chosen for drape & durability";

    const work =
      name.includes("embroider") || name.includes("zari") || name.includes("mirror")
        ? "Hand-finished embroidery with reinforced seams"
        : "Neat machine stitching with quality checks at each stage";

    const style = isLehenga
      ? "Lehenga set includes skirt, blouse, and dupatta; semi-stitched for easy alterations."
      : isSaree
      ? "Saree length ~5.5–6.2m; unstitched blouse piece included."
      : "Tailored silhouette for a comfortable fit.";

    return {
      quality: "Inspected for fabric feel, stitch density, and color fastness.",
      materials: fabric,
      workmanship: work,
      fit: style,
      care: "Dry clean recommended for first wash; gentle hand wash later.",
      shipping: "Ships within 24–48 hours. Free on prepaid orders.",
      returns: "7-day easy exchange for size or defects.",
      warranty: "30-day warranty for seam and color issues.",
    };
  }

  if (cat === "electronics") {
    return {
      quality: "QC passed with multi-point testing for ports, buttons, and battery.",
      materials: "ABS/Aluminum chassis; RoHS compliant.",
      workmanship: "Precision assembly with heat checks for durability.",
      fit: "Ergonomic design suitable for long use.",
      care: "Keep away from water. Use certified chargers.",
      shipping: "Tamper-proof packaging with protective foam.",
      returns: "7-day DOA replacement; 1-year manufacturer warranty.",
      warranty: "Covers manufacturing defects. No physical damage covered.",
    };
  }

  return {
    quality: "Individually inspected before dispatch.",
    materials: "High-grade materials selected for longevity.",
    workmanship: "Clean finishing and durable stitching.",
    fit: "Designed for comfort and usability.",
    care: "Wipe/hand wash gently. Keep away from direct heat.",
    shipping: "Ships in 1–2 business days.",
    returns: "7-day easy return policy.",
    warranty: "Standard warranty against defects.",
  };
}

const Products = ({ user, cart, setCart, wishlist = [], reloadCart, reloadWishlist }) => {
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [showTabs, setShowTabs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const onKeyDown = useCallback((e) => {
    if (e.key === "Escape") setSelected(null);
  }, []);

  useEffect(() => {
    if (selected) {
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }
  }, [selected, onKeyDown]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`${API}/products`);
        const data = res.ok ? await res.json() : [];
        if (mounted) setProducts(Array.isArray(data) ? data : []);
      } catch (e) {
        if (mounted) setError(e.message || "Failed to load products");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  const categories = useMemo(() => {
    const set = new Set(["all"]);
    for (const p of products) if (p.category) set.add(norm(p.category));
    return Array.from(set);
  }, [products]);

  const filtered = useMemo(() => {
    if (activeCategory === "all") return products;
    return products.filter((p) => norm(p.category) === activeCategory);
  }, [products, activeCategory]);

  async function fetchJson(url, options) {
    const res = await fetch(url, options);
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText}${txt ? " - " + txt : ""}`);
    }
    return res.json();
  }

  const addToCartBackend = async (product) => {
    if (!user) {
      toast.warning("⚠️ Please login to add products to cart", { position: "top-center" });
      return;
    }
    try {
      await fetchJson(`${API}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, productId: product.id, quantity: 1 }),
      });
      await reloadCart?.();
      toast.success(`🛒 ${product.name} added to cart!`, { position: "top-center" });
    } catch (err) {
      toast.error("Failed to add to cart", { position: "top-center" });
    }
  };

  const toggleWishlistBackend = async (product) => {
    if (!user) {
      toast.warning("⚠️ Please login to use wishlist", { position: "top-center" });
      return;
    }
    try {
      const exists = await fetchJson(`${API}/wishlist/exists/${user.id}/${product.id}`);
      if (exists) {
        const res = await fetch(`${API}/wishlist/${user.id}/${product.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Delete wishlist failed");
        toast.info("❤️ Removed from wishlist", { position: "top-center" });
      } else {
        await fetchJson(`${API}/wishlist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, productId: product.id }),
        });
        toast.success("💖 Added to wishlist!", { position: "top-center" });
      }
      await reloadWishlist?.();
    } catch (err) {
      toast.error("Failed to update wishlist", { position: "top-center" });
    }
  };

  if (loading) return <div className="products-loading">Loading products…</div>;
  if (error) return <div className="products-error">{error}</div>;

  return (
    <div className="products-page">
      <div className="products-toolbar">
        <button className="btn btn-cats" onClick={() => setShowTabs((s) => !s)}>
          {showTabs ? "⠿ Hide Categories" : "⠿ Categories"}
        </button>
      </div>

      {showTabs && (
        <div className="category-tabs">
          {categories.map((c) => (
            <button
              key={c}
              className={`cat-tab ${activeCategory === c ? "active" : ""}`}
              onClick={() => setActiveCategory(c)}
              title={CATEGORY_LABELS[c] || c}
            >
              {CATEGORY_IMAGES[c]} {CATEGORY_LABELS[c] || c}
            </button>
          ))}
        </div>
      )}

      <div className="products-container">
        {filtered.map((p) => (
          <div key={p.id} className="product-card">
            <div
              className="product-img-wrapper"
              onClick={() => setSelected(p)}
              title="View details"
              style={{ cursor: "pointer" }}
            >
              <img
                src={p.image || "https://picsum.photos/300"}
                alt={p.name}
                onError={(e) => (e.currentTarget.src = "https://picsum.photos/300")}
              />
              <button
                className={`wishlist-heart ${
                  wishlist.some((w) => w.product && w.product.id === p.id) ? "active" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWishlistBackend(p);
                }}
                aria-label="Toggle wishlist"
              >
                <Heart
                  color={wishlist.some((w) => w.product && w.product.id === p.id) ? "red" : "gray"}
                  fill={wishlist.some((w) => w.product && w.product.id === p.id) ? "red" : "none"}
                />
              </button>
            </div>
            <h3 className="product-name">{p.name}</h3>
            <p className="price">₹{p.price}</p>
            <button className="add-btn" onClick={() => addToCartBackend(p)}>
              Add to Cart
            </button>
          </div>
        ))}
      </div>

      {/* Product Details Modal */}
      {selected && (
        <div
          role="dialog"
          onClick={() => setSelected(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 60,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(860px, 96vw)",
              background: "#fff",
              borderRadius: 14,
              border: "1px solid rgba(0,0,0,.08)",
              boxShadow: "0 20px 50px rgba(2,6,23,.25)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 1fr",
                minHeight: 360,
              }}
            >
              <div style={{ position: "relative", background: "#f3f4f6" }}>
                <img
                  src={selected.image || "https://picsum.photos/600/800"}
                  alt={selected.name}
                  onError={(e) => (e.currentTarget.src = "https://picsum.photos/600/800")}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </div>
              <div style={{ padding: 16 }}>
                <h3>{selected.name}</h3>
                <p style={{ fontWeight: 700, fontSize: 16 }}>₹{selected.price}</p>

                {(() => {
                  const d = buildDetails(selected);
                  return (
                    <div style={{ fontSize: 14, lineHeight: 1.5 }}>
                      {Object.entries(d).map(([k, v]) => (
                        <p key={k}>
                          <strong>{k.charAt(0).toUpperCase() + k.slice(1)}:</strong> {v}
                        </p>
                      ))}
                    </div>
                  );
                })()}

                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <button
                    className="add-btn"
                    onClick={() => {
                      addToCartBackend(selected);
                      setSelected(null);
                    }}
                    style={{ flex: 1 }}
                  >
                    Add to Cart
                  </button>
                  <button
                    className="add-btn"
                    onClick={() => setSelected(null)}
                    style={{
                      flex: 1,
                      background: "#fff",
                      color: "#111827",
                      border: "1px solid rgba(0,0,0,.12)",
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
