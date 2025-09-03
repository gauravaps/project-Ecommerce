import express from "express";
import { addAddress, getAddresses, loginUser, logoutUser, registerUser, updateAddress, updateUserProfile } from "../controllers/UserController.js";
import { isAdmin, verifyToken } from "../middleware/authMiddleware.js";
import { deleteUser, updateUserByAdmin } from "../controllers/UserAdminController.js";
const router = express.Router();








//User route start here ...

//User's registration API
router.post('/registeruser' , registerUser);

// User's login API.
router.post('/loginuser' , loginUser);

//Logout user API.
router.post('/logoutuser' ,verifyToken, logoutUser)


// Add new address to user
router.post('/add_address' , verifyToken , addAddress);

//update user's address.
router.put("/address/:addressId", verifyToken, updateAddress);


// Get all addresses of logged-in user
router.get('/get_addresses' , verifyToken , getAddresses);


// update logged in user's profile
router.put('/update_self' , verifyToken , updateUserProfile);


// Delete normal user by admin
router.delete('/delete_user/:id', verifyToken , isAdmin , deleteUser)


//update normal user and admin user user by Admin..
router.put('/update_user_byadmin/:id' , verifyToken ,isAdmin , updateUserByAdmin);






export default router;