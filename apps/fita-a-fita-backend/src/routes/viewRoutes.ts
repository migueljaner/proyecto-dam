import express from 'express';
import * as viewsController from '../controllers/viewsController';
import * as authController from '../controllers/authController';
import * as bookingController from '../controllers/bookingController';
const router = express.Router();

// 3) Routes
router.use(authController.isLoggedIn);
router.get('/me', authController.protect, viewsController.getAccount);
router.get(
  '/',
  bookingController.createBookingCheckout,
  viewsController.getOverview
);
router.get('/my-tours', authController.protect, viewsController.getMyTours);
router.get('/tour/:slug', authController.protect, viewsController.getTour);
router.get(
  '/my-bookings',
  authController.protect,
  viewsController.getMyBookings
);

router.get('/login', viewsController.getLoginForm);
router.get('/signup', viewsController.getSignupForm);

export default router;
