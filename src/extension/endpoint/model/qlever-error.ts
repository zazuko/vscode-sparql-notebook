export interface QLeverErrorMetadata {
    line: number;
    positionInLine: number;
    startIndex: number;
    stopIndex: number;
}

export interface QLeverErrorTime {
    computeResult: number;
    total: number;
}

export interface QLeverError {
    exception: string;
    metadata: QLeverErrorMetadata;
    query: string;
    resultsize: number;
    status: string;
    time: QLeverErrorTime;
}