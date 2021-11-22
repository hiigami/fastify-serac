import * as yup from "yup";

import { Table } from "../data/prisma";
import { TableFieldArgs } from "../data/schema";
import { StrKeyDict } from "../data/types";
import { getTypeToSchema } from "../mapper";
import { getTable } from "../prisma";

import { getTableFieldsSchemas, relationSchemaCondition } from "./common";

function getRelationshipsSchemas(table: Table) {
  const relationships = {} as StrKeyDict<yup.AnySchema>;
  for (const [k, v] of table.relations) {
    const jk = yup
      .object({
        id: yup.string(),
        type: yup.string().oneOf([v.table]),
      })
      .noUnknown()
      .when(`$data.relationships.${k}`, (item, schema) => {
        return relationSchemaCondition(v.table, item, schema, v.required);
      });
    if (v.many) {
      relationships[k] = yup.object({ data: yup.array().of(jk) });
    } else {
      relationships[k] = yup.object({ data: jk.nullable() });
    }
  }
  return yup.object(relationships).noUnknown();
}

function tableFieldFn(schema: yup.AnySchema, args: TableFieldArgs) {
  if (args.nullable) {
    schema = schema.nullable();
  }
  return schema;
}

export function buildPatchSchema(tableName: string) {
  const table = getTable(tableName, true);
  const typeToSchema = getTypeToSchema();
  const fieldSchemas = getTableFieldsSchemas(typeToSchema, table, tableFieldFn);

  const relationshipsSchemas = getRelationshipsSchemas(table);
  return yup
    .object({
      data: yup
        .object({
          id: yup.string().required(),
          type: yup.string().required().oneOf([tableName]).required(),
          attributes: yup.object(fieldSchemas).required().noUnknown(),
          relationships: relationshipsSchemas,
        })
        .required()
        .noUnknown(),
    })
    .required()
    .noUnknown();
}
