import express, { Request, Response } from "express";

import * as authController from "../controllers/authController";
import * as bookingController from "../controllers/bookingController";
import app from "../app";

const router = express.Router();

router.use(authController.protect);

router.get(
  "/checkout-session/:tourId",
  authController.protect,
  bookingController.getCheckoutSession,
);

router.use(authController.restrictTo("admin", "lead-guide"));

router
  .route("/")
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route("/:id")
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

export default router;
