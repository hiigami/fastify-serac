import {
  PatchPayload,
  RelationShipData,
  RelationShips,
  ResourceIdentifier,
} from "../data/json_api";
import { UnknownDict } from "../data/types";
import { getAttributes } from "./common";

function _getRelation(data: Omit<RelationShipData, "null">) {
  if (Array.isArray(data)) {
    if (data.length > 0) {
      return { connect: data.map((x) => ({ id: Number(x.id) })) };
    }
    return { deleteMany: {} };
  }
  return { connect: { id: Number((data as ResourceIdentifier).id) } };
}

function getRelation(data: RelationShipData) {
  if (data === null) {
    return { disconnect: true };
  }
  return _getRelation(data);
}

function addRelations(query: UnknownDict, relations?: RelationShips) {
  if (relations === undefined) {
    return;
  }
  for (const name in relations) {
    const relation = relations[name];
    if (relation !== undefined && relation?.data !== undefined) {
      query[name] = getRelation(relation.data);
    }
  }
}

export function serializePrismaPatchQuery(payload: PatchPayload) {
  const query = getAttributes(payload.data.attributes);
  addRelations(query, payload.data.relationships);
  return {
    select: { id: true },
    where: { id: Number(payload.data.id) },
    data: query,
  };
}
