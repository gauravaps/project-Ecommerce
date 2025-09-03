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
