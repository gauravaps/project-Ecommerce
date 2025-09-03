import User from "../models/userModel.js";













// Delete normal user by admin
export const deleteUser = async (req, res) => {
  try {
    // Only admin can delete
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized as admin" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent admin deleting other admins
    if (user.isAdmin) {
      return res.status(403).json({ message: "Cannot delete another admin" });
    }

    await user.deleteOne();

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};





// Update user by Admin (can change isAdmin too)
export const updateUserByAdmin = async (req, res) => {
  try {
    // Only admin can update
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized as admin" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If user is normal → allow name, email, phone update
    if (!user.isAdmin) {
      // Duplicate Email check
      if (req.body.email && req.body.email !== user.email) {
        const emailExists = await User.findOne({ email: req.body.email });
        if (emailExists) {
          return res.status(400).json({ message: "Email already in use" });
        }
        user.email = req.body.email;
      }

      // Duplicate Phone check
      if (req.body.phone && req.body.phone !== user.phone) {
        const phoneExists = await User.findOne({ phone: req.body.phone });
        if (phoneExists) {
          return res.status(400).json({ message: "Phone number already in use" });
        }
        user.phone = req.body.phone;
      }

      // Update name if provided
      user.name = req.body.name || user.name;
    }

    // Admin can update isAdmin flag for anyone (normal → admin, admin → normal)
    if (req.body.isAdmin !== undefined) {
      user.isAdmin = req.body.isAdmin;
    }

    const updatedUser = await user.save();

    res.json({
      message: "User updated successfully",
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

