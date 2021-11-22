import {
  CreatePayload,
  RelationShip,
  RelationShipData,
  RelationShips,
  ResourceIdentifier,
} from "../data/json_api";
import { UnknownDict } from "../data/types";

import { getAttributes } from "./common";

function getRelation(data: Omit<RelationShipData, "null">) {
  if (Array.isArray(data) && data.length > 0) {
    return { connect: data.map((x) => ({ id: Number(x.id) })) };
  }
  return { connect: { id: Number((data as ResourceIdentifier).id) } };
}

function isRelationDefined(relation: RelationShip | null) {
  if (relation !== null && relation.data !== null) {
    return true;
  }
  return false;
}

function addRelations(query: UnknownDict, relations?: RelationShips) {
  if (relations === undefined) {
    return;
  }
  for (const name in relations) {
    const relation = relations[name];
    if (isRelationDefined(relation)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const data = relation!.data!;
      query[name] = getRelation(data);
    }
  }
}

export function serializePrismaCreateQuery(payload: CreatePayload) {
  const query = getAttributes(payload.data.attributes);
  addRelations(query, payload.data.relationships);
  return { data: query };
}
