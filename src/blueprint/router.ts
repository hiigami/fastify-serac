import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import {
  BlueprintRouteOptions,
  ComposedHook,
  RouterOptions,
  ViewMethods,
} from "../data/blueprint";
import { Maybe, StrKeyDict } from "../data/types";
import { getMethodToHandlerMapper } from "../mapper";
import { serializers } from "../mapper/serializer";
import { serializeQueryParameters } from "../serializer";

async function transform(request: FastifyRequest, _reply: FastifyReply) {
  request.query = serializeQueryParameters(request.query as StrKeyDict<string>);
}

function getComposedHook<T>(
  server: FastifyInstance,
  hook?: ComposedHook<T>
): Maybe<T> {
  if (hook === undefined) {
    return undefined;
  }
  return hook(server);
}

function getRouteOptions(
  server: FastifyInstance,
  options: RouterOptions
): BlueprintRouteOptions {
  return {
    schema: options.schema,
    preValidation: getComposedHook(server, options.preValidation),
    preParsing: getComposedHook(server, options.preParsing),
    preHandler: getComposedHook(server, options.preHandler),
    url: options.url,
    logLevel: options.logLevel,
    handler: options.handler,
  };
}

export class Router {
  private tableName: string;
  constructor(tableName: string) {
    this.tableName = tableName;
  }
  getRoutes(server: FastifyInstance) {
    const o = {} as ViewMethods;
    const mapper = getMethodToHandlerMapper();
    for (const [k, v] of mapper) {
      const { url, handler, schemaBuilder } = v;
      const schema = schemaBuilder(this.tableName);
      o[k] = getRouteOptions(server, {
        schema,
        url,
        preHandler: serializers.get(this.tableName)?.preHandler,
        handler: handler(this.tableName),
        preValidation: (_server) => transform,
      });
    }
    return o;
  }
}
