import bcryptjs from "bcryptjs";
import { User } from "../models/user.model.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndsetCookie.js";
import { sendVerificationEmail, sendWelcomeEmail } from "../mailtrap/emails.js";

export const signup = async (req, res) => {
  const {email, password, name} = req.body;

  try {
    if(!email || !password || !name) {
      return res.status(400).json({success: false, message: "Please fill in all fields"});
    }

    const userExists = await User.findOne({email});
    if (userExists) {
      return res.status(400).json({success: false, message: "User already exists"});
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({success: false, message: "Invalid email"});
    }

    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({success: false, message: "Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character"});
    } 

    const hashedPass = await bcryptjs.hash(password, 10);
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

    const user = new User({
      email,
      password: hashedPass,
      name,
      verificationToken: verificationToken,
      verificationTokenExpires: Date.now() + 1000 * 60 * 60 * 24
    })

    await user.save();

    generateTokenAndSetCookie(res, user._id);

    await sendVerificationEmail(user.email, verificationToken);

    return res.status(201).json({success: true, message: "User created successfully"});
  } catch (error) {
    return res.status(500).json({success: false, message: error});
  }
}

export const verifyEmail = async (req, res) => {
  const {verificationToken, email} = req.body; 

  try {
    const user = await User.findOne({
      email,
      verificationToken,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if(!user) {
      return res.status(400).json({success: false, message: "Invalid or expired verification token"});
    } 

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined; 
    await user.save()

    await sendWelcomeEmail(user.email, user.name)

    return res.status(200).json({success: true, message: "Email verified successfully"});
  } catch (error) {
    console.error(error);
    return res.status(500).json({success: false, message: error});
  }
}

export const sendNewVerificationEmail = async (req, res) => {
  const {email} = req.body;

  try {
    const user = await User.findOne({email});
    if (!user) return res.status(400).json({success: false, message: "User not found"});
    if (user.isVerified) return res.status(400).json({success: false, message: "User is already verified"});

    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = Date.now() + 1000 * 60 * 60 * 24;
    await user.save();

    await sendVerificationEmail(user.email, verificationToken);

    return res.status(200).json({success: true, message: "Verification email sent successfully"});
  } catch (error) {
    console.error(error);
    return res.status(500).json({success: false, message: error});
  }
}

export const login = async (req, res) => { 
  res.send("Login");
}

export const logout = async (req, res) => {
  res.send("Logout");
}