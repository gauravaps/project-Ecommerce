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
         message: "User's registration successfully Completed",
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





// Add new address to user
export const addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id); // login user
 
    if (req.body.isDefault) {
  user.addresses.forEach(addr => (addr.isDefault = false)); 
}


    if (user) {
      user.addresses.push(req.body); 
      await user.save();
      res.status(201).json({ message: "Address added successfully", addresses: user.addresses });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};





//Update Address API
export const updateAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      const address = user.addresses.id(req.params.addressId); // find by subdoc id

      if (address) {
        if (req.body.isDefault === true) {
          user.addresses.forEach(addr => {
            addr.isDefault = false;
          });
          address.isDefault = true;
        }

        // Update other fields if provided
        address.street = req.body.street || address.street;
        address.city = req.body.city || address.city;
        address.state = req.body.state || address.state;
        address.postalCode = req.body.postalCode || address.postalCode;
        address.country = req.body.country || address.country;

        await user.save();
        res.json({ message: "Address updated", addresses: user.addresses });
      } else {
        res.status(404).json({ message: "Address not found" });
      }
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};





// Get all addresses of logged-in user
export const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("addresses");

    if (user) {
      res.json({ addresses: user.addresses });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};





// Update logged-in user profile
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    //  Duplicate Email Check
    if (req.body.email && req.body.email !== user.email) {
      const emailExists = await User.findOne({ email: req.body.email });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = req.body.email;
    }

    // Duplicate Phone Check
    if (req.body.phone && req.body.phone !== user.phone) {
      const phoneExists = await User.findOne({ phone: req.body.phone });
      if (phoneExists) {
        return res.status(400).json({ message: "Phone number already in use" });
      }
      user.phone = req.body.phone;
    }

    //  Name Update
    if (req.body.name) {
      user.name = req.body.name;
    }

    //Password Update with Current Password Check
    if (req.body.currentPassword && req.body.newPassword) {
      const isMatch = await user.matchPassword(req.body.currentPassword);

      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      user.password = req.body.newPassword; 
    }

    const updatedUser = await user.save();

    res.json({
      message: "User profile updated successfully",
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      isAdmin: updatedUser.isAdmin,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
