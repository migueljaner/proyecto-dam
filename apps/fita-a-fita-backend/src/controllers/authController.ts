import jwt, { SignOptions } from "jsonwebtoken";
import User from "../models/userModel";
import AppError from "../utils/appError";
import catchAsync from "../utils/catchAsync";
import { promisify } from "util";
import { NextFunction, Request, Response } from "express";
import Email from "../utils/email";
import crypto from "crypto";

const signToken = (id: string) =>
  jwt.sign(
    { id },
    process.env.JWT_SECRET as string,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    } as SignOptions,
  );

const createSendToken = (user: any, statusCode: number, res: Response) => {
  const token = signToken(user._id.toString());

  user.password = undefined;

  res
    .status(statusCode)
    .cookie("jwt", token, {
      expires: new Date(
        Date.now() +
          Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000,
      ),
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    })
    .json({
      status: "success",
      data: user,
    });
};

export const signup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      passwordChangedAt: req.body.passwordChangedAt,
      role: req.body.role,
    });

    const confirmToken = newUser.createEmailConfirmToken();

    await newUser.save({ validateBeforeSave: false });

    const url = `${req.protocol}://${req.get("host")}/api/v1/users/confirmEmail/${confirmToken}`;

    await new Email(newUser, url).sendConfrimationEmail();

    res.status(201).json({
      status: "success",
    });
  },
);

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return next(new AppError("Please provide email and password", 400));
    }
    // 2) Check if the user exists && pass is correct
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError("Incorrect email or password", 401));
    }

    // 3) If everything ok, send token to client
    createSendToken(user, 200, res);
  },
);

export const logout = (req: Request, res: Response) => {
  res
    .cookie("jwt", "loggedout", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    })
    .status(200)
    .json({ status: "success" });
};

export const protect = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1) Getting token and check of it's there
    let token;
    if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(
        new AppError("You are not logged in! Please log in to get acces", 401),
      );
    }

    // 2) Verification token
    const verifyAsync = promisify(jwt.verify) as (arg1: any, arg2: any) => any;

    const decoded = await verifyAsync(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const freshUser = await User.findById(decoded.id);

    if (!freshUser) {
      return next(
        new AppError(
          "The user belonging to this token does no longer exist.",
          401,
        ),
      );
    }

    // 4) Check if user changed password after jwt was issued
    if (freshUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError(
          "User recently changed password! Please log in again.",
          401,
        ),
      );
    }

    //Grant acces to protected route

    req.user = freshUser;
    res.locals.user = freshUser;
    next();
  },
);
//Only for rendered pages, no errors!
export const isLoggedIn = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // 1) Getting token and check of it's there
  let token;

  if (req.cookies.jwt && req.cookies.jwt !== "loggedout") {
    try {
      token = req.cookies.jwt;
      const verifyAsync = promisify(jwt.verify) as (
        arg1: any,
        arg2: any,
      ) => any;

      const decoded = await verifyAsync(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      // 2) Verification token

      // 3) Check if user still exists
      const freshUser = await User.findById(decoded.id);

      if (!freshUser) {
        return next();
      }

      // 4) Check if user changed password after jwt was issued
      if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      //Grant acces to protected route
      res.locals.user = freshUser;
      return next();
    } catch (err) {
      return next();
    }
  }

  return next();
};

export const restrictTo =
  (...roles: Array<"user" | "guide" | "lead-guide" | "admin">) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to preform this action", 403),
      );
    }
    next();
  };

export const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return next(new AppError("There is no user with email address", 404));
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send it to user's email

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
      token: resetToken,
    });

    // TODO: Send the token to the user's email
    // try {
    //     const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    //     await new Email(user, resetURL).sendPasswordReset();

    //     res.status(200).json({
    //         status: 'succes',
    //         message: 'Token sent to email!',
    //         //NOTE: This is not the best way to send the token, it should be just sent to the email, this is for development purposes
    //         token: resetToken,
    //     });
    // } catch (err) {
    //     user.passwordResetToken = undefined;
    //     user.passwordResetExpires = undefined;

    //     await user.save({ validateBeforeSave: false });
    //     return next(new AppError('There was an error sending the email. Try again later!', 500));
    // }
  },
);

export const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1) Get user based on the token
    //NOTE: This is not the best way to send the token, it should be just sent to the email, this is for development purposes
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
      return next(new AppError("Token is invalid or has expired", 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();
    // 3) Update changedPasswordAt property for the user

    // 4) Log the user in, send JWT
    createSendToken(user, 200, res);
  },
);

export const updatePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return next(new AppError("There is no user logged in", 404));
    }

    if (!req.body.password || !req.body.passwordConfirm) {
      return next(
        new AppError("Please provide a new password and passwordConfirm", 400),
      );
    }

    if (!req.body.passwordCurrent) {
      return next(new AppError("Please provide your current password", 400));
    }

    // 2) Check if POSTed current password is correct
    if (
      !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
      return next(new AppError("Your current password is wrong.", 401));
    }

    // 3) If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    await user.save();
    //NOTE: User.findByIdAndUpdate will NOT work as intended!

    // 4) Log user in, send JWT
    createSendToken(user, 200, res);
  },
);

export const confirmEmail = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const emailToken = req.params.token;

    const hashedToken = crypto
      .createHash("sha256")
      .update(emailToken)
      .digest("hex");

    const user = await User.findOne({
      emailConfirmToken: hashedToken,
    });

    if (user?.emailConfirmExpires && user.emailConfirmExpires < new Date()) {
      user.deleteOne();

      return next(
        new AppError(
          "Token is invalid or has expired, please sign up again",
          400,
        ),
      );
    }

    if (!user) {
      return next(
        new AppError(
          "Token is invalid or has expired, please sign up again",
          400,
        ),
      );
    }

    user.emailConfirmToken = undefined;
    user.emailConfirmExpires = undefined;
    user.active = true;

    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id.toString());

    res
      .status(200)
      .cookie("jwt", token, {
        expires: new Date(
          Date.now() +
            Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000,
        ),
        httpOnly: true,
        //We only activate this in production
        secure: process.env.NODE_ENV === "production" ? true : false,
      })
      .redirect("/me");
  },
);
