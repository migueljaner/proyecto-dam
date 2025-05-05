import { NextFunction, Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';
import APIFeatures from '../utils/apiFeatures';

export const deleteOne = (Model: any) => {
    return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const doc = await Model.findByIdAndDelete(req.params.id);

        if (!doc) {
            return next(new AppError('No document found with that ID', 404));
        }

        res.status(204).json({
            status: 'success',
            data: null,
        });
    });
};

export const updateOne = (Model: any) => {
    return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const updatedDoc = await Model.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!updatedDoc) {
            return next(new AppError('No document found with that ID', 404));
        }

        res.status(200).json({
            status: 'succes',
            data: {
                data: updatedDoc,
            },
        });
    });
};

export const createOne = (Model: any) => {
    return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const newDoc = await Model.create(req.body);

        res.status(201).json({
            status: 'succes',
            data: {
                data: newDoc,
            },
        });
    });
};

export const getOne = (Model: any, popOptions?: any) => {
    return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        let query = Model.findById(req.params.id);
        if (popOptions) query = query.populate(popOptions);

        const doc = await query;

        if (!doc) {
            return next(new AppError('No document found with that ID', 404));
        }

        res.status(200).json({
            status: 'succes',
            data: {
                data: doc,
            },
        });
    });
};

export const getAll = (Model: any) => {
    return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        // To allow for nested GET reviews on tour (hack)
        let filter: any = {};
        if (req.params.tourId) filter = { tour: req.params.tourId };

        const features = new APIFeatures(Model.find(filter), req.query).filter().sort().limitFields().paginate();

        // const docs = await features.query.explain();
        const docs = await features.query;

        // SEND RESPONSE
        res.status(200).json({
            status: 'succes',
            results: docs.length,
            data: {
                data: docs,
            },
        });
    });
};
