import { HTTPMethod, MethodMapItem, MethodMapItemFn } from "../data/blueprint";
import { HTTPHandler } from "../data/http_handler";
import * as handler from "../http_handler";
import * as schemas from "../schema";

function createItem(
  url: string,
  handler: HTTPHandler,
  schemaBuilder: MethodMapItemFn
) {
  return { url, handler, schemaBuilder };
}

export function getMethodToHandlerMapper() {
  return new Map<HTTPMethod, MethodMapItem>([
    ["DELETE", createItem(":id", handler.deleteHandler, schemas.deleteSchemas)],
    ["LIST", createItem("", handler.listHandler, schemas.listSchemas)],
    ["GET", createItem(":id", handler.getHandler, schemas.getSchemas)],
    ["PATCH", createItem(":id", handler.patchHandler, schemas.patchSchemas)],
    ["POST", createItem("", handler.postHandler, schemas.postSchemas)],
  ]);
}
