require('dotenv').config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const connectDB = require("./config/db");
const port = process.env.PORT || 4000;
const fs = require("fs");
const axios = require("axios");
const PayOS = require("@payos/node");

const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID || "43ffdb06-2c1b-4505-a98c-09cc884ceda7";
const PAYOS_API_KEY = process.env.PAYOS_API_KEY || "8af121b7-33c7-4ae7-a506-4328c5ed2615";
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || "a0b6474b439f8f20a1906e3b6647e98b1c63312674ce98c4628bd591f6c1f68f";

// Tạo instance PayOS
const payOS = new PayOS(
  PAYOS_CLIENT_ID,
  PAYOS_API_KEY,
  PAYOS_CHECKSUM_KEY
);
const PAYOS_CONFIG = {
  RETURN_URL: process.env.PAYOS_RETURN_URL || `${process.env.FRONTEND_URL || "http://localhost:3000"}/membership`,
  CANCEL_URL: process.env.PAYOS_CANCEL_URL || `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment-failed`,
  WEBHOOK_URL: process.env.PAYOS_WEBHOOK_URL || `${process.env.BACKEND_URL || "http://localhost:4000"}/api/payment/payos/webhook`
};


app.use(express.json());
app.use(cors());

connectDB();

// Ensure upload directory exists
const uploadDir = './upload/images';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created upload directory:', uploadDir);
}

// Image Storage Engine
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
  }
})
const upload = multer({ storage: storage })

// Route for Images folder
app.use('/images', express.static('upload/images'));


// MiddleWare to fetch user from token
const fetchuser = async (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    res.status(401).send({ errors: "Please authenticate using a valid token" });
  }
  try {
    const data = jwt.verify(token, "secret_ecom");
    req.user = data.user;
    next();
  } catch (error) {
    res.status(401).send({ errors: "Please authenticate using a valid token" });
  }
};

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    // Check if it's the admin from .env file
    if (req.user.id === 'admin' && req.user.role === 'admin') {
      return next();
    }
    
    // Check if it's a database user with admin role
    const user = await Users.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ errors: "Access denied. Admin privileges required." });
    }
    next();
  } catch (error) {
    res.status(500).json({ errors: "Server error" });
  }
};

// Middleware to check if user has admin or user role
const requireAuth = (roles = ['user', 'admin']) => {
  return async (req, res, next) => {
    try {
      const user = await Users.findById(req.user.id);
      if (!user || !roles.includes(user.role)) {
        return res.status(403).json({ errors: "Access denied. Insufficient privileges." });
      }
      req.userRole = user.role;
      next();
    } catch (error) {
      res.status(500).json({ errors: "Server error" });
    }
  };
};

// Upload endpoint for admin panel
app.post("/upload", fetchuser, requireAdmin, upload.single('product'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: 0,
        errors: "No file uploaded"
      });
    }
    
    res.json({
      success: 1,
      image_url: `/images/${req.file.filename}`
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: 0,
      errors: "Server error during file upload"
    });
  }
})


// Schema for creating user model
const Users = mongoose.model("Users", {
  name: { type: String },
  email: { type: String, unique: true },
  password: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  cartData: { type: Object },
  date: { type: Date, default: Date.now() },
});


// Schema for creating Product
const Product = mongoose.model("Product", {
  id: { type: Number, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  new_price: { type: Number },
  old_price: { type: Number },
  date: { type: Date, default: Date.now },
  avilable: { type: Boolean, default: true },
});

// Schema cho đơn hàng
const Order = mongoose.model("Order", {
  userId: { type: String, required: true },
  items: { type: Object, required: true },
  amount: { type: Number, required: true },
  address: { type: String, required: true },
  status: { type: String, default: "Processing" }, // Processing, Shipped, Completed, Cancelled, Paid
  isPaid: { type: Boolean, default: false }, // ✅ Đã thanh toán hay chưa
  orderCode: { type: String }, // Mã đơn hàng từ PayOS
  paymentInfo: {
    orderCode: { type: String },
    transactionId: { type: String },
    transactionDateTime: { type: String },
    paymentMethod: { type: String },
    amount: { type: Number }
  },
  paidAt: { type: Date }, // Thời gian thanh toán
  date: { type: Date, default: Date.now },
});

// Feedback model for product reviews
const Feedback = mongoose.model("Feedback", {
  userId: { type: String, required: true },
  productId: { type: Number, required: true },
  orderId: { type: String, required: true }, // Reference to the order
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  userName: { type: String, required: true }, // Store user name for display
  date: { type: Date, default: Date.now },
});


// ROOT API Route For Testing
app.get("/", (req, res) => {
  res.send("Root");
});


// Create an endpoint at ip/login for login the user and giving auth-token
app.post('/login', async (req, res) => {
  console.log("Login");
  let success = false;
  const { email, password } = req.body;
  
  // First check if it's an admin login
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    const data = {
      user: {
        id: 'admin',
        role: 'admin'
      }
    }
    success = true;
    const token = jwt.sign(data, 'secret_ecom');
    return res.json({ 
      success, 
      token, 
      user: { 
        id: 'admin', 
        role: 'admin', 
        name: 'Administrator', 
        email: process.env.ADMIN_EMAIL 
      } 
    });
  }
  
  // If not admin, check regular users in database
  let user = await Users.findOne({ email: email });
  if (user) {
    const passCompare = password === user.password;
    if (passCompare) {
      const data = {
        user: {
          id: user.id,
          role: user.role
        }
      }
      success = true;
      console.log(user.id);
      const token = jwt.sign(data, 'secret_ecom');
      res.json({ success, token, user: { id: user.id, role: user.role, name: user.name, email: user.email } });
    }
    else {
      return res.status(400).json({ success: success, errors: "please try with correct email/password" })
    }
  }
  else {
    return res.status(400).json({ success: success, errors: "please try with correct email/password" })
  }
})

// Admin login endpoint
app.post('/admin/login', async (req, res) => {
  console.log("Admin Login");
  let success = false;
  const { email, password } = req.body;
  
  // Check against admin credentials in .env
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    // Create a temporary admin user object for JWT
    const data = {
      user: {
        id: 'admin',
        role: 'admin'
      }
    }
    success = true;
    const token = jwt.sign(data, 'secret_ecom');
    res.json({ success, token, role: 'admin' });
  } else {
    return res.status(400).json({ success: success, errors: "Invalid admin credentials" })
  }
})


//Create an endpoint at ip/auth for regestring the user & sending auth-token
app.post('/signup', async (req, res) => {
  console.log("Sign Up");
  let success = false;
  let check = await Users.findOne({ email: req.body.email });
  if (check) {
    return res.status(400).json({ success: success, errors: "existing user found with this email" });
  }
  let cart = {};
  for (let i = 0; i < 300; i++) {
    cart[i] = 0;
  }
  const user = new Users({
    name: req.body.username,
    email: req.body.email,
    password: req.body.password,
    cartData: cart,
  });
  await user.save();
  const data = {
    user: {
      id: user.id
    }
  }

  const token = jwt.sign(data, 'secret_ecom');
  success = true;
  res.json({ success, token })
})


// endpoint for getting all products data
app.get("/allproducts", async (req, res) => {
  try {
    let products = await Product.find({});
    console.log("All Products");
    res.send(products);
  } catch (error) {
    console.error("Error fetching all products:", error);
    res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
});


// endpoint for getting latest products data
app.get("/newcollections", async (req, res) => {
  try {
    let products = await Product.find({});
    let arr = products.slice(0).slice(-8);
    console.log("New Collections");
    res.send(arr);
  } catch (error) {
    console.error("Error fetching new collections:", error);
    res.status(500).json({ success: false, message: "Failed to fetch new collections" });
  }
});


// endpoint for getting womens products data
app.get("/popularinwomen", async (req, res) => {
  try {
    let products = await Product.find({ category: "women" });
    let arr = products.splice(0, 4);
    console.log("Popular In Women");
    res.send(arr);
  } catch (error) {
    console.error("Error fetching popular women products:", error);
    res.status(500).json({ success: false, message: "Failed to fetch popular women products" });
  }
});

// endpoint for getting womens products data
app.post("/relatedproducts", async (req, res) => {
  try {
    console.log("Related Products");
    const { category } = req.body;
    const products = await Product.find({ category });
    const arr = products.slice(0, 4);
    res.send(arr);
  } catch (error) {
    console.error("Error fetching related products:", error);
    res.status(500).json({ success: false, message: "Failed to fetch related products" });
  }
});


// Create an endpoint for saving the product in cart
app.post('/addtocart', fetchuser, async (req, res) => {
  try {
    console.log("Add Cart");
    
    // Handle admin users who don't have cart data
    if (req.user.id === 'admin') {
      return res.send("Added");
    }
    
    let userData = await Users.findOne({ _id: req.user.id });
    userData.cartData[req.body.itemId] += 1;
    await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
    res.send("Added")
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ success: false, message: "Failed to add to cart" });
  }
})


// Create an endpoint for removing the product in cart
app.post('/removefromcart', fetchuser, async (req, res) => {
  try {
    console.log("Remove Cart");
    
    // Handle admin users who don't have cart data
    if (req.user.id === 'admin') {
      return res.send("Removed");
    }
    
    let userData = await Users.findOne({ _id: req.user.id });
    if (userData.cartData[req.body.itemId] != 0) {
      userData.cartData[req.body.itemId] -= 1;
    }
    await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
    res.send("Removed");
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ success: false, message: "Failed to remove from cart" });
  }
})


// Create an endpoint for getting cartdata of user
app.post('/getcart', fetchuser, async (req, res) => {
  try {
    console.log("Get Cart");
    
    // Handle admin users who don't have cart data
    if (req.user.id === 'admin') {
      return res.json({});
    }
    
    let userData = await Users.findOne({ _id: req.user.id });
    res.json(userData.cartData);
  } catch (error) {
    console.error("Error getting cart:", error);
    res.status(500).json({ success: false, message: "Failed to get cart data" });
  }
})

app.post("/checkout", fetchuser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { cartItems, amount, address } = req.body;

    // Handle admin users
    if (userId === 'admin') {
      return res.status(403).json({ success: false, message: "Admin users cannot make purchases" });
    }

    if (!cartItems || !amount || !address) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const newOrder = new Order({
      userId,
      items: cartItems,
      amount,
      address,
    });

    await newOrder.save();

    // Clear user cart (skip for admin users as they don't have carts)
    if (userId !== 'admin') {
      const emptyCart = {};
      for (let i = 0; i < 300; i++) emptyCart[i] = 0;
      await Users.findByIdAndUpdate(userId, { cartData: emptyCart });
    }

    res.json({ success: true, message: "Checkout successful", order: newOrder });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({ success: false, message: "Checkout failed" });
  }
});



// Create an endpoint for adding products using admin panel
app.post("/addproduct", fetchuser, requireAdmin, async (req, res) => {
  try {
    let products = await Product.find({});
    let id;
    if (products.length > 0) {
      let last_product_array = products.slice(-1);
      let last_product = last_product_array[0];
      id = last_product.id + 1;
    }
    else { id = 1; }
    const product = new Product({
      id: id,
      name: req.body.name,
      description: req.body.description,
      image: req.body.image,
      category: req.body.category,
      new_price: req.body.new_price,
      old_price: req.body.old_price,
    });
    await product.save();
    console.log("Saved");
    res.json({ success: true, name: req.body.name })
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ success: false, message: "Failed to add product" });
  }
});


// Create an endpoint for removing products using admin panel
app.post("/removeproduct", fetchuser, requireAdmin, async (req, res) => {
  try {
    await Product.findOneAndDelete({ id: req.body.id });
    console.log("Removed");
    res.json({ success: true, name: req.body.name })
  } catch (error) {
    console.error("Error removing product:", error);
    res.status(500).json({ success: false, message: "Failed to remove product" });
  }
});

// Feedback API endpoints

// Create feedback for a product
app.post("/feedback", fetchuser, async (req, res) => {
  try {
    const { productId, orderId, rating, comment } = req.body;
    const userId = req.user.id;
    
    // Handle admin users
    if (userId === 'admin') {
      return res.status(403).json({ success: false, message: "Admin users cannot submit feedback" });
    }
    
    // Get user info
    const user = await Users.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    // Verify that the user has purchased this product in this order
    const order = await Order.findOne({ _id: orderId, userId: userId, isPaid: true });
    if (!order) {
      return res.status(403).json({ success: false, message: "You can only review products from your paid orders" });
    }
    
    // Check if product exists in the order
    const productInOrder = Object.keys(order.items).includes(productId.toString());
    if (!productInOrder) {
      return res.status(403).json({ success: false, message: "Product not found in this order" });
    }
    
    // Check if feedback already exists
    const existingFeedback = await Feedback.findOne({ userId, productId, orderId });
    if (existingFeedback) {
      return res.status(400).json({ success: false, message: "You have already reviewed this product" });
    }
    
    const feedback = new Feedback({
      userId,
      productId,
      orderId,
      rating,
      comment,
      userName: user.name
    });
    
    await feedback.save();
    res.json({ success: true, message: "Feedback submitted successfully", feedback });
  } catch (error) {
    console.error("Feedback creation error:", error);
    res.status(500).json({ success: false, message: "Failed to submit feedback" });
  }
});

// Get feedback for a product
app.get("/feedback/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const feedback = await Feedback.find({ productId }).sort({ date: -1 });
    res.json({ success: true, feedback });
  } catch (error) {
    console.error("Get feedback error:", error);
    res.status(500).json({ success: false, message: "Failed to get feedback" });
  }
});

// Get user's feedback
app.get("/myfeedback", fetchuser, async (req, res) => {
  try {
    // Handle admin users
    if (req.user.id === 'admin') {
      return res.json({ success: true, feedback: [] });
    }
    
    const userId = req.user.id;
    const feedback = await Feedback.find({ userId }).sort({ date: -1 });
    res.json({ success: true, feedback });
  } catch (error) {
    console.error("Get user feedback error:", error);
    res.status(500).json({ success: false, message: "Failed to get user feedback" });
  }
});

// Update feedback
app.put("/feedback/:feedbackId", fetchuser, async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;
    
    // Handle admin users
    if (userId === 'admin') {
      return res.status(403).json({ success: false, message: "Admin users cannot update feedback" });
    }
    
    const feedback = await Feedback.findOne({ _id: feedbackId, userId });
    if (!feedback) {
      return res.status(404).json({ success: false, message: "Feedback not found or unauthorized" });
    }
    
    feedback.rating = rating;
    feedback.comment = comment;
    await feedback.save();
    
    res.json({ success: true, message: "Feedback updated successfully", feedback });
  } catch (error) {
    console.error("Update feedback error:", error);
    res.status(500).json({ success: false, message: "Failed to update feedback" });
  }
});

// Delete feedback
app.delete("/feedback/:feedbackId", fetchuser, async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const userId = req.user.id;
    
    // Handle admin users
    if (userId === 'admin') {
      return res.status(403).json({ success: false, message: "Admin users cannot delete feedback" });
    }
    
    const feedback = await Feedback.findOneAndDelete({ _id: feedbackId, userId });
    if (!feedback) {
      return res.status(404).json({ success: false, message: "Feedback not found or unauthorized" });
    }
    
    res.json({ success: true, message: "Feedback deleted successfully" });
  } catch (error) {
    console.error("Delete feedback error:", error);
    res.status(500).json({ success: false, message: "Failed to delete feedback" });
  }
});

// Health check endpoint for Docker
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development"
  });
});

// Starting Express Server
app.listen(port, (error) => {
  if (!error) console.log("Server Running on port " + port);
  else console.log("Error : ", error);
});

const tryonUpload = multer({ storage: storage }).fields([
  { name: 'model', maxCount: 1 },
  { name: 'garment', maxCount: 1 }
]);

//VTRY
app.post("/tryon", tryonUpload, async (req, res) => {
  try {
    const modelImgPath = req.files['model'][0].path;
    const garmentImgPath = req.files['garment'][0].path;

    const modelImg = fs.readFileSync(modelImgPath, { encoding: 'base64' });
    const garmentImg = fs.readFileSync(garmentImgPath, { encoding: 'base64' });

    // Gửi yêu cầu tới Fashn
    const response = await axios.post(
      "https://api.fashn.ai/v1/run",
      {
        model_image: `data:image/jpeg;base64,${modelImg}`,
        garment_image: `data:image/jpeg;base64,${garmentImg}`,
        category: "tops"
      },
      {
        headers: {
          "Authorization": "Bearer fa-ub9WoHK6E1ui-9a8gUlk1cYzGQo1SCRnaqGEF",
          "Content-Type": "application/json"
        }
      }
    );

    const jobId = response.data.id;

    // Chờ 4s rồi truy vấn kết quả
    setTimeout(async () => {
      try {
        const result = await axios.get(`https://api.fashn.ai/v1/status/${jobId}`, {
          headers: {
            "Authorization": "Bearer fa-ub9WoHK6E1ui-9a8gUlk1cYzGQo1SCRnaqGEF"
          }
        });

        if (result.data.status === "completed") {
          res.json({
            success: true,
            outputUrl: result.data.output[0]
          });
        } else {
          res.json({
            success: false,
            message: "Try-on processing not completed yet"
          });
        }
      } catch (error) {
        console.error("Error checking try-on status:", error);
        res.status(500).json({
          success: false,
          message: "Failed to check try-on status"
        });
      }
    }, 4000);

  } catch (error) {
    console.error("Try-on error:", error.message);
    res.status(500).json({ error: "Something went wrong in try-on" });
  }
});

app.post("/checkout", fetchuser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { cartItems, amount, address } = req.body;

    if (!cartItems || !amount || !address) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    // Filter out items with zero quantity to clean up data
    const filteredCartItems = {};
    for (const [itemId, quantity] of Object.entries(cartItems)) {
      if (quantity > 0) {
        filteredCartItems[itemId] = quantity;
      }
    }
    
    // Validate that there are items to process
    if (Object.keys(filteredCartItems).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items in cart with quantity greater than 0'
      });
    }

    // For direct checkout (cash on delivery or immediate payment)
    const newOrder = new Order({
      userId,
      items: filteredCartItems,
      amount,
      address,
      isPaid: true, // ✅ Thanh toán thành công
      status: "Processing",
      paymentInfo: {
        paymentMethod: "Cash on Delivery",
        amount: amount
      },
      paidAt: new Date()
    });

    await newOrder.save();

    // Clear cart
    const emptyCart = {};
    for (let i = 0; i < 300; i++) emptyCart[i] = 0;
    await Users.findByIdAndUpdate(userId, { cartData: emptyCart });

    res.json({ success: true, message: "Checkout successful", order: newOrder });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({ success: false, message: "Checkout failed" });
  }
});

// Lấy toàn bộ đơn hàng đã thanh toán
app.get("/paid-products", fetchuser, async (req, res) => {
  try {
    const orders = await Order.find({ isPaid: true });

    const products = orders.flatMap(order =>
      Object.entries(order.items).map(([productId, productData]) => ({
        productId,
        ...productData,
        orderId: order._id,
        userId: order.userId
      }))
    );

    res.json({ success: true, products });
  } catch (error) {
    console.error("Get paid products error:", error);
    res.status(500).json({ success: false, message: "Cannot fetch products" });
  }
});

// 1️⃣ Tạo link thanh toán Payos
app.post("/payos/create-payment-url", fetchuser, async (req, res) => {
  try {
    const { amount, cartItems, address, orderInfo } = req.body;
    
    // Handle admin users
    if (req.user.id === 'admin') {
      return res.status(403).json({ success: false, message: "Admin users cannot make purchases" });
    }
    
    if (!amount || !cartItems || !address) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: amount, cartItems, address'
      });
    }
    
    // Filter out items with zero quantity to clean up data
    const filteredCartItems = {};
    for (const [itemId, quantity] of Object.entries(cartItems)) {
      if (quantity > 0) {
        filteredCartItems[itemId] = quantity;
      }
    }
    
    // Validate that there are items to process
    if (Object.keys(filteredCartItems).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items in cart with quantity greater than 0'
      });
    }
    
    // Generate a smaller orderCode that fits PayOS constraints (max 9007199254740991)
    const orderCode = Math.floor(Date.now() / 1000); // Use seconds instead of milliseconds
    
    // Get buyer name from user data or request body
    const buyerName = req.user.name || req.body.buyerName || 'N/A';
    
    // Create pending order in database with filtered items
    const newOrder = new Order({
      userId: req.user.id,
      items: filteredCartItems,
      amount: amount ,
      address: address,
      orderCode: orderCode.toString(), // Store as string in database
      status: "Pending Payment",
      isPaid: false
    });
    
    await newOrder.save();
    
    const orderData = {
            orderCode: orderCode, // Already a number from Math.floor()
            amount: amount * 300,
            description: `${orderInfo ? orderInfo.toString().trim().slice(0, 25) : `Order ${orderCode}`}`,
            returnUrl: PAYOS_CONFIG.RETURN_URL,
            cancelUrl: PAYOS_CONFIG.CANCEL_URL,
            buyerName: buyerName,
            buyerEmail: req.user.email,
            buyerPhone: req.user.phone || 'N/A'
        };
        
    const paymentLinkData = await payOS.createPaymentLink(orderData);

    res.json({
            success: true,
            data: {
                orderCode: orderCode,
                orderId: newOrder._id,
                paymentLink: paymentLinkData,
                checkoutUrl: paymentLinkData.checkoutUrl
            },
            message: 'Payment link created successfully'
        });
  } catch (err) {
    console.error("PayOS Create URL error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


app.post("/payos/confirm/:orderCode", fetchuser, async (req, res) => {
  try {
        const { orderCode } = req.params;
        
        const paymentInfo = await payOS.getPaymentLinkInformation(orderCode);

        if(paymentInfo != null && paymentInfo.status == "PAID"){
            // Find order by orderCode and update MongoDB
            const order = await Order.findOne({ 
                $or: [
                    { orderCode: orderCode }, // If orderCode is stored as a field
                    { 'paymentInfo.orderCode': orderCode } // If stored in paymentInfo
                ]
            });
            
            if(order && !order.isPaid) {
                // Update order status and payment info
                const updatedOrder = await Order.findByIdAndUpdate(
                    order._id,
                    {
                        isPaid: true,
                        status: "Paid",
                        paymentInfo: {
                            orderCode: orderCode,
                            transactionId: paymentInfo.transactions[0]?.transactionId,
                            transactionDateTime: paymentInfo.transactions[0]?.transactionDateTime,
                            paymentMethod: "PayOS",
                            amount: paymentInfo.amount
                        },
                        paidAt: new Date()
                    },
                    { new: true }
                );
                
                // Clear user's cart after successful payment
                 const emptyCart = {};
                 for (let i = 0; i < 300; i++) emptyCart[i] = 0;
                 await Users.findByIdAndUpdate(order.userId, { cartData: emptyCart });
                 
                 console.log(`Order ${order._id} payment confirmed successfully`);
                 
                 res.json({
                     success: true,
                     data: {
                         paymentInfo: paymentInfo,
                         order: updatedOrder
                     },
                     message: 'Payment confirmed and order updated successfully'
                 });
            } else if(order && order.isPaid) {
                res.json({
                    success: true,
                    data: paymentInfo,
                    message: 'Payment already confirmed'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }
        } else {
            res.json({
                success: false,
                data: paymentInfo,
                message: 'Payment not completed yet'
            });
        }
    } catch (error) {
        console.error('Error checking PayOS payment status:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking payment status',
            error: error.message
        });
    }
});

// 2️⃣ Truy vấn giao dịch (QueryDR)
app.post("/vnpay/querydr", async (req, res) => {
  try {
    const { txnRef, transactionNo, transactionDate } = req.body;

    const date = vnpay.utils.dateFormat(vnpay.utils.getDateInGMT7(new Date()));

    const result = await vnpay.queryDr({
      vnp_RequestId: `${txnRef}-${Date.now()}`,
      vnp_IpAddr: req.ip,
      vnp_TxnRef: txnRef,
      vnp_TransactionNo: transactionNo,
      vnp_OrderInfo: "Query payment result",
      vnp_TransactionDate: transactionDate, // format yyyyMMddHHmmss
      vnp_CreateDate: date
    });

    res.json({ success: result.isSuccess, data: result });
  } catch (err) {
    console.error("VNPAY QueryDR error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3️⃣ Hoàn tiền (Refund)
app.post("/vnpay/refund", async (req, res) => {
  try {
    const { txnRef, amount, transactionDate, createBy } = req.body;

    const refundDate = vnpay.utils.dateFormat(vnpay.utils.getDateInGMT7(new Date()));

    const result = await vnpay.refund({
      vnp_Amount: amount * 100,
      vnp_CreateBy: createBy || "admin",
      vnp_CreateDate: refundDate,
      vnp_IpAddr: req.ip,
      vnp_OrderInfo: `Refund for ${txnRef}`,
      vnp_RequestId: `${txnRef}-refund-${Date.now()}`,
      vnp_TransactionDate: transactionDate,
      vnp_TransactionType: vnpay.enums.VnpTransactionType.FULL_REFUND,
      vnp_TxnRef: txnRef,
      vnp_Locale: vnpay.enums.VnpLocale.VN
    });

    res.json({ success: true, data: result });
  } catch (err) {
    console.error("VNPAY Refund error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});



