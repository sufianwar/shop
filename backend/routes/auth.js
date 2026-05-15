
import express from "express";
import { register, login, getProfile, getUsers, updateUser, deleteUser } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();
router.post("/register", register);
router.post("/login", login);
router.get("/profile", protect, getProfile);
router.get("/users", protect, authorize("admin"), getUsers);
router.put("/users/:id", protect, authorize("admin"), updateUser);
router.delete("/users/:id", protect, authorize("admin"), deleteUser);
export default router;
