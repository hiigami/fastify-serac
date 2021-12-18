import { FastifyReply, FastifyRequest } from "fastify";

import { UnknownDict } from "./types";

export type HTTPHandler = (
  tableName: string
) => (request: FastifyRequest, reply: FastifyReply) => Promise<UnknownDict>;
