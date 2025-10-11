import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "./Login.css";

/*
 Props:
  - handleLogin(email, password) => Promise<boolean>
  - handleSignup(email, password, name, address, phone) => Promise<boolean>
  - initialAuthView: "login" | "signup" (optional)
*/
const Login = ({ handleLogin, handleSignup, initialAuthView = "login" }) => {
  const [isLogin, setIsLogin] = useState(initialAuthView === "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  // Sync with parent-supplied initial view (so App can force the login tab)
  useEffect(() => {
    setIsLogin(initialAuthView !== "signup");
  }, [initialAuthView]);

  // handle submit (form)
  const submit = async (e) => {
    e.preventDefault();

    if (isLogin) {
      if (!email || !password) {
        toast.error("Please enter email and password", { position: "top-center" });
        return;
      }
      const ok = await handleLogin(email.trim(), password);
      if (!ok) {
        toast.error("Invalid credentials", { position: "top-center" });
      }
    } else {
      // signup
      if (!name || !email || !password) {
        toast.error("Please fill name, email and password", { position: "top-center" });
        return;
      }
      const ok = await handleSignup(email.trim(), password, name.trim(), address.trim(), phone.trim());
      if (!ok) {
        toast.error("Signup failed", { position: "top-center" });
      } else {
        // switch to login tab after successful signup
        setIsLogin(true);
        // clear signup fields (keep email so user can login)
        setPassword("");
        setName("");
        setAddress("");
        setPhone("");
        toast.info("Please login with your new account", { position: "top-center", autoClose: 1800 });
      }
    }
  };

  return (
    <div className="login">
      <div className="login-box">
        <h2>{isLogin ? "Login" : "Signup"}</h2>

        <form onSubmit={submit}>
          {!isLogin && (
            <>
              <input
                placeholder="Full Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                placeholder="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <input
                placeholder="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </>
          )}

          <input
            placeholder="Email *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />

          <input
            type="password"
            placeholder="Password *"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">{isLogin ? "Login" : "Signup"}</button>
        </form>

        <p
          className="toggle"
          onClick={() => {
            setIsLogin(!isLogin);
          }}
          style={{ cursor: "pointer" }}
        >
          {isLogin ? "Don't have an account? Signup" : "Already have an account? Login"}
        </p>
      </div>
    </div>
  );
};

export default Login;
