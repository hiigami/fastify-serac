import { UnknownDict } from "../data/types";

export function is<A, B>(x: A | B, m: keyof A): x is A {
  return (x as A)[m] !== undefined;
}

export function getPropertyOf<A, B extends keyof A>(p: A, k: B): A[B] {
  return p[k];
}

export function isDict(item: unknown) {
  return (
    typeof item === "object" && item !== null && item.constructor === Object
  );
}

export function isEmpty(item: unknown | unknown[]) {
  if (isDict(item) && Object.keys(item as UnknownDict).length > 0) {
    return false;
  }
  if (Array.isArray(item) && item.length > 0) {
    return false;
  }
  return true;
}

export function removeUndefinedOrEmpty(obj: UnknownDict) {
  const toRemove = [];
  for (const k in obj) {
    if (isDict(obj[k])) {
      if (!isEmpty(obj[k])) {
        obj[k] = removeUndefinedOrEmpty(obj[k] as UnknownDict);
      }
      if (isEmpty(obj[k])) {
        toRemove.push(k);
      }
    }
    if (obj[k] === undefined) {
      toRemove.push(k);
    }
  }
  for (const k of toRemove) {
    delete obj[k];
  }
  return obj;
}

export function merge(...a: UnknownDict[]) {
  const o = {} as UnknownDict;
  for (const x of a) {
    for (const y in x) {
      if (isDict(x[y])) {
        o[y] = merge(o[y] as UnknownDict, x[y] as UnknownDict);
      } else {
        o[y] = x[y];
      }
    }
  }
  return o;
}
