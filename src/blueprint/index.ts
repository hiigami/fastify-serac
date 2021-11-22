import { FastifyInstance, FastifyPluginOptions, RouteOptions } from "fastify";
import fp from "fastify-plugin";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { mapper } from "../prisma/tables";

import { View } from "./view";

const registerRoute =
  (routeOptions: RouteOptions) =>
  async (
    server: FastifyInstance,
    _opts: FastifyPluginOptions,
    next: () => void
  ) => {
    server.route(routeOptions);
    next();
  };

function getRoutesOptions(apis: View[]) {
  const routeOptions = [];
  while (apis.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const api = apis.pop()!;
    for (const options of api) {
      routeOptions.push(registerRoute(options));
    }
  }
  return routeOptions;
}

function getViews(server: FastifyInstance, tableNames: string[]) {
  const views = [];
  for (const name of tableNames) {
    views.push(new View(server, { tableName: name }));
  }
  return views;
}

function register(server: FastifyInstance, apis: View[]) {
  const routeOptions = getRoutesOptions(apis);
  while (routeOptions.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    server.register(fp(routeOptions.pop()!));
  }
}

export function loadBlueprints(server: FastifyInstance) {
  const tableNames = [...mapper.keys()];
  const views = getViews(server, tableNames);
  register(server, views);
}
