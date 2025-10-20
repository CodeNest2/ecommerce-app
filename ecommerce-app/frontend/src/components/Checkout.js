import React, { useEffect, useMemo, useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import "./Checkout.css";

const API = "http://localhost:8081/api";

const Checkout = ({ user, cart = [], setCurrentView, reloadCart, reloadOrders }) => {
  const stripe = useStripe();
  const elements = useElements();

  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [productsById, setProductsById] = useState({}); // catalog fallback for price/name

  // ---------- Robust price parsing ----------
  const parsePriceMajor = (val) => {
    if (val == null) return 0;
    if (typeof val === "number" && !Number.isNaN(val)) return val;
    const cleaned = String(val).replace(/[^\d.]/g, ""); // keep digits & dot
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };
  const looksLikeMinorUnits = (n) => Number.isInteger(n) && n >= 1000; // e.g., 129900 paise

  const getUnitPrice = (it) => {
    if (it?.product?.price != null) return parsePriceMajor(it.product.price);
    if (it?.price != null) {
      let v = parsePriceMajor(it.price);
      if (looksLikeMinorUnits(v)) v = v / 100;
      return v;
    }
    const altKeys = ["unitPrice", "unit_price", "amount", "amountMajor", "amountPaise", "unit_amount"];
    for (const k of altKeys) {
      if (it?.[k] != null) {
        let v = parsePriceMajor(it[k]);
        if (k.toLowerCase().includes("paise") || looksLikeMinorUnits(v)) v = v / 100;
        return v;
      }
    }
    const pid = it?.product?.id ?? it?.productId ?? it?.id;
    if (pid && productsById[pid]?.price != null) return parsePriceMajor(productsById[pid].price);
    return 0;
  };

  // ---------- Fetch products only if some cart item lacks price ----------
  useEffect(() => {
    const items = Array.isArray(cart) ? cart : Object.values(cart || {});
    const needs = items.some((i) => i?.product?.price == null && i?.price == null);
    if (!needs) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/products`);
        const list = res.ok ? await res.json() : [];
        if (cancelled) return;
        const map = {};
        for (const p of list) map[p.id] = p;
        setProductsById(map);
      } catch (e) {
        console.error("Products fetch failed:", e);
        setProductsById({});
      }
    })();
    return () => { cancelled = true; };
  }, [cart]);

  // ---------- Amount + summary ----------
  const amount = useMemo(() => {
    const items = Array.isArray(cart) ? cart : Object.values(cart || {});
    const sum = items.reduce((s, it) => s + getUnitPrice(it) * (Number(it?.quantity) || 0), 0);
    return Number.isFinite(sum) ? sum : 0;
  }, [cart, productsById]);

  const lineItems = useMemo(() => {
    const items = Array.isArray(cart) ? cart : Object.values(cart || {});
    return items.map((i) => {
      const unit = getUnitPrice(i);
      const qty = Number(i?.quantity) || 0;
      const pid = i?.product?.id ?? i?.productId ?? i?.id;
      const name =
        i?.product?.name ??
        (pid && productsById[pid]?.name) ??
        `Product #${pid ?? ""}`;
      const image =
        i?.product?.image ??
        (pid && productsById[pid]?.image) ??
        null;
      return { name, image, qty, price: unit, subtotal: unit * qty, pid };
    });
  }, [cart, productsById]);

  const formatINR = (n) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n || 0);

  // ---------- Step 1 ----------
  const handleAmountSubmit = (e) => {
    e.preventDefault();
    if (amount <= 0) {
      setMessage("Amount must be greater than 0");
      return;
    }
    setMessage("");
    setStep(2);
  };

  // ---------- Step 2: Pay + create order + clear cart + refresh ----------
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (!user) { setMessage("Please login to continue."); return; }

    try {
      // 1) Create PI
      const res = await fetch(`${API}/payment/create-payment-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Math.round(amount * 100) }), // paise
      });
      const { clientSecret } = await res.json();
      if (!clientSecret) throw new Error("Missing clientSecret");

      // 2) Confirm
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: user?.name || "Guest",
            email: user?.email || "test@example.com",
          },
        },
      });

      if (result.error) { setMessage(result.error.message || "Payment failed."); return; }
      if (result.paymentIntent?.status !== "succeeded") {
        setMessage("Payment status: " + (result.paymentIntent?.status || "unknown"));
        return;
      }

      // 3) Build order payload
      const itemsPayload = (Array.isArray(cart) ? cart : Object.values(cart || {})).map((i) => ({
        productId: i.product?.id || i.productId,
        quantity: i.quantity,
        price: getUnitPrice(i),
      }));
      const total = itemsPayload.reduce((s, it) => s + it.price * it.quantity, 0);

      // 4) Create order
      await fetch(`${API}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          total,
          itemsJson: JSON.stringify(itemsPayload),
          paymentIntentId: result.paymentIntent.id,
        }),
      });

      // 5) Clear cart server-side
      for (const ci of (Array.isArray(cart) ? cart : [])) {
        const pid = ci.productId ?? ci.product?.id;
        if (pid) {
          try { await fetch(`${API}/cart/${user.id}/${pid}`, { method: "DELETE" }); } catch {}
        }
      }

      // 6) Refresh UI and go to Orders
      if (typeof reloadCart === "function") await reloadCart();
      if (typeof reloadOrders === "function") await reloadOrders();

      setMessage("✅ Payment successful! Your order has been placed.");
      setCurrentView("orders");
    } catch (err) {
      console.error(err);
      setMessage("Payment failed. Please try again.");
    }
  };

  const handleClosePopup = () => {
    setMessage("");
    setCurrentView("orders");
  };

  // ---------- Visual-only card preview (never reads real PAN/CVV) ----------
  const [cardName, setCardName] = useState(user?.name || "");
  const [cardExpiry, setCardExpiry] = useState("MM/YY");
  const [cardFlipped, setCardFlipped] = useState(false);
  const maskedNumber = "•••• •••• •••• 4242";
  const maskedCVV = "•••";

  return (
    <div className="checkout-container">
      {/* Card Preview */}
      <div className="card-preview" onClick={() => setCardFlipped((f) => !f)} title="Click to flip">
        <div className={`card-inner ${cardFlipped ? "flipped" : ""}`}>
          <div className="card-face card-front">
            <div className="row-top"><div className="chip" /><div className="brand">VISA</div></div>
            <div className="card-number">{maskedNumber}</div>
            <div className="row-bottom">
              <div><span className="cardholder">CARDHOLDER</span><div className="name">{cardName || "FULL NAME"}</div></div>
              <div><span className="expiry-label">EXPIRES</span><div className="expiry">{cardExpiry}</div></div>
            </div>
          </div>
          <div className="card-face card-back">
            <div className="magnetic" />
            <div className="signature-row"><div className="signature" /><div className="cvv-box"><div className="cvv-label">CVV</div><div className="cvv">{maskedCVV}</div></div></div>
            <div className="foot">Stripe Secure</div>
          </div>
        </div>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <form onSubmit={handleAmountSubmit}>
          <h2>Confirm Amount</h2>

          {lineItems.length > 0 && (
            <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 12, marginBottom: 8 }}>
              {lineItems.map((li, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center', opacity: 0.95 }}>
                    {li.image && <img src={li.image} alt="" width={28} height={28} style={{ borderRadius: 6, objectFit:'cover' }} />}
                    {li.name} × {li.qty}
                  </div>
                  <div>{formatINR(li.subtotal)}</div>
                </div>
              ))}
              <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "8px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                <div>Total</div>
                <div>{formatINR(amount)}</div>
              </div>
            </div>
          )}

          <input type="number" min="1" value={Number.isFinite(amount) ? amount : 0} readOnly className="amount-input" />
          <button type="submit">Next</button>
        </form>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <form onSubmit={handlePaymentSubmit}>
          <h2>Enter Card Details</h2>
          <label>
            <div className="label">Cardholder name</div>
            <input type="text" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Full name" className="amount-input" />
          </label>
          <label>
            <div className="label">Expiry (MM/YY)</div>
            <input type="text" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="MM/YY" className="amount-input" />
          </label>
          <CardElement className="card-element" />
          <button type="submit" disabled={!stripe}>Pay {formatINR(amount)}</button>
        </form>
      )}

      {/* Popup */}
      {message && (
        <div className={`popup ${message.includes("Payment successful") ? "success" : "error"}`}>
          <div className="modal">
            <p>{message}</p>
            <div className="actions">
              {message.includes("Payment successful") ? (
                <button className="modal-action" onClick={handleClosePopup}>Go to Orders</button>
              ) : (
                <button className="btn-secondary" onClick={() => setMessage("")}>Close</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
