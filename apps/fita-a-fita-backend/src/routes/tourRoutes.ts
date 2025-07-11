import express from "express";
import * as tourController from "../controllers/tourController";
import * as authController from "../controllers/authController";
import reviewRouter from "./reviewRoutes";

const router = express.Router();

router
  .route("/top-5-tours")
  .get(tourController.aliasTopTours, tourController.getAllTours);
router.route("/tour-stats").get(tourController.getTourStats);
router
  .route("/monthly-plan/:year")
  .get(
    authController.protect,
    authController.restrictTo("admin", "lead-guide", "guide"),
    tourController.getMonthlyPlan,
  );

router
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(tourController.getToursWithin);

router.route("/distances/:latlng/unit/:unit").get(tourController.getDistances);

router
  .route("/")
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo("admin", "guide"),
    tourController.createTour,
  );

router
  .route("/:id")
  .get(tourController.getTour)
  //All from here are protected routes
  .all(authController.protect, authController.restrictTo("admin", "lead-guide"))
  .patch(
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour,
  )
  .delete(tourController.deleteTour);

router.use("/:tourId/reviews", reviewRouter);
export default router;
