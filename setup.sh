#!/bin/bash
set -e

echo "🚀 Setting up Full E-commerce App (with Razorpay UPI)..."

# Ask for Razorpay Keys
read -p "Enter Razorpay Key ID: " RAZORPAY_KEY_ID
read -p "Enter Razorpay Key Secret: " RAZORPAY_KEY_SECRET

# Create folders
mkdir -p ecommerce-app/backend/src/main/java/com/ecommerce/{controller,model,repository,service}
mkdir -p ecommerce-app/backend/src/main/resources
mkdir -p ecommerce-app/frontend

##############################################
# Backend (Spring Boot)
##############################################
cat > ecommerce-app/backend/pom.xml << 'EOF'
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.ecommerce</groupId>
  <artifactId>backend</artifactId>
  <version>1.0.0</version>
  <properties>
    <java.version>17</java.version>
    <spring-boot.version>3.2.5</spring-boot.version>
  </properties>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
      <groupId>com.h2database</groupId>
      <artifactId>h2</artifactId>
      <scope>runtime</scope>
    </dependency>
    <dependency>
      <groupId>com.razorpay</groupId>
      <artifactId>razorpay-java</artifactId>
      <version>1.4.3</version>
    </dependency>
  </dependencies>
  <build>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
      </plugin>
    </plugins>
  </build>
</project>
EOF

# Main Application
cat > ecommerce-app/backend/src/main/java/com/ecommerce/EcommerceApplication.java << 'EOF'
package com.ecommerce;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class EcommerceApplication {
    public static void main(String[] args) {
        SpringApplication.run(EcommerceApplication.class, args);
    }
}
EOF

# User Model
cat > ecommerce-app/backend/src/main/java/com/ecommerce/model/User.java << 'EOF'
package com.ecommerce.model;

import jakarta.persistence.*;

@Entity
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String email;
    private String password;

    public User() {}
    public User(String name, String email, String password) {
        this.name = name; this.email = email; this.password = password;
    }
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setEmail(String email) { this.email = email; }
    public void setPassword(String password) { this.password = password; }
}
EOF

# Product Model
cat > ecommerce-app/backend/src/main/java/com/ecommerce/model/Product.java << 'EOF'
package com.ecommerce.model;

import jakarta.persistence.*;

@Entity
public class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String category;
    private double price;
    private int quantity;

    public Product() {}
    public Product(String name, String category, double price, int quantity) {
        this.name = name; this.category = category; this.price = price; this.quantity = quantity;
    }

    // getters/setters
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getCategory() { return category; }
    public double getPrice() { return price; }
    public int getQuantity() { return quantity; }
    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setCategory(String category) { this.category = category; }
    public void setPrice(double price) { this.price = price; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
}
EOF

# User Repo
cat > ecommerce-app/backend/src/main/java/com/ecommerce/repository/UserRepository.java << 'EOF'
package com.ecommerce.repository;

import com.ecommerce.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
}
EOF

# Product Repo
cat > ecommerce-app/backend/src/main/java/com/ecommerce/repository/ProductRepository.java << 'EOF'
package com.ecommerce.repository;

import com.ecommerce.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {}
EOF

# User Controller
cat > ecommerce-app/backend/src/main/java/com/ecommerce/controller/UserController.java << 'EOF'
package com.ecommerce.controller;

import com.ecommerce.model.User;
import com.ecommerce.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {
    private final UserRepository repo;
    public UserController(UserRepository repo) { this.repo = repo; }

    @PostMapping("/signup")
    public User signup(@RequestBody User user) {
        return repo.save(user);
    }

    @PostMapping("/login")
    public User login(@RequestBody User user) {
        Optional<User> found = repo.findByEmail(user.getEmail());
        return found.filter(u -> u.getPassword().equals(user.getPassword()))
                    .orElseThrow(() -> new RuntimeException("Invalid credentials"));
    }
}
EOF

# Product Controller
cat > ecommerce-app/backend/src/main/java/com/ecommerce/controller/ProductController.java << 'EOF'
package com.ecommerce.controller;

import com.ecommerce.model.Product;
import com.ecommerce.repository.ProductRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:3000")
public class ProductController {

    private final ProductRepository repo;

    public ProductController(ProductRepository repo) { this.repo = repo; }

    @GetMapping
    public List<Product> getAll() {
        return repo.findAll();
    }

    @PutMapping("/{id}/purchase")
    public Product purchase(@PathVariable Long id, @RequestParam int qty) {
        Product p = repo.findById(id).orElseThrow();
        if (p.getQuantity() < qty) throw new RuntimeException("Not enough stock!");
        p.setQuantity(p.getQuantity() - qty);
        return repo.save(p);
    }
}
EOF

# Payment Service
cat > ecommerce-app/backend/src/main/java/com/ecommerce/service/PaymentService.java << EOF
package com.ecommerce.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import org.json.JSONObject;
import org.springframework.stereotype.Service;

@Service
public class PaymentService {

    private final RazorpayClient client;

    public PaymentService() throws Exception {
        this.client = new RazorpayClient("${RAZORPAY_KEY_ID}", "${RAZORPAY_KEY_SECRET}");
    }

    public String createOrder(int amount) throws Exception {
        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", amount * 100); // paise
        orderRequest.put("currency", "INR");
        orderRequest.put("payment_capture", 1);

        Order order = client.Orders.create(orderRequest);
        return order.toString();
    }
}
EOF

# Payment Controller
cat > ecommerce-app/backend/src/main/java/com/ecommerce/controller/PaymentController.java << 'EOF'
package com.ecommerce.controller;

import com.ecommerce.service.PaymentService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "http://localhost:3000")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/create")
    public String createOrder(@RequestParam int amount) throws Exception {
        return paymentService.createOrder(amount);
    }
}
EOF

# application.yml
cat > ecommerce-app/backend/src/main/resources/application.yml << 'EOF'
spring:
  datasource:
    url: jdbc:h2:mem:ecommerce
    driverClassName: org.h2.Driver
    username: sa
    password:
  h2:
    console:
      enabled: true
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
EOF

# Preload Products
cat > ecommerce-app/backend/src/main/resources/data.sql << 'EOF'
INSERT INTO product (name, category, price, quantity) VALUES ('Rose Bouquet', 'Flowers', 499.0, 10);
INSERT INTO product (name, category, price, quantity) VALUES ('Gold Ring', 'Jewellery', 15000.0, 3);
INSERT INTO product (name, category, price, quantity) VALUES ('T-Shirt', 'Clothes', 799.0, 20);
EOF

##############################################
# Frontend (React)
##############################################
cd ecommerce-app/frontend
npx create-react-app . >/dev/null 2>&1

# Add Razorpay script to index.html
sed -i '' '/<\/body>/i\
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
' public/index.html || true

# Overwrite App.js
cat > src/App.js << EOF
import React, { useState } from "react";
import Products from "./Products";

function App() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [page, setPage] = useState("login");

  const api = "http://localhost:8080/api";

  const handleSignup = async () => {
    const res = await fetch(api + "/users/signup", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setUser(await res.json());
    setPage("products");
  };

  const handleLogin = async () => {
    const res = await fetch(api + "/users/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setUser(await res.json());
    setPage("products");
  };

  const handlePayment = async () => {
    const res = await fetch(api + "/payment/create?amount=100", { method: "POST" });
    const order = await res.json();

    const options = {
      key: "${RAZORPAY_KEY_ID}",
      amount: order.amount,
      currency: order.currency,
      name: "My E-commerce Store",
      description: "UPI Payment",
      order_id: order.id,
      handler: function (response) {
        alert("Payment successful! Payment ID: " + response.razorpay_payment_id);
      },
      prefill: { name: user.name, email: user.email, contact: "9999999999" },
      theme: { color: "#3399cc" }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div style={{ padding: 20 }}>
      {page === "login" && (
        <div>
          <h2>Login</h2>
          <input placeholder="Email" onChange={e=>setForm({...form,email:e.target.value})}/><br/>
          <input placeholder="Password" type="password" onChange={e=>setForm({...form,password:e.target.value})}/><br/>
          <button onClick={handleLogin}>Login</button>
          <p>or <span onClick={()=>setPage("signup")} style={{color:"blue",cursor:"pointer"}}>Signup</span></p>
        </div>
      )}
      {page === "signup" && (
        <div>
          <h2>Signup</h2>
          <input placeholder="Name" onChange={e=>setForm({...form,name:e.target.value})}/><br/>
          <input placeholder="Email" onChange={e=>setForm({...form,email:e.target.value})}/><br/>
          <input placeholder="Password" type="password" onChange={e=>setForm({...form,password:e.target.value})}/><br/>
          <button onClick={handleSignup}>Signup</button>
          <p>Already have an account? <span onClick={()=>setPage("login")} style={{color:"blue",cursor:"pointer"}}>Login</span></p>
        </div>
      )}
      {page === "products" && user && (
        <div>
          <h2>Welcome {user.name}</h2>
          <Products />
          <button onClick={handlePayment}>Checkout with UPI</button>
        </div>
      )}
    </div>
  );
}

export default App;
EOF

# Products.js
cat > src/Products.js << 'EOF'
import React, { useEffect, useState } from "react";

function Products() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8080/api/products")
      .then(res => res.json())
      .then(data => setProducts(data));
  }, []);

  const buy = async (id) => {
    const res = await fetch(\`http://localhost:8080/api/products/\${id}/purchase?qty=1\`, { method: "PUT" });
    if (res.ok) {
      alert("Purchased successfully!");
      const updated = await fetch("http://localhost:8080/api/products").then(r => r.json());
      setProducts(updated);
    } else {
      alert("Out of stock!");
    }
  };

  return (
    <div>
      <h2>Products</h2>
      {products.map(p => (
        <div key={p.id} style={{border:"1px solid #ddd", margin:"10px", padding:"10px"}}>
          <h3>{p.name} ({p.category})</h3>
          <p>₹{p.price}</p>
          {p.quantity === 0 && <p style={{color:"red"}}>Out of Stock</p>}
          {p.quantity > 0 && p.quantity < 5 && <p style={{color:"orange"}}>Only {p.quantity} left!</p>}
          {p.quantity >= 5 && <p>In Stock: {p.quantity}</p>}
          <button onClick={() => buy(p.id)} disabled={p.quantity === 0}>Buy</button>
        </div>
      ))}
    </div>
  );
}

export default Products;
EOF

echo "✅ E-commerce App setup complete!"
echo "➡ Backend: cd ecommerce-app/backend && mvn spring-boot:run"
echo "➡ Frontend: cd ecommerce-app/frontend && npm start"
