import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import "./Checkout.css";

const Checkout = ({ user, cart, setCurrentView }) => {
  const stripe = useStripe();
  const elements = useElements();

  const [step, setStep] = useState(1); // Step 1: amount, Step 2: card
  const [amount, setAmount] = useState(cart.reduce((sum, item) => sum + item.price * item.quantity, 0));
  const [message, setMessage] = useState("");

  // Step 1: Confirm amount
  const handleAmountSubmit = (e) => {
    e.preventDefault();
    if (amount <= 0) {
      setMessage("Amount must be greater than 0");
      return;
    }
    setMessage("");
    setStep(2);
  };

  // Step 2: Handle Stripe payment
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const res = await fetch("http://localhost:8081/api/payment/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amount * 100 }), // Stripe expects amount in cents
    });

    const { clientSecret } = await res.json();

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          name: user?.name || "Guest",
          email: user?.email || "test@example.com",
        },
      },
    });

    if (result.error) {
      setMessage(result.error.message);
    } else if (result.paymentIntent.status === "succeeded") {
      setMessage("✅ Payment successful! Your order has been placed.");
      setCurrentView("orders");
    }
  };

  return (
    <div className="checkout-container">
      {step === 1 && (
        <form onSubmit={handleAmountSubmit}>
          <h2>Enter Amount</h2>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="amount-input"
          />
          <button type="submit">Next</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handlePaymentSubmit}>
          <h2>Enter Card Details</h2>
          <CardElement className="card-element" />
          <button type="submit" disabled={!stripe}>Pay {amount}</button>
        </form>
      )}

      <p>{message}</p>
    </div>
  );
};

export default Checkout;
