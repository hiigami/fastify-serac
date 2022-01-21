import * as yup from "yup";

import { FieldType } from "../data/prisma";
import { SchemaCreatFn } from "../data/schema";

export function getTypeToSchema() {
  return new Map<FieldType, SchemaCreatFn>([
    [Number, yup.number],
    [String, yup.string],
    [Boolean, yup.boolean],
    [Date, yup.date],
    [Object, yup.object],
  ]);
}
