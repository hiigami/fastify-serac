import { AnySchema } from "yup";
import { FieldType } from "./prisma";

export type SchemaCreatFn = () => AnySchema;
export type TypeSchemaMapper = Map<FieldType, SchemaCreatFn>;

export interface TableFieldArgs {
  required?: boolean;
  nullable?: boolean;
}
