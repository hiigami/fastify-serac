import { StrKeyDict } from "../data/types";
import { Dictionary } from "../dictionary";

type QueryParamsDictType = string | string[] | number;
type QueryParamsDictItem = Dictionary<QueryParamsDictType>;
type QueryParamsDict = Dictionary<QueryParamsDictItem | string[]>;
type setterFn = (x: string | string[]) => QueryParamsDictType;

function hasParameter<T extends string>(x: T | T[], k: T): boolean {
  return x.indexOf(k) > -1;
}

function getKeyFromParameter(x: string, k: string): string {
  return x.replace(`${k}[`, "").replace("]", "");
}

const splitTxt = (y: string | string[]) => (y as string).split(",");

function setParameter(
  key: string,
  value: string | string[],
  paramTypeName: string,
  r: QueryParamsDict,
  fn: setterFn
) {
  if (hasParameter(key, paramTypeName)) {
    const k1 = getKeyFromParameter(key, paramTypeName);
    const item = fn(value);
    if (["sort", "include"].lastIndexOf(paramTypeName) === -1) {
      r.setDefault(paramTypeName, new Dictionary<typeof item>());
      const queryParamsDict = r.get(paramTypeName) as QueryParamsDictItem;
      queryParamsDict.add(k1, item);
    } else {
      r.add(paramTypeName, item as string[]);
    }
    return true;
  }
  return false;
}

export function serializeQueryParameters(item: StrKeyDict<string>) {
  const queryParameters = new Dictionary<QueryParamsDictItem | string[]>();
  const setters = new Map<string, setterFn>([
    ["page", (y) => Number.parseInt(y as string)],
    ["fields", splitTxt],
    ["filter", (y) => y],
    ["sort", splitTxt],
    ["include", splitTxt],
  ]);
  for (const x in item) {
    for (const [k, v] of setters) {
      if (setParameter(x, item[x], k, queryParameters, v)) {
        break;
      }
    }
  }
  return queryParameters.entries();
}
