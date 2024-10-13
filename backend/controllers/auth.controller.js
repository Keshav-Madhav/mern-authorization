import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { User } from "../models/user.model.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { sendPasswordResetEmail, sendVerificationEmail, sendWelcomeEmail, sentResetSuccessEmail } from "../mailtrap/emails.js";

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
    return res.status(500).json({success: false, message: `Internal server error: ${error}`});
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
    return res.status(500).json({success: false, message: `Internal server error: ${error}`});
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
    return res.status(500).json({success: false, message: `Internal server error: ${error}`});
  }
}

export const login = async (req, res) => { 
  const  {email, password} = req.body;

  try {
    if (!email || !password) return res.status(400).json({success: false, message: "Please fill in all fields"});

    const user = await User.findOne({email});
    if (!user) return res.status(400).json({success: false, message: "Email not found"})

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) return res.status(400).json({success: false, message: "Invalid credentials"});

    if (!user.isVerified) return res.status(400).json({success: false, message: "Email not verified. Cannot Login."});

    generateTokenAndSetCookie(res, user._id);

    user.lastLogin = Date.now();
    await user.save();

    return res.status(200).json({
      success: true, 
      message: "Logged in successfully",
      user: {
        ...user._doc,
        password: undefined
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({success: false, message: `Internal server error: ${error}`});
  }
}

export const logout = async (req, res) => {
  res.clearCookie("tokenJWT");
  res.status(200).json({success: true, message: "Logged out successfully"});
}

export const forgotPassword = async (req, res) => {
  const {email} = req.body;

  try {
    const user = await User.findOne({email});
    if (!user) return res.status(400).json({success: false, message: "User not found"});

    if(!user.isVerified) return res.status(400).json({success: false, message: "User is not verified"});

    const uniqueToken = crypto.randomBytes(20).toString('hex');
    const tokenExpiration = Date.now() + 1000 * 60 * 60;
    user.resetPassToken = uniqueToken;
    user.resetPassExpires = tokenExpiration;
    await user.save();

    const clientURL = process.env.CLIENT_URL;
    if (!clientURL) return res.status(500).json({success: false, message: "Client URL not found"});
    const resetURL = `${clientURL}/reset-password/${uniqueToken}`;

    await sendPasswordResetEmail(user.email, resetURL);

    return res.status(200).json({success: true, message: "Password reset email sent successfully"});
  } catch (error) {
    console.error(error);
    return res.status(500).json({success: false, message: `Internal server error: ${error}`});
  }
}

export const resetPassword = async (req, res) => {
  try {
    const {token} = req.params;
    const {password} = req.body;

    if (!password) return res.status(400).json({success: false, message: "Please fill in all fields"});
    
    const user = await User.findOne({
      resetPassToken: token,
      resetPassExpires: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({success: false, message: "Invalid or expired token"});

    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({success: false, message: "Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character"});
    }

    const hashedPass = await bcryptjs.hash(password, 10);
    user.password = hashedPass;
    user.resetPassToken = undefined;
    user.resetPassExpires = undefined;
    await user.save();

    await sentResetSuccessEmail(user.email);

    return res.status(200).json({success: true, message: "Password reset successfully"});
  } catch (error) {
    console.error(error);
    return res.status(500).json({success: false, message: `Internal server error: ${error}`});
  }
}

export const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(400).json({success: false, message: "User not found"});

    return res.status(200).json({
      success: true, 
      message: "User authenticated", 
      user:{
        ...user._doc,
        password: undefined
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({success: false, message: `Internal server error: ${error}`});
  }
}