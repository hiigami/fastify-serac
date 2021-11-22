import { UnknownDict } from "../data/types";

export function getAttributes(attributes?: UnknownDict) {
  if (attributes === undefined) {
    return {};
  }
  const attrs: UnknownDict = {};
  for (const name in attributes) {
    attrs[name] = attributes[name];
  }
  return attrs;
}
