import { FastifyInstance, FastifyPluginOptions } from "fastify";
import fp from "fastify-plugin";

import { MediaType } from "./data/enumeration";
import {
  CreateQuery,
  PatchQuery,
  ReadQuery,
  Serializer,
} from "./data/serializer";
import { loadBlueprints } from "./blueprint";
import { serializers } from "./mapper/serializer";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { mapper } from "./prisma/tables";

export { CreateQuery, PatchQuery, ReadQuery, Serializer };

interface PluginOptions extends FastifyPluginOptions {
  [x: string]: Serializer;
}

function addSerializers(options?: PluginOptions) {
  if (options !== undefined) {
    for (const name in options) {
      if (mapper.has(name)) {
        const serializer = options[name];
        serializers.set(name, serializer);
      }
    }
  }
}

function addContentTypeParser(server: FastifyInstance) {
  server.addContentTypeParser(
    MediaType.JsonAPI,
    { parseAs: "string" },
    (_request, body, done) => {
      try {
        done(null, JSON.parse(body as string));
      } catch (e) {
        done(e as Error, undefined);
      }
    }
  );
}

async function plugin(server: FastifyInstance, options?: PluginOptions) {
  addSerializers(options);
  addContentTypeParser(server);
  loadBlueprints(server);
}

export default fp(plugin, { fastify: "3.x", name: "serac" });
