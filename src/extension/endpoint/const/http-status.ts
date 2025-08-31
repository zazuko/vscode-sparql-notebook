export enum HttpSuccessStatus {
    OK = 200, // The request succeeded.
    Created = 201, // The request succeeded and a new resource was created.
    Accepted = 202, // The request has been accepted for processing, but the processing is not complete.
    NonAuthoritativeInformation = 203, // The response is from a transforming proxy, not the origin server.
    NoContent = 204, // The request succeeded, but there is no content to send in the response.
    ResetContent = 205, // The request succeeded, and the client should reset the view.
    PartialContent = 206 // The server is delivering only part of the resource (used for range requests).
}

export enum HttpErrorStatus {
    BadRequest = 400, // The request could not be understood by the server due to malformed syntax.
    Unauthorized = 401, // The request requires user authentication.
    Forbidden = 403, // The server understood the request, but is refusing to fulfill it.
    NotFound = 404, // The server has not found anything matching the Request-URI.
    MethodNotAllowed = 405, // The method specified in the Request-Line is not allowed for the resource identified by the Request-URI.
    NotAcceptable = 406, // The resource is only capable of generating response entities that have content characteristics not acceptable according to the Accept headers sent in the request.
    InternalServerError = 500, // The server encountered an unexpected condition which prevented it from fulfilling the request.
    NotImplemented = 501, // The server does not support the functionality required to fulfill the request.
    BadGateway = 502, // The server, while acting as a gateway or proxy, received an invalid response from the upstream server.
    ServiceUnavailable = 503, // The server is currently unable to handle the request due to a temporary overloading or maintenance of the server.
    GatewayTimeout = 504 // The server, while acting as a gateway or proxy, did not receive a timely response from the upstream server.
}