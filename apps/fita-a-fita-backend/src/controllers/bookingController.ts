import Booking from "../models/bookingModel";
import Tour from "../models/tourModel";
import AppError from "../utils/appError";
import * as factory from "./handlerFactory";
import catchAsync from "../utils/catchAsync";
import { Stripe } from "stripe";

// Remove the immediate initialization
let stripe: Stripe;

const getStripe = () => {
  if (!stripe) {
    const apiKey = process.env.PRIVATE_STRIPE_KEY;
    if (!apiKey) {
      throw new Error("Stripe API key is not configured");
    }
    stripe = new Stripe(apiKey, {
      apiVersion: "2025-04-30.basil",
    });
  }
  return stripe;
};

export const createBooking = factory.createOne(Booking);
export const getBooking = factory.getOne(Booking);
export const getAllBookings = factory.getAll(Booking);
export const updateBooking = factory.updateOne(Booking);
export const deleteBooking = factory.deleteOne(Booking);

export const getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  // 2) Create checkout session
  if (!tour) {
    return next(new AppError("There is no tour with that ID", 404));
  }

  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ["card"],
    success_url: `${req.protocol}://localhost:4321/?tour=${tour._id}&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://localhost:4321/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
        },
      },
    ] as Stripe.Checkout.SessionCreateParams.LineItem[],
  });

  res.status(200).json({
    status: "success",
    session,
  });
});

export const createBookingCheckout = catchAsync(async (req, res, next) => {
  // This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without paying
  const { tour, user, price } = req.query;

  if (!tour || !user || !price) return next();

  await Booking.createBooking(
    tour as string,
    user as string,
    parseInt(price as string),
  );

  res.redirect(req.originalUrl.split("?")[0]);
});
