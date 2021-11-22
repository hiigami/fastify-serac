import path from "path";

import { FastifyInstance, HTTPMethods, RouteOptions } from "fastify";
import { AnySchema } from "yup";

import {
  FastifyRouteSchemaDef,
  ViewArgs,
  ViewMethods,
} from "../data/blueprint";
import { merge, removeUndefinedOrEmpty } from "../common";

import { Router } from "./router";

function validateData<T>(routeSchema: FastifyRouteSchemaDef<T>, data: unknown) {
  const schema = routeSchema.schema as unknown as AnySchema;
  try {
    const result = schema.validateSync(data, { strict: true, context: data });
    const r = removeUndefinedOrEmpty(
      merge(removeUndefinedOrEmpty({ ...schema.getDefault() }), result)
    );
    return { value: { ...r } };
  } catch (e: unknown) {
    const err = e as Error;
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
