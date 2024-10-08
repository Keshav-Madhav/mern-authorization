import express from "express";
import { login, logout, signup, verifyEmail, sendNewVerificationEmail } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", signup);

router.post("/login", login)

router.post("/logout", logout)

router.post("/verify-email", verifyEmail) 

router.post("/send-new-verfication", sendNewVerificationEmail)

export default router;