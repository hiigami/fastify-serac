import { UnknownDict } from "./types";

export type FieldType =
  | NumberConstructor
  | BooleanConstructor
  | StringConstructor
  | DateConstructor;

export interface Field {
  required?: boolean;
  type: FieldType;
  nullable: boolean;
}

export interface Relation {
  table: string;
  required?: boolean;
  many: boolean;
}

export interface Identifier {
  name: string;
  mapsTo: string[];
}

export type TableFields = Map<string, Field>;
export type TableRelations = Map<string, Relation>;

export interface Table {
  identifier: Identifier;
  fields: TableFields;
  relations: TableRelations;
}

export interface PrismaQuery {
  orderBy?: UnknownDict;
  select?: UnknownDict;
  skip?: number;
  take?: number;
  where: UnknownDict;
}

export interface PrismaCreate {
  data: UnknownDict;
}

export interface PrismaUpsert extends PrismaCreate {
  select?: UnknownDict;
  where: UnknownDict;
}
