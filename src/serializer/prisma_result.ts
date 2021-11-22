import { isEmpty } from "../common";
import {
  RelationShips,
  ResourceObject,
  TopLevelLinks,
  TopLevelMeta,
  TopLevelObject,
  TopLevelResource,
} from "../data/json_api";
import { TableFields, TableRelations, Table } from "../data/prisma";
import { UnknownDict } from "../data/types";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { mapper } from "../prisma/tables";

type IncludedMembers = Set<ResourceObject>;
type RelationDataItem = UnknownDict | UnknownDict[];

function getNameForURL(name: Lowercase<string>) {
  return name.endsWith("s") ? name : `${name}s`;
}

function createLinkItem(name: string, ...args: string[]) {
  return `${getNameForURL(name.toLowerCase())}/${args.join("/")}`;
}

function createAttributesItem(data: UnknownDict, fields: TableFields) {
  const item = {} as UnknownDict;
  for (const prop in data) {
    if (fields.has(prop) && prop !== "id") {
      item[prop] = data[prop];
    }
  }
  return item;
}

function createResourceObject(
  resourceName: string,
  data: UnknownDict,
  table?: Table
) {
  const item = { type: resourceName, id: data.id } as ResourceObject;
  if (table !== undefined) {
    item.attributes = createAttributesItem(data, table.fields);
    item.links = { self: `/${resourceName.toLowerCase()}/${data.id}` };
  }
  return item;
}

function createResourceLinkage(
  resourceName: string,
  data: RelationDataItem,
  table?: Table
) {
  if (Array.isArray(data)) {
    const items = [];
    for (const resource of data) {
      items.push(createResourceObject(resourceName, resource, table));
    }
    return items;
  }
  return createResourceObject(resourceName, data as UnknownDict, table);
}

function createRelatedResource(
  parentURL: string,
  relationName: string,
  data: RelationDataItem,
  table?: Table
) {
  return {
    links: {
      self: `${parentURL}/relationships/${relationName}`,
      related: `${parentURL}/${relationName}`,
    },
    data: createResourceLinkage(relationName, data, table),
  };
}

function addIncludedItems(
  relationName: string,
  data: RelationDataItem,
  included: IncludedMembers
) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const table = mapper.get(relationName)!;
  const relation = createResourceLinkage(relationName, data, table);
  if (Array.isArray(relation)) {
    relation.map((x) => included.add(x));
  } else {
    included.add(relation as ResourceObject);
  }
}

function createRelatedResources(
  parentURL: string,
  data: UnknownDict,
  relations: TableRelations,
  included: IncludedMembers
) {
  const relationships = {} as RelationShips;
  for (const [k, v] of relations) {
    const item = data[k] as RelationDataItem;
    if (data[k] !== undefined && item !== null && !isEmpty(item)) {
      relationships[k] = createRelatedResource(parentURL, v.table, item);
      addIncludedItems(v.table, item, included);
    } else {
      relationships[k] = null;
    }
  }
  return relationships;
}

function createSingleTopLevelResource(
  tableName: string,
  data: UnknownDict,
  table: Table,
  included: IncludedMembers,
  withRelations = true
) {
  const self = createLinkItem(tableName, data.id as string);
  const item = {
    type: tableName,
    id: data.id,
    attributes: createAttributesItem(data, table.fields),
    links: { self: self },
  } as TopLevelResource;
  if (withRelations) {
    item.relationships = createRelatedResources(
      self,
      data,
      table.relations,
      included
    );
  }
  return item;
}

function createTopLevelResource(
  tableName: string,
  data: UnknownDict | UnknownDict[],
  table: Table,
  included: IncludedMembers,
  withRelations = true
) {
  if (Array.isArray(data)) {
    const items: TopLevelResource[] = [];
    for (const resource of data) {
      const item = createSingleTopLevelResource(
        tableName,
        resource,
        table,
        included,
        withRelations
      );
      items.push(item);
    }
    return items;
  }
  return createSingleTopLevelResource(
    tableName,
    data as UnknownDict,
    table,
    included,
    withRelations
  );
}

export function serializePrismaData(
  tableName: string,
  data: UnknownDict | UnknownDict[],
  withRelations = false,
  pagination?: TopLevelLinks,
  meta?: TopLevelMeta
): TopLevelObject {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const table = mapper.get(tableName)!;
  const included: IncludedMembers = new Set();
  const item = {
    jsonapi: { version: "1.0" },
    data: createTopLevelResource(
      tableName,
      data,
      table,
      included,
      withRelations
    ),
    pagination,
    meta,
  } as TopLevelObject;
  if (withRelations) {
    item.included = [...included];
  }
  return item;
}
