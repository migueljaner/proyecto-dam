import { NextFunction, Request, Response } from 'express';
import Review from '../models/reviewModel';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';
import * as factory from './handlerFactory';

export const getAllReviews = factory.getAll(Review);
export const getReview = factory.getOne(Review);
export const createReview = factory.createOne(Review);
export const updateReview = factory.updateOne(Review);
export const deleteReview = factory.deleteOne(Review);

export const setTourUserIds = (req: Request, res: Response, next: NextFunction) => {
    if (!req.body.tour) req.body.tour = req.params.tourId;

    if (!req.body.user) req.body.user = req.user._id;

    if (!req.body.tour || !req.body.user)
        return next(new AppError('You cannot add a review if you do not provide a tour', 400));

    next();
};

export const getReviewByTour = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const reviews = await Review.find({ tour: req.params.tourId });

    res.status(200).json({
        status: 'success',
        results: reviews.length,
        data: {
            reviews,
        },
    });
});
