import { asTitle, unTitle } from "../common";
import {
  Fields,
  Filters,
  QueryPagination,
  QueryParameters,
} from "../data/json_api";
import { Table } from "../data/prisma";
import { QueryItem, ReadQuery, SelectQueryPart } from "../data/serializer";
import { tokenizer } from "../json_api/lexer";
import { getTable } from "../prisma";
import { serializeFilter } from "./filters";

function getSkipValue(pagination?: QueryPagination) {
  if (pagination === undefined) {
    return undefined;
  }
  return pagination.number * pagination.size;
}

function getOrderByItem(value: string) {
  const order = value.startsWith("-") ? "desc" : "asc";
  const key = value.startsWith("-") ? value.slice(1) : value;
  return { [key]: order };
}

function getOrderBy(orderBy?: string[]) {
  const items = [];
  if (orderBy === undefined) {
    return [];
  }
  for (const item of orderBy) {
    items.push(getOrderByItem(item));
  }
  return items;
}

function getWhere(tableName: string, table: Table, filters?: Filters) {
  if (filters === undefined) {
    return {};
  }
  let query: QueryItem = {};
  for (const name in filters) {
    const tokens = tokenizer(filters[name]);
    if (name === unTitle(tableName)) {
      const q = serializeFilter(filters[name], tokens, table.fields);
      query = { ...q };
    } else {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const y = getTable(table.relations.get(name)!.table);
      const q = serializeFilter(filters[name], tokens, y.fields);
      query[name] = { ...q };
    }
  }
  return query;
}

function getSelect(
  tableName: string,
  table: Table,
  fields?: Fields,
  include?: string[]
) {
  const o: SelectQueryPart = {};
  /**@todo add id always */
  if (fields !== undefined) {
    for (const x in fields) {
      if (x === unTitle(tableName)) {
        for (const y of fields[x]) {
          o[y] = true;
        }
        if (table.fields.has("id")) {
          o["id"] = true;
        }
      } else {
        const select = {} as Record<string, boolean>;
        for (const y of fields[x]) {
          select[y] = true;
        }
        if (getTable(asTitle(x)).fields.has("id")) {
          select["id"] = true;
        }
        o[x] = { select };
      }
    }
  }
  if (fields === undefined || !(unTitle(tableName) in fields)) {
    const keys = table.fields.keys();
    for (const x of keys) {
      o[x] = true;
    }
  }
  if (include !== undefined) {
    for (const x of include) {
      if (!(x in o)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const mm = getTable(table.relations.get(x)!.table);
        const select = {} as Record<string, boolean>;
        for (const y of mm.fields.keys()) {
          select[y] = true;
        }
        o[x] = { select };
      }
    }
  }
  return o;
}

export function serializePrismaQueryParametersQuery(
  tableName: string,
  parameters: QueryParameters
): ReadQuery {
  const table = getTable(tableName);
  return {
    select: getSelect(tableName, table, parameters.fields, parameters.include),
    where: getWhere(tableName, table, parameters.filter),
    skip: getSkipValue(parameters.page),
    take: parameters.page?.size,
    orderBy: getOrderBy(parameters.sort),
  };
}
