declare module 'mongoose' {
    interface Query<ResultType, DocType, THelpers = {}, RawDocType = DocType> {
        start?: number;
    }
}
