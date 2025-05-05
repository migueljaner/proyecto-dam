import mongoose from 'mongoose';

interface IBookingDoc {
    tour: mongoose.Schema.Types.ObjectId;
    user: mongoose.Schema.Types.ObjectId;
    price: number;
    createdAt: Date;
    paid: boolean;
}

interface IBookingModel extends mongoose.Model<IBookingDoc> {
    createBooking: (tourId: string, userId: string, price: number) => Promise<IBookingDoc>;
}

const bookingSchema = new mongoose.Schema<IBookingDoc, IBookingModel>(
    {
        tour: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tour',
            required: [true, 'Booking must belong to a tour.'],
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Booking must belong to a user.'],
        },
        price: {
            type: Number,
            required: [true, 'Booking must have a price.'],
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        paid: {
            type: Boolean,
            default: true,
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

bookingSchema.statics.createBooking = async function (tourId: string, userId: string, price: number) {
    const booking = await this.create({ tour: tourId, user: userId, price });

    return booking;
};

bookingSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'tour',
        select: 'name',
    });

    next();
});

const Booking = mongoose.model<IBookingDoc, IBookingModel>('Booking', bookingSchema);

export default Booking;
