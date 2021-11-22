import * as yup from "yup";
import { Headers, MediaType } from "../data/enumeration";

import { buildQueryParametersSchema } from "./query_parameters_schema";
import { buildPatchSchema } from "./patch_schema";
import { buildPostSchema } from "./post_schema";

function getHeaderSchema() {
  return yup
    .object({
      [Headers.ContentType.toLowerCase()]: yup
        .string()
        .oneOf([MediaType.JsonAPI])
        .required(),
    })
    .required();
}

export function listSchemas(tableName: string) {
  return {
    headers: getHeaderSchema(),
    querystring: buildQueryParametersSchema(tableName),
  };
}

export function getSchemas(tableName: string) {
  return {
    headers: getHeaderSchema(),
    querystring: buildQueryParametersSchema(tableName).omit([
      "filter",
      "sort",
      "page",
    ]),
    params: yup.object({ id: yup.string().required() }),
  };
}

export function deleteSchemas(_tableName: string) {
  return {
    headers: getHeaderSchema(),
    params: yup.object({ id: yup.string().required() }),
  };
}

export function patchSchemas(tableName: string) {
  return {
    headers: getHeaderSchema(),
    body: buildPatchSchema(tableName),
    params: yup.object({ id: yup.string().required() }),
  };
}

export function postSchemas(tableName: string) {
  return {
    headers: getHeaderSchema(),
    body: buildPostSchema(tableName),
  };
}
