import express from "express";
import { registerUser } from "../controllers/UserController.js";
const router = express.Router();








//User route start here ...

//User's registration API
router.post('/registeruser' , registerUser);





export default router;