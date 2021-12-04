import {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime";
import { FastifyError, FastifyRequest } from "fastify";

import { is } from "../../common";
import { ErrorCode, ErrorTitle } from "../../data/enumeration";
import { UnknownDict } from "../../data/types";
import { SeracAggregateError, SeracError } from "../../error";
import { getPrismaCodeToErrorArgs } from "../../mapper/error";

import { Handler } from "../handler";

declare class PrismaClientGenericError extends Error {
  get [Symbol.toStringTag](): string;
}

type SeracErrorType = SeracError | SeracAggregateError;

abstract class ErrorHandler extends Handler<Error, SeracErrorType> {
  abstract _handle(t: Error): SeracErrorType;
  handle(t: Error, request: FastifyRequest) {
    request.log.error(t);
    return this._handle(t);
  }
}

abstract class PrismaErrorHandler extends ErrorHandler {
  protected isPrismaError<T extends PrismaClientGenericError>(
    t: Error,
    key: keyof T,
    tag: string
  ): boolean {
    if (is<T, Error>(t, key)) {
      return (t as T)[Symbol.toStringTag] === tag;
    }
    return false;
  }
}

export class PrismaKnownRequestErrorHandler extends PrismaErrorHandler {
  _handle(t: PrismaClientKnownRequestError) {
    const args = getPrismaCodeToErrorArgs().get(t.code);
    return new SeracError({
      detail: t.message,
      code: args?.code ?? ErrorCode.Service,
      status: args?.status ?? 500,
      title: args?.title ?? ErrorTitle.Unknown,
      meta: t.meta === undefined ? undefined : (t.meta as UnknownDict),
    });
  }
  canHandle(t: Error): boolean {
    return this.isPrismaError<PrismaClientKnownRequestError>(
      t,
      "clientVersion",
      "PrismaKnownRequestError"
    );
  }
}

export class PrismaUnknownRequestErrorHandler extends PrismaErrorHandler {
  _handle(t: PrismaClientUnknownRequestError) {
    return new SeracError({
      detail: t.message,
      code: ErrorCode.Service,
      status: 500,
      title: ErrorTitle.Unknown,
    });
  }
  canHandle(t: Error): boolean {
    return this.isPrismaError<PrismaClientUnknownRequestError>(
      t,
      "clientVersion",
      "PrismaClientUnknownRequestError"
    );
  }
}
export class PrismaValidationErrorHandler extends PrismaErrorHandler {
  _handle(t: PrismaClientValidationError) {
    return new SeracError({
      detail: t.message,
      code: ErrorCode.Validation,
      status: 400,
      title: ErrorTitle.Validation,
    });
  }
  canHandle(t: Error): boolean {
    return this.isPrismaError<PrismaClientValidationError>(
      t,
      Symbol.toStringTag,
      "PrismaClientValidationError"
    );
  }
}

export class FastifyErrorHandler extends ErrorHandler {
  _handle(t: FastifyError) {
    return new SeracError({
      detail: t.message,
      code: t.code.toLowerCase(),
      status: t.statusCode ?? 500,
      title: ErrorTitle.BadRequest,
    });
  }
  canHandle(t: Error): boolean {
    return is<FastifyError, Error>(t, "code") && t.name === "FastifyError";
  }
}

export class SeracErrorHandler extends ErrorHandler {
  _handle(t: SeracError) {
    return t;
  }
  canHandle(t: Error): boolean {
    return is<SeracError, Error>(t, "status") && t.name === "SeracError";
  }
}

export class SeracAggregateErrorHandler extends ErrorHandler {
  _handle(t: SeracAggregateError) {
    return t;
  }
  canHandle(t: Error): boolean {
    return (
      is<SeracAggregateError, Error>(t, "status") &&
      t.name === "SeracAggregateError"
    );
  }
}
