import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Heart } from "lucide-react";
import "./Products.css";
import { ToastContainer, toast } from 'react-toastify';

const API = "http://localhost:8081/api";

// Map backend category -> UI tab label
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

// Small image map for category tabs (optional; place files in /public/icons/)
// NOTE: these are PATHS to images now (not emoji).
const CATEGORY_IMAGES = {
  all: "/icons/all.png",
  clothing: "/icons/clothing.png",     // saree thumbnail
  fashion: "/icons/fashion.png",       // lehenga/dress thumbnail
  electronics: "/icons/electronics.png",
  accessories: "/icons/accessories.png",
  home: "/icons/home.png",
  health: "/icons/health.png",
  books: "/icons/books.png",
  gifts: "/icons/gifts.png",
  groceries: "/icons/groceries.png",
};

// Emoji fallback if an image is missing/failed
const CATEGORY_EMOJI = {
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

/** Generate descriptive details for a product */
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
      ? "Lehenga set includes skirt, choli/blouse, and dupatta; semi-stitched waist for easy alterations."
      : isSaree
      ? "Saree length ~5.5–6.2m; unstitched blouse piece included unless specified."
      : "Tailored silhouette with comfortable fit for most body types.";

    return {
      quality: "Inspected on fabric feel, stitch density and color fastness before dispatch.",
      materials: fabric,
      workmanship: work,
      fit: style,
      care: "Dry clean recommended for first wash; then gentle hand wash in cold water. Do not wring. Shade dry.",
      shipping: "Ships within 24–48 hours from order confirmation. Free shipping on prepaid orders.",
      returns: "7-day easy exchange for size/defects. Keep tags & packaging intact.",
      warranty: "Color fastness and seam integrity covered under 30-day store warranty.",
    };
  }

  if (cat === "electronics") {
    return {
      quality: "QC passed with multi-point testing for ports, buttons and battery health.",
      materials: "ABS/Aluminum chassis; RoHS compliant components.",
      workmanship: "Precision assembly with thermal checks for long-run stability.",
      fit: "Compact, well-balanced ergonomics suitable for extended use.",
      care: "Keep away from moisture. Use surge-protected chargers only.",
      shipping: "Dispatched in tamper-proof packaging with cushioning.",
      returns: "7-day DOA replacement; 1-year manufacturer warranty where applicable.",
      warranty: "Covers manufacturing defects. Physical/liquid damage not covered.",
    };
  }

  // Generic fallback
  return {
    quality: "Individually inspected before packing to ensure you receive the best.",
    materials: "High-grade materials selected for longevity.",
    workmanship: "Clean finishing and durable construction.",
    fit: "Designed for everyday comfort and ease of use.",
    care: "Wipe/hand wash gently. Keep away from direct heat.",
    shipping: "Ships within 1–2 business days in protective packaging.",
    returns: "7-day easy returns as per policy.",
    warranty: "Standard store warranty against manufacturing defects.",
  };
}

const Products = ({ user, cart, setCart, wishlist = [], reloadCart, reloadWishlist }) => {
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [showTabs, setShowTabs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // details panel
  const [selected, setSelected] = useState(null);

  // track failed icons so we can fall back to emoji
  const [badIcons, setBadIcons] = useState({});

  // resolve /public paths correctly even in subpaths
  const iconSrc = (key) => {
    const p = CATEGORY_IMAGES[key];
    if (!p) return null;
    if (/^https?:\/\//i.test(p)) return p;
    return `${process.env.PUBLIC_URL || ""}${p}`;
  };

  // ESC to close details
  const onKeyDown = useCallback((e) => {
    if (e.key === "Escape") setSelected(null);
  }, []);
  useEffect(() => {
    if (selected) {
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }
  }, [selected, onKeyDown]);

  // Fetch products
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

  // Build categories list dynamically from products
  const categories = useMemo(() => {
    const set = new Set(["all"]);
    for (const p of products) if (p.category) set.add(norm(p.category));
    return Array.from(set);
  }, [products]);

  // Filtered products
  const filtered = useMemo(() => {
    if (activeCategory === "all") return products;
    return products.filter((p) => norm(p.category) === activeCategory);
  }, [products, activeCategory]);

  // Backend ops
  async function fetchJson(url, options) {
    const res = await fetch(url, options);
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText}${txt ? " - " + txt : ""}`);
    }
    return res.json();
  }

  const addToCartBackend = async (product) => {
    if (!user) return alert("Please login");
    try {
      await fetchJson(`${API}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageurl:product.image, userId: user.id, productId: product.id, quantity: 1 }),
      });
      await reloadCart?.();
      // alert("Added to cart");
      toast.success("Added to Cart Successfully");
    } catch (err) {
      toast.error("Failed to add cart"+err.message);
      alert("Failed to add to cart: " + (err.message || err));
    }
  };

  const toggleWishlistBackend = async (product) => {
    if (!user) return alert("Please login");
    try {
      const exists = await fetchJson(`${API}/wishlist/exists/${user.id}/${product.id}`);
      if (exists) {
        const res = await fetch(`${API}/wishlist/${user.id}/${product.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Delete wishlist failed");
      } else {
        await fetchJson(`${API}/wishlist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, productId: product.id }),
        });
      }
      await reloadWishlist?.();
    } catch (err) {
      alert("Failed to update wishlist: " + (err.message || err));
    }
  };

  if (loading) return <div className="products-loading">Loading products…</div>;
  if (error) return <div className="products-error">{error}</div>;

  return (
    <div className="products-page">
      {/* Toolbar */}
      <div className="products-toolbar">
        <button className="btn btn-cats" onClick={() => setShowTabs((s) => !s)}>
          {showTabs ? "⠿ Hide Categories" : "⠿ Categories"}
        </button>
      </div>

      {/* Category tabs row */}
      {showTabs && (
        <div className="category-tabs">
          {categories.map((c) => {
            const src = iconSrc(c);
            const showImg = src && !badIcons[c];
            return (
              <button
                key={c}
                className={`cat-tab ${activeCategory === c ? "active" : ""}`}
                onClick={() => setActiveCategory(c)}
                title={CATEGORY_LABELS[c] || c}
              >
                {showImg ? (
                  <img
                    src={src}
                    alt=""
                    className="cat-img"
                    onError={() =>
                      setBadIcons((prev) => (prev[c] ? prev : { ...prev, [c]: true }))
                    }
                  />
                ) : (
                  <span className="cat-icon">{CATEGORY_EMOJI[c] || "📦"}</span>
                )}
                {CATEGORY_LABELS[c] || c}
              </button>
            );
          })}
          <button className="cat-tab suggest">+ Explore more</button>
        </div>
      )}

      {/* Products grid */}
      <div className="products-container">
        {filtered.map((p) => (
          <div key={p.id} className="product-card">
            <div
              className="product-img-wrapper"
              onClick={() => setSelected(p)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelected(p)}
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
                title="Add to wishlist"
              >
                <Heart
                  color={wishlist.some((w) => w.product && w.product.id === p.id) ? "red" : "gray"}
                  fill={wishlist.some((w) => w.product && w.product.id === p.id) ? "red" : "none"}
                />
              </button>
            </div>
            <h3 className="product-name">{p.name}</h3>
            <p className="price">₹{p.price}</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="add-btn" onClick={() => addToCartBackend(p)} style={{ flex: 1 }}>
                Add to Cart 1
              </button>
              <button
                className="add-btn"
                onClick={() => setSelected(p)}
                style={{
                  flex: 1,
                  background: "#fff",
                  color: "#111827",
                  border: "1px solid rgba(0,0,0,.12)",
                }}
              >
                View details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Details panel (lightweight modal) */}
      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${selected.name} details`}
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
                gap: 0,
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
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 18, lineHeight: 1.4 }}>{selected.name}</h3>
                  <button
                    onClick={() => setSelected(null)}
                    aria-label="Close details"
                    style={{
                      border: "1px solid rgba(0,0,0,.12)",
                      background: "#fff",
                      borderRadius: 10,
                      padding: "6px 10px",
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>₹{selected.price}</div>

                {(() => {
                  const d = buildDetails(selected);
                  return (
                    <div style={{ display: "grid", gap: 8 }}>
                      <DetailRow label="Quality" text={d.quality} />
                      <DetailRow label="Materials" text={d.materials} />
                      <DetailRow label="Workmanship" text={d.workmanship} />
                      {d.fit ? <DetailRow label="Fit / Style" text={d.fit} /> : null}
                      <DetailRow label="Care" text={d.care} />
                      <DetailRow label="Shipping" text={d.shipping} />
                      <DetailRow label="Returns" text={d.returns} />
                      <DetailRow label="Warranty" text={d.warranty} />
                    </div>
                  );
                })()}

                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button
                    className="add-btn"
                    onClick={() => addToCartBackend(selected)}
                    style={{ flex: 1 }}
                  >
                    Add to Cart 2
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

            {/* tiny footer strip for context */}
            <div
              style={{
                padding: "10px 16px",
                fontSize: 12,
                color: "#6b7280",
                borderTop: "1px solid rgba(0,0,0,.06)",
                background: "#fafafa",
              }}
            >
              Note: Descriptions are auto-generated from category & title; actual fabric/work may vary by batch.
            </div>
          </div>
        </div>
      )}
      <ToastContainer autoClose={800} />
    </div>
  );
};

function DetailRow({ label, text }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8 }}>
      <div style={{ color: "#6b7280", fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: 14, lineHeight: 1.45 }}>{text}</div>
    </div>
  );
}

export default Products;
