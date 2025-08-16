# VTRY - AI Virtual Try-On E-commerce Platform

## Overview
VTRY là một nền tảng e-commerce thời trang hiện đại với tính năng **Virtual Try-On sử dụng AI**, cho phép khách hàng "thử đồ" trước khi mua hàng.

## Tech Stack
- **Backend**: Node.js, Express.js, MongoDB
- **Frontend**: React.js, Ant Design
- **AI Service**: Fashn AI API
- **Payment**: PayOS, VNPay
- **Authentication**: JWT

## Project Structure
```
.
├── VTRY_BE/          # Backend API Server
└── VTRY_FE/          # Frontend (Customer + Admin Panel)
```

## Features

### Customer Features
- 🛍️ Browse products by categories (Men/Women/Kids)
- 🛒 Shopping cart & checkout
- 👗 **AI Virtual Try-On** - Upload ảnh để thử đồ
- 💳 Online payment (PayOS, VNPay)
- ⭐ Product reviews & ratings
- 📦 Order tracking

### Admin Features  
- ➕ Add/Edit/Delete products
- 📊 Product management
- 📋 Order management
- 🖼️ Image upload

## Setup Instructions

### Prerequisites
- Node.js
- MongoDB
- npm/yarn

### Backend Setup
```bash
cd VTRY_BE
npm install
cp .env.example .env  # Configure your environment variables
npm start  # Runs on http://localhost:4000
```

### Frontend Setup
```bash
cd VTRY_FE
npm install
cp .env.example .env  # Configure your environment variables
npm start  # Runs on http://localhost:3000
```

## Environment Variables

### Backend (.env)
```
MONGO_URI=your_mongodb_connection_string
ADMIN_EMAIL=admin@vtry.com
ADMIN_PASSWORD=admin123456
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=http://localhost:4000
REACT_APP_FRONTEND_URL=http://localhost:3000
```

## Admin Access
- Email: `admin@vtry.com`
- Password: `admin123456`
- Admin Panel: `http://localhost:3000/admin/addproduct`

## API Endpoints
- `GET /allproducts` - Get all products
- `POST /addproduct` - Add new product (Admin)
- `POST /tryon` - AI Virtual Try-On
- `POST /checkout` - Process payment
- `POST /login` - User authentication

## Virtual Try-On Workflow
1. Customer selects product
2. Uploads personal photo
3. AI processes and generates try-on result
4. Customer views result and decides to purchase

## Contributing
1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License
MIT License
