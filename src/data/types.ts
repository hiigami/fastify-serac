export type DictKey = string | number | symbol;
export type Dict<A extends DictKey, B> = Record<A, B>;
export type Maybe<T> = T | undefined;
export type Nullable<T> = T | null;
export type StrKeyDict<T> = Dict<string, T>;
export type Tuple<A, B> = [A, B];
export type UnknownDict = Dict<string, unknown>;
