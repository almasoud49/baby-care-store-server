const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000','https://baby-cares-store.vercel.app/products'],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, 
  allowedHeaders: 'Content-Type, Authorization',
}));
app.use(express.json());


// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to Baby Care Store");

    const db = client.db("babyCare");
    const userCollection = db.collection("users");
    const productCollection = db.collection("products");
    const orderCollection = db.collection("orders");

    // User Registration
    app.post("/api/auth/register", async (req, res) => {
      const { name, email, password } = req.body;

      // Check if email already exists
      const existingUser = await userCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      await userCollection.insertOne({
        name,
        email,
        password: hashedPassword,
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    });

    // User Login
    app.post("/api/auth/login", async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await userCollection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const jwtPayload = {
        name: user.name,
        email: user.email,
        role: user.role || "user",
      };

      //   console.log(jwtPayload)

      // Generate JWT token
      const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
        expiresIn: process.env.EXPIRES_IN,
      });

      //   console.log(token)

      res.json({
        success: true,
        message: "Login successful",
        token,
      });
    });

    //Create Product
    app.post("/api/product", async (req, res) => {
      const result = await productCollection.insertOne(req.body);
      res.status(200).json({
        success: true,
        message: "Product created successfully!",
        data: result,
      });
    });

    //Get All Products
    app.get("/api/products", async (req, res) => {
      const result = await productCollection.find().toArray();
      res.status(200).json({
        success: true,
        message: "Products retrieved successfully!",
        data: result,
      });
    });

    //Get Single Product
    app.get("/api/product/:id", async (req, res) => {
      const { id } = req.params;
      const result = await productCollection.findOne({ _id: new ObjectId(id) });
      res.status(200).json({
        success: true,
        message: "Single product retrieved successfully!",
        data: result,
      });
    });

    //Order
    app.post("/api/order", async (req, res) => {
      const result = await orderCollection.insertOne(req.body);
      res.status(200).json({
        success: true,
        message: "Order created successfully!",
        data: result,
      });
    });

    app.get("/api/orders", async (req, res) => {
      const result = await orderCollection.find().toArray();
      res.status(200).json({
        success: true,
        message: "Orders retrieved successfully!",
        data: result,
      });
    });

    app.patch('/api/:orderId/status', async (req, res) => {
      const { orderId } = req.params;
      const { status } = req.body;

      const result = await orderCollection.updateOne(
        { _id: new ObjectId(orderId) },
        { $set: { status: status } }
      );

      res.status(200).json({
        success: true,
        message: 'Order status updated successfully',
        data: result,
      });
  
      
    });
    
    
    
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
