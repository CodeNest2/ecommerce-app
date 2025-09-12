# 🛍️ Luxestore E-Commerce Application

Full-stack E-Commerce web application with:
- **Spring Boot (Java 17)** backend  
- **React + Tailwind** frontend  
- Features: User Login/Signup, Products, Cart, Wishlist, Orders, Razorpay UPI Payment  

---

## ⚙️ Prerequisites

Make sure these are installed:

- **Java 17+**  
  ```bash
  java -version

## Maven 3.8
mvn -v

## NodeJs 1.8 + & npm
node -v
npm -v

## Back end 

cd ecommerce-app/backend

# mvn clean package
java -jar target/backend-1.0.0.jar

mvn clean spring-boot:run 

Server will run in
http://localhost:8081

## Front End
cd ecommerce-app/frontend

## Install Dependencies
npm install

## Start Development Server
npm start

#Open APP 
http://localhost:3000

POST MAN Collection

```
/api/users/signup


{
  "name": "Test User",
  "email": "test@example.com",
  "password": "test123",
  "address": "Mumbai",
  "phone": "9999999999"
}
```


