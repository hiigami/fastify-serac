import path from "path";

import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  HTTPMethods,
  RouteOptions,
} from "fastify";
import { AnySchema } from "yup";

import {
  FastifyRouteSchemaDef,
  ViewArgs,
  ViewMethods,
} from "../data/blueprint";
import { merge, removeUndefinedOrEmpty } from "../common";

import { Router } from "./router";
import { Processor } from "../processor";
import { errorHandlers } from "../handler";
import { setHeaders } from "../json_api";
import { SeracError } from "../error";
import { ErrorCode, ErrorTitle } from "../data/enumeration";

function validateData<T>(routeSchema: FastifyRouteSchemaDef<T>, data: unknown) {
  const schema = routeSchema.schema as unknown as AnySchema;
  try {
    const result = schema.validateSync(data, { strict: true, context: data });
    const r = removeUndefinedOrEmpty(
      merge(removeUndefinedOrEmpty({ ...schema.getDefault() }), result)
    );
    return { value: { ...r } };
  } catch (e: unknown) {
    const err = new SeracError({
      code: ErrorCode.Validation,
      title: ErrorTitle.Validation,
      detail: (e as Error).message,
      status: routeSchema.httpPart !== "headers" ? 400 : 415,
    });
    return { error: err };
  }
}

function validatorCompiler<T>(routeSchema: FastifyRouteSchemaDef<T>) {
  return (data: unknown) => validateData(routeSchema, data);
}

function getHTTPMethod(key: string): HTTPMethods {
  return (key === "LIST" ? "GET" : key) as HTTPMethods;
}

function getKeys(mapper: ViewMethods) {
  const keys = [];
  for (const key in mapper) {
    if (mapper[key as keyof ViewMethods] !== undefined) {
      keys.push(key);
    }
  }
  return keys;
}

function getURL(name: Lowercase<string>) {
  return name.endsWith("s") ? name : `${name}s`;
}

async function errorHandler(
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const processor = new Processor([
    new errorHandlers.PrismaValidationErrorHandler(),
    new errorHandlers.PrismaKnownRequestErrorHandler(),
    new errorHandlers.PrismaUnknownRequestErrorHandler(),
    new errorHandlers.FastifyErrorHandler(),
    new errorHandlers.SeracAggregateErrorHandler(),
    new errorHandlers.SeracErrorHandler(),
  ]);
  const e = await processor.run(error, request, true);
  if (e !== undefined) {
    return await setHeaders(reply).status(e.status).send(e.toJSON());
  }
  return await reply.send(error);
}

export class View implements Iterator<RouteOptions> {
  private mapper: ViewMethods;
  private methods: string[];
  private url: string;

  constructor(server: FastifyInstance, args: ViewArgs) {
    this.mapper = new Router(args.tableName).getRoutes(server);
    this.methods = getKeys(this.mapper);
    this.url = path.join("/", getURL(args.tableName.toLowerCase()));
  }
  next(): IteratorResult<RouteOptions> {
    const key = this.methods.pop();
    if (key !== undefined) {
      const routeOptions = this.mapper[key as keyof ViewMethods];
      if (routeOptions !== undefined) {
        routeOptions.url = path.join(this.url, routeOptions.url);
        return {
          value: {
            ...routeOptions,
            method: [getHTTPMethod(key)],
            validatorCompiler,
            errorHandler,
          },
          done: false,
        };
      }
    }
    this.methods = getKeys(this.mapper);
    return { value: undefined, done: true };
  }
  [Symbol.iterator]() {
    return {
      next: () => {
        return this.next();
      },
    };
  }
}
