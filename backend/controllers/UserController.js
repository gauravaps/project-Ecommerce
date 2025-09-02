import User from "../models/userModel.js";

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
