const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Custom Google DNS to fix ECONNREFUSED error

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Razorpay = require('razorpay');
require('dotenv').config();

const crypto = require('crypto');

const Product = require('./models/Product');
const authRoutes = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json());

// Razorpay Instance Setup
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// MongoDB Database Connection
app.use('/api/auth', authRoutes);

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected Successfully!'))
    .catch(err => console.error('❌ Connection Error:', err));

// Route 1: Get All Products
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Route 2: Add New Product
app.post('/api/products', async (req, res) => {
    try {
        const { name, price, image } = req.body;
        const newProduct = new Product({ name, price, image });
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Route 3: Delete Product by ID
app.delete('/api/products/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🟢 Real Razorpay Payment Route (Duplicate Route Fixed)
app.post('/api/payment/razorpay', async (req, res) => {
    try {
        const { amount } = req.body;
        
        // Rupees ko paise me convert karna (* 100)
        const amt = Math.max(Math.round(Number(amount || 100) * 100), 100);

        const options = {
            amount: amt,
            currency: 'INR',
            receipt: 'receipt_' + Date.now()
        };

        const order = await razorpay.orders.create(options);
        console.log("✅ Order Created Successfully ID:", order.id);
        res.status(200).json(order);
    } catch (error) {
        console.error("❌ Backend Razorpay Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Order Schema (Database Structure)
const orderSchema = new mongoose.Schema({
    userEmail: { type: String, required: true },
    customerName: String,
    phone: String,
    address: String,
    items: Array,
    totalAmount: Number,
    status: { type: String, default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// Create New Order Route
app.post('/api/orders', async (req, res) => {
    try {
        const { userEmail, customerName, phone, address, items, totalAmount } = req.body;
        
        const newOrder = new Order({
            userEmail, customerName, phone, address, items, totalAmount
        });

        await newOrder.save();
        res.status(201).json({ message: 'Order placed successfully!', order: newOrder });
    } catch (error) {
        res.status(500).json({ error: 'Failed to place order' });
    }
});

// Get Orders for Logged-in User
app.get('/api/orders/:email', async (req, res) => {
    try {
        const userOrders = await Order.find({ userEmail: req.params.email }).sort({ createdAt: -1 });
        res.json(userOrders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Verify Payment Route
app.post('/api/payment/verify', (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'fbGouFUFRbgfPTUyvMPy8Jiu')
        .update(body.toString())
        .digest('hex');

    if (expectedSignature === razorpay_signature) {
        res.json({ success: true, message: "Payment Verified Successfully" });
    } else {
        res.status(400).json({ success: false, message: "Invalid Signature" });
    }
});

// Server Start (Code ke sabse aakhri mein)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

const path = require('path');

// Ek step bahar (root) waale files serve karne ke liye '..' use karein
app.use(express.static(path.join(__dirname, '..')));

// Root folder se index.html serve karein
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});