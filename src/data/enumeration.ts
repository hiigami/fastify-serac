export enum Headers {
  ContentType = "Content-Type",
}

export enum MediaType {
  JsonAPI = "application/vnd.api+json",
}

export enum TokenType {
  AnyOperator,
  Comma,
  Condition,
  L_PAREN,
  Literal,
  Negate,
  Operator,
  R_Condition,
  R_PAREN,
  S_QUOTE,
  String,
}

export enum ErrorCode {
  ResourceNotFound = "resource_not_found",
  Service = "service_error",
  Validation = "validation_error",
}

export enum ErrorTitle {
  Duplicated = "Resource already exists.",
  Integrity = "Resource integrity error",
  NotFound = "The specified resource does not exist.",
  BadRequest = "Bad request.",
  Unknown = "An unknown error has occurred.",
  Validation = "Missing field or incorrect type.",
}
