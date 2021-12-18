import { PrismaClient } from "@prisma/client";

import { getPropertyOf, unTitle } from "../common";

export function getPrismaProperty(tableName: string, prisma: PrismaClient) {
  const propertyName = unTitle(tableName) as keyof PrismaClient;
  const property = getPropertyOf(prisma, propertyName);
  return property as ReturnType<typeof getPropertyOf>;
}
