import { Model, Document, Query } from 'mongoose';

interface QueryString {
    sort: string;
    fields: string;
    page: number;
    limit: number;
}

class APIFeatures<T extends Document> {
    query: Query<T[], T>;
    queryString: QueryString;

    constructor(query: Query<T[], T>, queryString: QueryString | any) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach((el) => delete queryObj[el as keyof QueryString]);

        // 2) Advanced filtering
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

        this.query = this.query.find(JSON.parse(queryStr));
        // let query = Tour.find(JSON.parse(queryStr));

        return this;
    }

    sort() {
        if (typeof this.queryString.sort === 'string') {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt');
        }

        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields) as any; // Type assertion to 'any'
        } else {
            this.query = this.query.select('-__v') as any; // Type assertion to 'any'
        }

        return this;
    }

    paginate() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit;
        this.query = this.query.skip(skip).limit(limit);

        return this;
    }
}

export default APIFeatures;
