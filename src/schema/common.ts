import { AnySchema, AnyObjectSchema, string as yupString } from "yup";

import { RelationShip } from "../data/json_api";
import { Table } from "../data/prisma";
import { TableFieldArgs, TypeSchemaMapper } from "../data/schema";
import { StrKeyDict } from "../data/types";

export function getTableFieldsSchemas(
  typeToSchema: TypeSchemaMapper,
  table: Table,
  fn: (schema: AnySchema, args: TableFieldArgs) => AnySchema
) {
  const fieldSchemas = {} as StrKeyDict<AnySchema>;
  for (const [k, v] of table.fields) {
    if (v.required !== undefined) {
      const schema = typeToSchema.get(v.type)?.();
      if (schema !== undefined) {
        fieldSchemas[k] = schema;
        fieldSchemas[k] = fn(schema, {
          required: v.required,
          nullable: v.nullable,
        });
      }
    }
  }
  return fieldSchemas;
}

export function relationSchemaCondition(
  tableName: string,
  item: RelationShip,
  schema: AnyObjectSchema,
  isRequired?: boolean
) {
  if (
    isRequired ||
    (item !== undefined && item !== null && item.data !== null)
  ) {
    return schema
      .shape({
        id: yupString().required(),
        type: yupString().oneOf([tableName]).required(),
      })
      .noUnknown()
      .required();
  }
  return schema;
}
