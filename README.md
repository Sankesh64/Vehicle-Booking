# Vehicle Booking Platform - Backend

A production-grade, enterprise-level backend architecture for a premium full-stack Vehicle Booking Platform (Cars, Bikes, Rentals, Driver Booking).

## 🚀 Features

*   **Secure Authentication**: JWT + Refresh Tokens + Session Management.
*   **Driver Onboarding**: Full KYC flow with document tracking and vehicle management.
*   **Real-time Tracking**: Socket.io integration for live location updates.
*   **Booking System**: Dynamic fare estimation based on distance, time, and vehicle category.
*   **Payments**: Integrated with Razorpay.
*   **Security**: Helmet, Rate Limiting, Mongo Sanitization, and validated environment variables.
*   **Monitoring**: Sentry integration for real-time error tracking.
*   **Architecture**: Layered architecture (Controllers, Services, Repositories, Models).

## 🛠 Tech Stack

*   **Node.js & Express.js**: Fast and minimal web framework.
*   **TypeScript**: Type safety and better developer experience.
*   **MongoDB & Mongoose**: Flexible NoSQL database with schema modeling.
*   **Socket.io**: Real-time bidirectional communication.
*   **Zod**: Runtime schema validation.
*   **Winston**: Advanced logging system.
*   **Docker**: Containerized deployment.

## 🏁 Getting Started

### Prerequisites

*   Node.js >= 18
*   MongoDB Atlas account
*   Docker (optional)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/Sankesh64/Vehicle-Booking.git
    cd Vehicle-Booking
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure environment variables:
    *   Rename `.env.example` to `.env`.
    *   Fill in your MongoDB URI, JWT Secrets, and other keys.

4.  Run in development mode:
    ```bash
    npm run dev
    ```

5.  Build for production:
    ```bash
    npm run build
    npm start
    ```

## 🐳 Docker Deployment

```bash
docker build -t vehicle-booking-api .
docker run -p 5000:5000 --env-file .env vehicle-booking-api
```

## 📡 API Endpoints

*   **Auth**: `/api/v1/auth`
*   **Bookings**: `/api/v1/bookings`
*   **Drivers**: `/api/v1/drivers`
*   **Payments**: `/api/v1/payments`
*   **Health**: `/health`

## 📄 License

ISC
