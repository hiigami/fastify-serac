import { PrismaClient } from "@prisma/client";

import { Table, TableFields, TableRelations } from "../data/prisma";
import { serializers } from "../mapper/serializer";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { mapper } from "./tables";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

type TableItems = TableRelations | TableFields;

function removeFromSerializer<T extends TableItems>(
  forWrites: boolean,
  tableName: string,
  items: Map<string, unknown>
) {
  const serializer = serializers.get(tableName);
  if (serializer === undefined) {
    return items;
  }
  const keys = new Set(serializer.exclude);
  if (!forWrites) {
    serializer.writeOnly?.forEach((x) => keys.add(x));
  }
  const m = new Map(items);
  for (const k of m.keys()) {
    if (keys.has(k)) {
      m.delete(k);
    }
  }
  return m as T;
}

export function getTable(tableName: string, forWrites = false) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const table = mapper.get(tableName)!;
  return {
    identifier: table.identifier,
    fields: removeFromSerializer(forWrites, tableName, table.fields),
    relations: removeFromSerializer(forWrites, tableName, table.relations),
  } as Table;
}
