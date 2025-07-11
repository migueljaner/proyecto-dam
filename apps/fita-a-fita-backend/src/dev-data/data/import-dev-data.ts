import fs from "fs";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Tour from "../../models/tourModel";
import Review from "../../models/reviewModel";
import User from "../../models/userModel";
import Booking from "../../models/bookingModel";

dotenv.config({ path: "./.env" });

const DB = process.env
  .DATABASE!.replace("<PASSWORD>", process.env.DATABASE_PASSWORD!)
  .replace("<USER>", process.env.DATABASE_USER!);

mongoose.connect(DB).then(() => {
  console.log("DB connection succesful");
});

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, "utf-8"));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, "utf-8"),
);
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf-8"));
const bookings = JSON.parse(
  fs.readFileSync(`${__dirname}/bookings.json`, "utf-8"),
);

const importData = async () => {
  try {
    await Review.create(reviews);
    await Tour.create(tours);
    // NOTE: We have to comment the pre save middleware to avoid the password hashing
    await User.create(users, { validateBeforeSave: false });
    await Booking.create(bookings);

    console.log("Data succesfully loaded!");
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await Review.deleteMany();
    await User.deleteMany();
    await Booking.deleteMany();
    console.log("Data succesfully deleted");
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

console.log(process.argv);
if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
}
