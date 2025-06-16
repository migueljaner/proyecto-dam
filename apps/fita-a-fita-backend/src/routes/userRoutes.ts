import express from "express";
import * as userController from "../controllers/userController";
import * as authController from "../controllers/authController";
import multer from "multer";

const router = express.Router();

const upload = multer();

router.post("/signup", upload.none(), authController.signup);
router.post("/login", authController.login);
// router.get('/logout', authController.logout);
router.get("/confirmEmail/:token", authController.confirmEmail);
router.post("/forgotPassword", authController.forgotPassword);
router.post("/resetPassword/:token", authController.resetPassword);

// Protect all routes after this middleware
router.use(authController.protect);
router.patch("/updateMyPassword", authController.updatePassword);

router.get("/me", userController.getMe, userController.getUser);
router.patch(
  "/updateMe",
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe,
);
router.delete("/deleteMe", userController.deleteMe);

router.get("/my-tours", userController.getMyTours);

// Restrict all routes after this middleware to admin only
router.use(authController.restrictTo("admin", "guide"));
router.route("/:id/bookings").get(userController.getUserBookings);
router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

export default router;
