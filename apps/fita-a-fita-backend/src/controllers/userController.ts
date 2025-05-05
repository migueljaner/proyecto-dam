import { NextFunction, Request, Response } from 'express';
import User from '../models/userModel';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';
import * as factory from './handlerFactory';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import Booking from '../models/bookingModel';
import Tour from '../models/tourModel';

const multerStorage = multer.memoryStorage();

const multerFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image')) cb(null, true);
    else {
        cb(null, false);
        cb(new AppError('Not an image! Please upload only images.', 400));
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

const filterObj = (obj: any, ...allowedFields: string[]) => {
    const newObj: any = {};

    Object.keys(obj).forEach((el) => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });

    return newObj;
};

export const uploadUserPhoto = upload.single('photo');

export const resizeUserPhoto = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) return next();

    req.file.filename = `user-${req.user!.id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(path.join(__dirname, `../public/img/users/${req.file.filename}`));

    next();
});

export const getAllUsers = factory.getAll(User);
export const getUser = factory.getOne(User);
export const createUser = factory.createOne(User);
export const updateUser = factory.updateOne(User);
export const deleteUser = factory.deleteOne(User);

export const getMe = (req: Request, res: Response, next: NextFunction) => {
    req.params.id = req.user!.id;
    next();
};

export const updateMe = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('This route is not for password updates. Please use /updateMyPassword', 400));
    }

    // 2) Update user document
    const filteredBody = filterObj(req.body, 'name', 'email');
    if (req.file) filteredBody.photo = req.file.filename;

    const user = await User.findByIdAndUpdate(req.user!.id, filteredBody, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        status: 'success',
        data: {
            user: user,
        },
    });
});
export const deleteMe = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    await User.findByIdAndUpdate(req.user!.id, { active: false });

    res.status(204).json({
        status: 'succes',
        data: null,
    });
});

export const getUserBookings = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const bookings = await Booking.find({ user: req.params.id });

    res.status(200).json({
        status: 'success',
        results: bookings.length,
        data: {
            bookings,
        },
    });
});

export const getMyTours = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // 1) Find all bookings
    const bookings = await Booking.find({ user: req.user!.id });

    // 2) Find tours with the returned IDs
    const tourIDs = bookings.map((el) => el.tour);

    const tours = await Tour.find({ _id: { $in: tourIDs } });

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            tours,
        },
    });
});
