import * as yup from "yup";

import { Table } from "../data/prisma";
import { StrKeyDict } from "../data/types";
import { unTitle } from "../common";
import { Dictionary } from "../dictionary";
import { tokenizer } from "../json_api/lexer";
import { parser } from "../json_api/parser";
import { getTable } from "../prisma";

function getIncludeFields(table: Table) {
  return [...table.relations.keys()];
}

function getSortOptions(table: Table) {
  const o = [...table.fields.keys()];
  for (const [k, v] of table.relations) {
    const mm = getTable(v.table);
    for (const k1 of mm.fields.keys()) {
      o.push(`${k}.${k1}`);
    }
  }
  return o;
}

function getSortSchemas(table: Table) {
  const o = getSortOptions(table);
  return yup
    .string()
    .test(
      "can-sort",
      "${path} is not a valid sort value",
      (value, _testContext) => {
        return (
          value !== undefined && o.lastIndexOf(value.replace("-", "")) > -1
        );
      }
    );
}

function getFieldNames(tableName: string, table: Table) {
  const fieldNames = new Dictionary<string[]>();
  const tableNameKey = unTitle(tableName);
  fieldNames.setDefault(tableNameKey, [...table.fields.keys()]);
  for (const [k, v] of table.relations) {
    const mm = getTable(v.table);
    fieldNames.setDefault(k, [...mm.fields.keys()]);
  }
  return fieldNames;
}

function getFieldsSchemas(tableName: string, table: Table) {
  const fieldNames = getFieldNames(tableName, table);
  const fieldSchemas = {} as StrKeyDict<yup.AnySchema>;
  for (const k in fieldNames.entries()) {
    fieldSchemas[k] = yup.array().of(yup.string().oneOf(fieldNames.get(k)));
  }
  return fieldSchemas;
}

function getFiltersSchema(tableName: string, table: Table) {
  const fieldNames = getFieldNames(tableName, table);
  const fieldSchemas = {} as StrKeyDict<yup.AnySchema>;
  for (const k in fieldNames.entries()) {
    fieldSchemas[k] = yup
      .string()
      .test(
        "is-filter",
        "${path} is not a valid filter value",
        (value, _testContext) => {
          if (value !== undefined) {
            try {
              const tokens = tokenizer(value, new Set(fieldNames.get(k)));
              return parser(tokens);
            } catch (e) {
              return false;
            }
          }
          return true;
        }
      );
  }
  return fieldSchemas;
}

export function buildQueryParametersSchema(tableName: string) {
  const table = getTable(tableName);
  return yup
    .object({
      include: yup.array().of(yup.string().oneOf(getIncludeFields(table))),
      fields: yup.object(getFieldsSchemas(tableName, table)).noUnknown(),
      filter: yup.object(getFiltersSchema(tableName, table)).noUnknown(),
      sort: yup.array().of(getSortSchemas(table)),
      page: yup.object({
        number: yup.number().integer().moreThan(-1).default(0),
        size: yup.number().integer().moreThan(-1).default(10),
      }),
    })
    .noUnknown();
}
