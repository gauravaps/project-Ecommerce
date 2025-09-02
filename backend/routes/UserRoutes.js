import express from "express";
import { loginUser, registerUser } from "../controllers/UserController.js";
const router = express.Router();








//User route start here ...

//User's registration API
router.post('/registeruser' , registerUser);

// User's login API.
router.post('/loginuser' , loginUser);





export default router;