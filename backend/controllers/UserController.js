import User from "../models/userModel.js";
import jwt from 'jsonwebtoken';


// Register User
export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, isAdmin ,password } = req.body;

    // check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const phoneExists = await User.findOne({ phone });
    if (phoneExists) {
      return res.status(400).json({ message: "User already exists with this phone number" });
    }

    // create new user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      isAdmin
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin:isAdmin || user.isAdmin,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};





// Login User
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // generate token
    const token = jwt.sign(
      { _id:user._id, isAdmin:user.isAdmin }, 
      process.env.JWT_SECRET,
      { expiresIn:"7d" } 
    );

    // send token in httpOnly cookie
    res.cookie("token", token, {
      httpOnly:true,          // prevent XSS attacks
      secure:process.env.NODE_ENV === "development", // cookie only over https in prod
      sameSite:"strict",      // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // response
    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};





// logout User..
export const logoutUser = (req, res) => {
  try {
    if (!req.cookies.token) {
      return res.status(400).json({ message: "No active session found" });
    }

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "development",
      sameSite: "strict",
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Logout failed", error: error.message });
  }
};
