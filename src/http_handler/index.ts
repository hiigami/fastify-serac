import { FastifyReply, FastifyRequest } from "fastify";

import { Headers, MediaType } from "../data/enumeration";
import {
  CreatePayload,
  PatchPayload,
  QueryParameters,
  TopLevelResource,
} from "../data/json_api";
import { HookQueryType, SerializerHook } from "../data/serializer";
import { UnknownDict } from "../data/types";
import { getPaginationLinks } from "../json_api/pagination";
import { serializers } from "../mapper/serializer";
import { getPrismaProperty } from "../prisma/common";
import * as serializer from "../serializer";

function setHeaders(reply: FastifyReply, headers?: UnknownDict): FastifyReply {
  return reply.headers({
    ...headers,
    [Headers.ContentType]: MediaType.JsonAPI,
  });
}

function getIdParameter(params: UnknownDict) {
  return Number.parseInt(params.id as string);
}

async function applyQueryHook<T extends HookQueryType>(
  query: T,
  request: FastifyRequest,
  hook?: SerializerHook<T>
) {
  if (hook === undefined) {
    return query;
  }

  return await hook(query, request);
}

export const deleteHandler =
  (tableName: string) =>
  async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<UnknownDict> => {
    const table = getPrismaProperty(tableName, request.server.prisma);
    const identifier = getIdParameter(request.params as UnknownDict);
    await table.delete({ where: { id: identifier } });
    return reply.status(204).send();
  };

export const patchHandler =
  (tableName: string) =>
  async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<UnknownDict> => {
    const query = serializer.serializePrismaPatchQuery(
      request.body as PatchPayload
    );
    const identifier = getIdParameter(request.params as UnknownDict);
    if (query.where.id !== identifier) {
      return reply.status(409).send(); /**@todo check if correct response*/
    }
    const table = getPrismaProperty(tableName, request.server.prisma);
    const _query = await applyQueryHook(
      query,
      request,
      serializers.get(tableName)?.update
    );
    await table.update(_query);
    return setHeaders(reply).status(204).send();
  };

export const getHandler =
  (tableName: string) =>
  async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<UnknownDict> => {
    const identifier = getIdParameter(request.params as UnknownDict);
    const table = getPrismaProperty(tableName, request.server.prisma);
    const query = serializer.serializePrismaQueryParametersQuery(
      tableName,
      request.query as QueryParameters
    );
    const response = await table.findUnique({
      select: query.select,
      where: { id: identifier },
    });
    if (response === null) {
      return reply.status(404).send();
    }
    const t = serializer.serializePrismaData(tableName, response, true);
    return setHeaders(reply).status(200).send(t);
  };

export const listHandler =
  (tableName: string) =>
  async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<UnknownDict> => {
    const table = getPrismaProperty(tableName, request.server.prisma);
    const queryParams = request.query as QueryParameters;
    const query = serializer.serializePrismaQueryParametersQuery(
      tableName,
      queryParams
    );
    const _query = await applyQueryHook(
      query,
      request,
      serializers.get(tableName)?.list
    );
    const [items, count] = await Promise.all([
      table.findMany(_query),
      table.count({ where: _query.where }),
    ]);
    const paginationLinks = getPaginationLinks(
      count,
      request.raw.url as string,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      queryParams.page!
    );

    const t = serializer.serializePrismaData(
      tableName,
      items,
      true,
      paginationLinks,
      { total: count }
    );
    return setHeaders(reply).status(200).send(t);
  };

export const postHandler =
  (tableName: string) =>
  async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<UnknownDict> => {
    const table = getPrismaProperty(tableName, request.server.prisma);
    const query = serializer.serializePrismaCreateQuery(
      request.body as CreatePayload
    );
    const _query = await applyQueryHook(
      query,
      request,
      serializers.get(tableName)?.create
    );
    const item = await table.create(_query);
    const response = serializer.serializePrismaData(tableName, item);
    const location = (response?.data as TopLevelResource).links?.self;
    return setHeaders(reply, { Location: location }).status(201).send(response);
  };
