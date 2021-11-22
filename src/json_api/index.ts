import { getPrismaCodeToStatusCode } from "../mapper";

export function prismaErrorCodeToStatusCode(code?: string) {
  if (code === undefined) {
    return undefined;
  }
  return getPrismaCodeToStatusCode().get(code);
}
