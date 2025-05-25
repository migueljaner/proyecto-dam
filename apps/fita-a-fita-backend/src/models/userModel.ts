import mongoose, { Schema, Model } from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import crypto from "crypto";

//name, email, photo, password, passwordConfirm

export interface IUserDoc {
  name: string;
  email: string;
  photo: string;
  role: "user" | "guide" | "lead-guide" | "admin";
  password: string;
  passwordConfirm?: string;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  emailConfirmToken?: string;
  emailConfirmExpires?: Date;
  active?: boolean;
}

interface IUserMethods {
  correctPassword: (
    candidatePassword: string,
    userPass: string,
  ) => Promise<boolean>;
  changedPasswordAfter: (JWTTimestamp: number) => boolean;
  createPasswordResetToken: () => string;
  createEmailConfirmToken: () => string;
}

type UserModel = Model<IUserDoc, {}, IUserMethods>;

const userSchema = new Schema<IUserDoc, UserModel, IUserMethods>({
  name: {
    type: String,
    required: [true, "A user must have a name"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "A user must have an email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Provide a valid email"],
  },
  photo: {
    type: String,
    default: "default.jpg",
  },
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
    select: false, //NOTE: This is for security reasons, we don't want to show the password in the response
  },
  passwordConfirm: {
    type: String || undefined,
    required: [true, "Please confirm your password"],
    validate: {
      //This only works on SAVE!!
      validator: function (this: IUserDoc, el: string): boolean {
        return el === this.password;
      },
      message: "Passwords are not the same",
    },
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailConfirmToken: String,
  emailConfirmExpires: Date,
});

userSchema.pre("save", async function (next) {
  //Only run this pass if pass was actually modified
  if (!this.isModified("password")) return next();

  //Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  //Delete confirm password
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", function (next) {
  //Only run this pass if pass was actually modified
  if (!this.isModified("password") || this.isNew) return next();

  //Substract 1 second to avoid errors
  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

userSchema.pre(/^find/, function (this: mongoose.Query<any, any>, next) {
  //this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPass,
) {
  return await bcrypt.compare(candidatePassword, userPass);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000 + "",
      10,
    );

    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetToken = hashedToken;
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

  return resetToken;
};

userSchema.methods.createEmailConfirmToken = function () {
  const confirmToken = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(confirmToken)
    .digest("hex");

  this.emailConfirmToken = hashedToken;
  this.emailConfirmExpires = new Date(Date.now() + 10 * 60 * 1000);

  return confirmToken;
};

const userModel = mongoose.model<IUserDoc, UserModel>("User", userSchema);

export default userModel;
