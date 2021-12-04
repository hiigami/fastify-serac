import { FastifyRequest } from "fastify";

import { Handler } from "./handler/handler";

export class Processor<A, B> {
  private handlers: ReadonlyArray<Handler<A, B>>;
  constructor(handlers: Handler<A, B>[]) {
    this.handlers = Object.freeze(handlers);
  }
  async run(t: A, request: FastifyRequest, returnFirst = false) {
    for (const handler of this.handlers) {
      if (handler.canHandle(t)) {
        const r = await handler.handle(t, request);
        if (returnFirst) {
          return r;
        }
      }
    }
    return undefined;
  }
}
