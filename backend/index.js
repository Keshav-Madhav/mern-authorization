import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./db/connectDB.js";

import authRoutes from "./routes/auth.router.js";

dotenv.config();
const app = express();
const port = process.env.PORT || 8080;

app.use(express.json()); // middleware to parse JSON data

app.use('/api/auth', authRoutes)

app.listen(port, () => {
  connectDB();
  console.log("Server is running on port", port);
});

