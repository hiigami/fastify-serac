import { FastifyReply } from "fastify";

import { Headers, MediaType } from "../data/enumeration";
import { UnknownDict } from "../data/types";

export function setHeaders(
  reply: FastifyReply,
  headers?: UnknownDict
): FastifyReply {
  return reply.headers({
    ...headers,
    [Headers.ContentType]: MediaType.JsonAPI,
  });
}
