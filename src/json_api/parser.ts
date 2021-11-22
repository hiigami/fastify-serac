import { Token } from "../data/json_api";
import { getQueryParamsGrammar } from "../mapper";

function ggg(i: number, state: string, tokens: Token[]): [boolean, number] {
  const node = getQueryParamsGrammar.get(state);
  if (node === undefined) {
    return [false, -1];
  }
  if (typeof node[0] === "string") {
    return ggg2(i, node as string[], tokens);
  } else if (tokens[i] !== undefined && node[0] === tokens[i].type) {
    return [true, i + 1];
  }
  return [false, i];
}

function ggg3(i: number, node: string[], tokens: Token[]): [boolean, number] {
  let flag = false;
  let ii = i;
  for (const x of node) {
    [flag, ii] = ggg(ii, x, tokens);
    if (!flag) {
      break;
    }
  }
  return [flag, flag ? ii : i];
}

function ggg2(i: number, node: string[], tokens: Token[]): [boolean, number] {
  for (const x of node) {
    const r = ggg3(i, x.split(""), tokens);
    if (r[0]) {
      return r;
    }
  }
  return [false, i];
}

export function parser(tokens: Token[]) {
  return ggg(0, "S", tokens)[0];
}
