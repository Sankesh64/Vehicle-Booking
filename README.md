# 🚗 VeloRide — Intelligent Vehicle Booking Platform

> **Book Smarter. Travel Faster.**

VeloRide is a full-stack, production-grade vehicle booking platform built with a modern, scalable architecture. It combines real-time tracking, secure authentication, video KYC, and a multi-role ecosystem (Users, Drivers, Admins) into a single seamless experience.

This project is not just a CRUD app — it is designed to reflect real-world mobility systems like Uber, Ola, and enterprise SaaS platforms.

---

# ✨ Key Highlights

* ⚡ **Real-Time Ride Tracking** using Socket.io
* 📹 **Driver Video KYC System** powered by ZEGOCLOUD
* 🔐 **Secure Authentication System** (JWT + Refresh Tokens + Session Management)
* 💳 **Integrated Payment System** using Razorpay
* 🚘 **Complete Booking Lifecycle** (Search → Book → Track → Complete → Pay)
* 🧠 **AI-Ready Architecture** for future intelligent ride suggestions
* 🧩 **Multi-Role System** (User + Driver + Admin)
* 🎨 **Premium UI/UX** with smooth animations (Framer Motion)

---

# 🛠️ Tech Stack

### Frontend

* Next.js
* TypeScript
* Framer Motion
* TailwindCSS

### Backend

* Node.js + Express.js
* MongoDB + Mongoose
* Socket.io
* Zod (Validation)
* JWT + Refresh Token System
* Winston + Sentry

### Integrations

* Razorpay (Payments)
* ZEGOCLOUD (Video KYC)

---

# 🏗️ System Architecture

VeloRide follows a **clean, modular backend architecture**:

```
controllers → services → repositories → database
```

With:

* Centralized error handling
* Strict validation layer
* Role-based access control (RBAC)
* Secure API standards
* Scalable real-time communication layer

---

# 🚀 Core Features

## 👤 User System

* Register / Login / Logout
* Session management
* Booking history
* Wallet system
* Profile management

## 🚖 Booking Engine

* Fare estimation
* Vehicle selection
* Driver assignment
* Ride lifecycle management
* Cancellation & refunds

## 🚗 Driver System

* Driver onboarding
* Vehicle registration
* Availability toggle
* Earnings dashboard
* KYC verification

## 📡 Real-Time System

* Live driver tracking
* Booking status updates
* Notifications
* ETA updates

## 💳 Payments

* Razorpay order creation
* Payment verification
* Refund system
* Wallet settlements

---

# 🔒 Security First

This project is built with **production-grade security practices**:

* Helmet (secure headers)
* Rate limiting
* JWT authentication with rotation
* Refresh token hashing
* MongoDB injection prevention
* Zod validation on every request
* Role-based access control
* Ownership validation (no IDOR)
* Secure cookies (HttpOnly, SameSite)

---

# ⚠️ Current Known Issues

Every real project has flaws. Here are the ones currently identified:

### 1. API Contract Mismatches

* Some frontend fields do not align with backend validation
* Example: `vehicleType` vs `vehicleCategory`

### 2. Payment Method Mapping

* Frontend uses `"razorpay"`
* Backend expects `"online"`

### 3. ZEGOCLOUD Secret Format Issue

* Requires exactly **32-character string**
* Incorrect formatting causes KYC failures

### 4. Authentication Middleware Gaps

* Certain routes assume `req.user` without enforcing authentication

### 5. Deployment Sync Delays

* Render redeploy delays can cause stale backend behavior
* Vercel caching may serve outdated frontend builds

### 6. Third-Party API Response Handling

* Geocoding response structure mismatch caused location failures

---

# 🧠 Future Roadmap

VeloRide is designed to evolve into a **smart mobility platform**.

### 🚀 Upcoming Features

* 🤖 AI-based ride recommendations
* 📊 Admin analytics dashboard (real-time insights)
* 🧾 Invoice & billing system
* 📱 Push notifications (Web + Mobile)
* 🧍 Driver rating & reputation system
* 🚦 Smart surge pricing engine
* 🌍 Multi-city / geo-scaling support
* 🧠 Demand prediction using ML models
* 💼 Corporate fleet management system

---

# 🌐 Deployment

Backend:

* Dockerized production build
* Deployable on Render / AWS / DigitalOcean

Frontend:

* Vercel optimized

Database:

* MongoDB Atlas

---

# 🧪 Testing

* End-to-end flow testing (Auth, Booking, Payment)
* API validation testing
* Manual + automated test support

---

# 🤝 Contributing

This project is actively evolving.

If you're someone who:

* enjoys solving real backend challenges
* understands scalable systems
* or just wants to fix something that's slightly broken

👉 **You're welcome to contribute.**

There are real issues here that need thoughtful solutions, not surface-level fixes.

---

# 💡 Final Note

VeloRide is not just a project.

It’s a foundation for building:

* scalable systems
* production-ready architectures
* and real-world engineering intuition

If you’re reading this, you’re already ahead of most people who stop at tutorials.

---

**Build seriously. Ship carefully. Improve relentlessly.**
