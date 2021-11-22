import {
  FastifyInstance,
  RouteOptions,
  HTTPMethods,
  preValidationHookHandler,
  preParsingHookHandler,
  preHandlerHookHandler,
} from "fastify";
import { HTTPHandler } from "./http_handler";
import { HTTPSchemas } from "./json_api";

import { Dict } from "./types";

export type ComposedHook<T> = (server: FastifyInstance) => T;

export type BlueprintRouteOptions = Omit<
  RouteOptions,
  "method" | "validatorCompiler"
>;

export interface FastifyRouteSchemaDef<T> {
  schema: T;
  method: string;
  url: string;
  httpPart?: string;
  httpStatus?: string;
}

export type HTTPMethod = HTTPMethods | "LIST";

export interface RouterOptions
  extends Omit<
    BlueprintRouteOptions,
    "preValidation" | "preParsing" | "preHandler"
  > {
  preValidation?: ComposedHook<preValidationHookHandler>;
  preParsing?: ComposedHook<preParsingHookHandler>;
  preHandler?: ComposedHook<preHandlerHookHandler>;
}

export type ViewMethods = Partial<Dict<HTTPMethod, BlueprintRouteOptions>>;

export interface ViewArgs {
  tableName: string;
}

export type MethodMapItemFn = (tableName: string) => HTTPSchemas;
export interface MethodMapItem {
  url: string;
  handler: HTTPHandler;
  schemaBuilder: MethodMapItemFn;
}
