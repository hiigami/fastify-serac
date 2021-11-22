import { AnySchema } from "yup";
import { TokenType } from "./enumeration";
import { StrKeyDict, UnknownDict } from "./types";

export interface Token {
  type: TokenType;
  start: number;
  length: number;
}

export interface HTTPSchemas {
  body?: AnySchema;
  querystring?: AnySchema;
  params?: AnySchema;
  headers?: AnySchema;
  response?: AnySchema;
}

export type Fields = StrKeyDict<string[]>;
export type Filters = StrKeyDict<string>;

export interface QueryPagination {
  number: number;
  size: number;
}

export interface QueryParameters {
  fields?: Fields;
  filter?: Filters;
  sort?: string[];
  include?: string[];
  page?: QueryPagination;
}

export interface ResourceLinks {
  self: string;
}

export interface ResourceIdentifier {
  id: string;
  type: string;
}

export interface ResourceObject extends ResourceIdentifier {
  attributes?: UnknownDict;
  links?: ResourceLinks;
}

export type RelationShipData = ResourceIdentifier | ResourceIdentifier[] | null;

export interface RelationShip {
  data: RelationShipData;
}

export interface RelationShips {
  [key: string]: RelationShip | null /**@todo check if null */;
}

export interface TopLevelResource extends ResourceObject {
  relationships?: RelationShips;
}

export interface TopLevelLinks extends ResourceLinks {
  first: string;
  prev?: string;
  next?: string;
  last: string;
}

export interface TopLevelMeta {
  total: number;
}

export interface TopLevelJSONAPI {
  version: string;
}

export interface TopLevelObject {
  jsonapi: TopLevelJSONAPI;
  data: TopLevelResource | TopLevelResource[];
  included?: ResourceObject[];
  links?: TopLevelLinks | ResourceLinks;
  meta?: TopLevelMeta;
}

export interface PayloadResourceObject extends Omit<ResourceObject, "links"> {
  relationships?: Omit<RelationShips, "null">;
}

export interface CreatePayload {
  data: Omit<PayloadResourceObject, "id">;
}

export interface PatchPayload {
  data: PayloadResourceObject;
}
