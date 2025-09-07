import React, { useState } from "react";
import "./Login.css";

const Login = ({ handleLogin, handleSignup }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const submit = () => {
    if (isLogin) handleLogin(email, password) || alert("Invalid credentials");
    else handleSignup(email, password, name) || alert("Fill all fields");
  };

  return (
    <div className="login">
      <div className="login-box">
        <h2>{isLogin ? "Login" : "Signup"}</h2>
        {!isLogin && <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />}
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={submit}>{isLogin ? "Login" : "Signup"}</button>
        <p className="toggle" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Don't have an account? Signup" : "Already have an account? Login"}
        </p>
      </div>
    </div>
  );
};

export default Login;
