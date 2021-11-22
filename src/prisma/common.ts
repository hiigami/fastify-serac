import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";

import { unTitle, getPropertyOf, is } from "../common";

export function getPrismaProperty(tableName: string, prisma: PrismaClient) {
  const propertyName = unTitle(tableName) as keyof PrismaClient;
  const property = getPropertyOf(prisma, propertyName);
  return property as ReturnType<typeof getPropertyOf>;
}

export function getPrismaErrorCode(e: unknown) {
  if (is<PrismaClientKnownRequestError, Error>(e as Error, "code")) {
    return (e as PrismaClientKnownRequestError).code;
  }
  return undefined;
}
