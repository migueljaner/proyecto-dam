import express from 'express';
import * as reviewController from '../controllers/reviewController';
import * as authController from '../controllers/authController';

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
    .route('/')
    .get(reviewController.getAllReviews)
    .post(authController.restrictTo('user'), reviewController.setTourUserIds, reviewController.createReview);

router
    .route('/:reviewId')
    .get(reviewController.getReview)
    .all(authController.restrictTo('user', 'admin'))
    .patch(reviewController.updateReview)
    .delete(reviewController.deleteReview);

export default router;
