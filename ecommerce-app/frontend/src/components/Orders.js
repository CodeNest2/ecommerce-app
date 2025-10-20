import React, { useEffect, useMemo, useState } from "react";
import "./Orders.css";

const API = "http://localhost:8081/api";

const Orders = ({ orders: propOrders = [], user, setCurrentView, dark = false }) => {
  const [orders, setOrders] = useState(Array.isArray(propOrders) ? propOrders : []);
  const [productsById, setProductsById] = useState({});
  const [loading, setLoading] = useState(false);

  // keep in sync with prop
  useEffect(() => {
    setOrders(Array.isArray(propOrders) ? propOrders : []);
  }, [propOrders]);

  // self-fetch if parent didn't pass and user exists
  useEffect(() => {
    if (!user) return;
    if (orders && orders.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/orders/${user.id}`);
        const data = res.ok ? await res.json() : [];
        if (!cancelled) setOrders(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // get product catalog once for join
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/products`);
        const list = res.ok ? await res.json() : [];
        if (cancelled) return;
        const map = {};
        for (const p of list) map[p.id] = p;
        setProductsById(map);
      } catch {
        setProductsById({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- utils ----
  const parsePriceMajor = (val) => {
    if (val == null) return 0;
    if (typeof val === "number" && !Number.isNaN(val)) return val;
    const cleaned = String(val).replace(/[^\d.]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };
  const looksLikeMinorUnits = (n) => Number.isInteger(n) && n >= 1000;

  const money = (n) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(n || 0);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "";

  const badgeKind = (status = "") => {
    const s = String(status).toLowerCase();
    if (s.includes("paid") || s.includes("delivered") || s.includes("completed")) return "paid";
    if (s.includes("pending") || s.includes("processing") || s.includes("in progress")) return "pending";
    if (s.includes("failed") || s.includes("canceled") || s.includes("cancelled")) return "failed";
    return "";
  };

  // ---- normalize orders structure to match UI ----
  const normalized = useMemo(() => {
    return (orders || []).map((o) => {
      let items = [];
      try {
        // Backend may send an items array or json string
        if (Array.isArray(o.items)) items = o.items;
        else items = JSON.parse(o.itemsJson || o.items || "[]");
      } catch {
        items = [];
      }

      const joined = items.map((it, idx) => {
        const pid = it.productId ?? it.id ?? it.product_id;
        const p = (pid && productsById[pid]) || {};

        let unit = parsePriceMajor(it.price ?? it.unitPrice ?? p.price);
        if (looksLikeMinorUnits(unit)) unit = unit / 100; // convert paise->₹

        const qty = Number(it.quantity ?? it.qty ?? 1) || 1;
        const image = it.image || p.image || p.imageUrl || "";

        return {
          key: `${pid ?? idx}-${qty}`,
          title: it.name || it.title || p.name || `Product #${pid ?? idx}`,
          image,
          qty,
          unitPrice: unit,
          subtotal: unit * qty,
        };
      });

      const computedTotal = joined.reduce((s, li) => s + li.subtotal, 0);
      const total = Number(o.total) || parsePriceMajor(o.amount) || computedTotal;

      return {
        id: o.id ?? o.orderId ?? o.reference,
        date: o.createdAt ?? o.created_at ?? o.date,
        status: o.status ?? o.paymentStatus ?? "",
        items: joined,
        total,
      };
    });
  }, [orders, productsById]);

  // ---- UI ----
  if (loading) {
    return (
      <div className={`orders${dark ? " dark" : ""}`}>
        <h2>Your Orders</h2>
        <div className="subhead">Fetching latest orders…</div>
        <div className="orders-empty">Loading…</div>
      </div>
    );
  }

  if (!normalized.length) {
    return (
      <div className={`orders${dark ? " dark" : ""}`}>
        <h2>Your Orders</h2>
        <div className="orders-empty">
          Looks quiet here. When you place an order, it will appear in this timeline.
        </div>
      </div>
    );
  }

  return (
    <div className={`orders${dark ? " dark" : ""}`}>
      <h2>Your Orders</h2>
      <div className="subhead">
        <span>
          {normalized.length} order{normalized.length > 1 ? "s" : ""}
        </span>
      </div>

      {normalized.map((o) => (
        <article className="order-card" key={o.id}>
          <header className="order-header">
            <div className="order-meta">
              <div className="order-id">Order #{o.id}</div>
              <div className="order-date">{formatDate(o.date)}</div>
              <div className="order-status">
                <span className={`badge ${badgeKind(o.status)}`}>{o.status || ""}</span>
                <span>• {o.items.length} item{o.items.length > 1 ? "s" : ""}</span>
              </div>
            </div>
            <div className="order-total">{money(o.total)}</div>
          </header>

          <div className="order-items">
            {o.items.map((it) => (
              <div className="order-item" key={it.key}>
                <div className="item-thumb">
                  {it.image ? (
                    <img src={it.image} alt={it.title} onError={(e) => (e.currentTarget.style.display = "none")} />
                  ) : null}
                </div>
                <div className="item-name">
                  <div className="item-title">{it.title}</div>
                  <div className="item-qty">Qty: {it.qty}</div>
                </div>
                <div className="item-price">{money(it.unitPrice)}</div>
                <div className="item-subtotal">{money(it.subtotal)}</div>
              </div>
            ))}
          </div>

          <footer className="order-summary">
            <span className="label">Grand total</span>
            <span className="value">{money(o.total)}</span>
          </footer>
        </article>
      ))}
    </div>
  );
};

export default Orders;