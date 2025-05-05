import mongoose, { Model, Schema } from 'mongoose';
import Tour from './tourModel';

interface IReviewDoc extends Document {
    review: string;
    rating: number;
    createdAt: Date;
    tour: Schema.Types.ObjectId;
    user: Schema.Types.ObjectId;
}

interface ReviewModel extends Model<IReviewDoc> {
    calcAverageRatings: (tourId: string) => Promise<void>;
}

const reviewSchema = new Schema<IReviewDoc, ReviewModel>(
    {
        review: {
            type: String,
            required: [true, 'Review can not be empty!'],
        },
        rating: {
            type: Number,
            min: [1, 'Rating must be above 1.0'],
            max: [5, 'Rating must be below 5.0'],
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        tour: {
            type: Schema.Types.ObjectId,
            ref: 'Tour',
            required: [true, 'Review must belong to a tour.'],
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to a user.'],
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'user',
        select: 'name photo',
    });

    next();
});

reviewSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'tour',
        select: 'name',
    });

    next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId: string) {
    const stats = await this.aggregate([
        {
            $match: { tour: tourId },
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' },
            },
        },
    ]);

    if (stats.length > 0)
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating,
        });
    else
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5,
        });
};

reviewSchema.post('save', function (next) {
    const model = this.constructor as ReviewModel;
    model.calcAverageRatings(this.tour.toString());
});

reviewSchema.post(/^findOneAnd/, async function (doc: IReviewDoc) {
    const model = this.constructor as ReviewModel;
    if (doc) await model.calcAverageRatings(doc.tour.toString());
});

const Review = mongoose.model<IReviewDoc, ReviewModel>('Review', reviewSchema);

export default Review;
