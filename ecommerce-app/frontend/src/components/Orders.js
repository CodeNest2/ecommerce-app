import React, { useEffect, useMemo, useState } from "react";

const API = "http://localhost:8081/api";

const Orders = ({ orders: propOrders = [], user, setCurrentView }) => {
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
    return () => { cancelled = true; };
  }, [user]); // eslint-disable-line

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
    return () => { cancelled = true; };
  }, []);

  const parsePriceMajor = (val) => {
    if (val == null) return 0;
    if (typeof val === "number" && !Number.isNaN(val)) return val;
    const cleaned = String(val).replace(/[^\d.]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };
  const looksLikeMinorUnits = (n) => Number.isInteger(n) && n >= 1000;

  const normalized = useMemo(() => {
    return (orders || []).map((o) => {
      let items = [];
      try { items = JSON.parse(o.itemsJson || "[]"); } catch {}

      const joined = items.map((it) => {
        const pid = it.productId;
        const p = productsById[pid] || {};
        let unit = parsePriceMajor(it.price);
        if (!unit || unit === 0) unit = parsePriceMajor(p.price);
        if (looksLikeMinorUnits(unit)) unit = unit / 100;

        const qty = Number(it.quantity) || 0;
        return {
          ...it,
          name: p.name || `Product #${pid}`,
          image: p.image,
          unitPrice: unit,
          qty,
          subtotal: unit * qty,
        };
      });

      const computedTotal = joined.reduce((s, li) => s + li.subtotal, 0);
      const total = Number(o.total) || computedTotal;
      return { ...o, items: joined, total };
    });
  }, [orders, productsById]);

  const money = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n || 0);

  if (loading) return <div style={{ padding: 16 }}>Loading orders…</div>;
  if (!normalized.length) return <div style={{ padding: 16 }}>No orders yet.</div>;

  return (
    <div style={{ padding: 16 }}>
      <h2>My Orders</h2>
      {normalized.map((o) => (
        <div key={o.id} style={{
          border: "1px solid rgba(0,0,0,0.1)",
          borderRadius: 12,
          padding: 12,
          marginBottom: 14,
          background: "white"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 700 }}>Order #{o.id}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {o.createdAt ? new Date(o.createdAt).toLocaleString() : ""}
              </div>
            </div>
            <div style={{ fontWeight: 700 }}>{money(o.total)}</div>
          </div>

          {o.items.map((it, idx) => (
            <div key={idx} style={{
              display: "grid",
              gridTemplateColumns: "56px 1fr auto auto",
              gap: 12,
              alignItems: "center",
              padding: "8px 0",
              borderTop: idx === 0 ? "1px solid rgba(0,0,0,0.06)" : "none"
            }}>
              <div>
                {it.image ? (
                  <img src={it.image} alt={it.name} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8 }} />
                ) : (
                  <div style={{ width: 56, height: 56, background: "#eee", borderRadius: 8 }} />
                )}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{it.name}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Qty: {it.qty}</div>
              </div>
              <div style={{ textAlign: "right", fontSize: 14 }}>{money(it.unitPrice)}</div>
              <div style={{ textAlign: "right", fontWeight: 700 }}>{money(it.subtotal)}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Orders;
