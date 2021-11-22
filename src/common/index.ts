import { Token } from "../data/json_api";

export * from "./character";
export * from "./obj";

export function getTokenValue(input: string, token: Token) {
  return input.slice(token.start, token.start + token.length);
}
