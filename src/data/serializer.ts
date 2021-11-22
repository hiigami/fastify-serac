import { RouterOptions } from "./blueprint";
import { StrKeyDict, UnknownDict } from "./types";

export type QueryItem = StrKeyDict<object>;

interface SelectItem {
  select: StrKeyDict<boolean | SelectItem>;
}

export type SelectQueryPart = StrKeyDict<boolean | SelectItem>;

export interface ReadQuery {
  select: SelectQueryPart;
  where: QueryItem;
  skip?: number;
  take?: number;
  orderBy: {
    [x: string]: string;
  }[];
}

export interface CreateQuery {
  data: UnknownDict;
}

export type PatchQuery = CreateQuery;

export type HookQueryType = CreateQuery | PatchQuery | ReadQuery;

export type SerializerHook<T extends HookQueryType> = (query: T) => Promise<T>;

export interface Serializer {
  exclude?: Set<string>;
  writeOnly?: Set<string>;
  preHandler?: RouterOptions["preHandler"];
  list?: SerializerHook<ReadQuery>;
  create?: SerializerHook<CreateQuery>;
  update?: SerializerHook<PatchQuery>;
}
