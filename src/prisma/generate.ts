import { exec } from "child_process";
import fs from "fs";
import { join } from "path";
import ts from "typescript";
import util from "util";

import { is, unTitle } from "../common";
import { Identifier } from "../data/prisma";

interface FieldItem {
  type: string;
  required?: boolean;
  nullable?: boolean;
  many?: boolean;
  table?: string;
}

interface CompoundItem {
  table: string;
  name: string;
}

type FieldMap = Map<string, FieldItem>;
type TableMap = Map<string, FieldMap>;
type CompoundMap = Map<string, CompoundItem>;
type IdentifiersMap = Map<string, Identifier>;

function getMembers(node: ts.TypeAliasDeclaration) {
  return (node.type as ts.ObjectTypeDeclaration).members;
}

function isAliasDeclarationWithMembers(node: ts.Node) {
  if (ts.isTypeAliasDeclaration(node)) {
    const members = getMembers(node);
    return members !== undefined && members.length > 0;
  }
  return false;
}

function getNodeName<T extends ts.NamedDeclaration>(node: T): string {
  return (node.name as ts.Identifier).escapedText.toString();
}

function getIdentifierName<T extends ts.Identifier>(node: T): string {
  return node.escapedText.toString();
}

function getSignatureKindName<T extends ts.SignatureDeclaration>(node: T) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return ts.SyntaxKind[node.type!.kind].replace("Keyword", "");
}

function getLiteralKindName<T extends ts.LiteralTypeNode>(node: T) {
  return ts.SyntaxKind[node.literal.kind].replace("Keyword", "");
}

function getNodeKindName<T extends ts.Node>(node: T) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return ts.SyntaxKind[node.kind].replace("Keyword", "");
}

function getTypesFromUnionNode(node: ts.UnionTypeNode) {
  const typeNames = [];
  let isNull = false;
  for (const n of node.types) {
    if (ts.isLiteralTypeNode(n)) {
      const typeName = getLiteralKindName(n);
      if (typeName === "Null") {
        isNull = true;
      } else {
        typeNames.push(typeName);
      }
    } else if (ts.isTypeReferenceNode(n)) {
      if (ts.isIdentifier(n.typeName)) {
        const _identifierName = getIdentifierName(n.typeName as ts.Identifier);
        typeNames.push(_identifierName);
      }
    } else {
      typeNames.push(getNodeKindName(n));
    }
  }
  return {
    type: typeNames.join("|"),
    nullable: isNull,
  };
}

function getTables(members: ts.NodeArray<ts.TypeElement>) {
  const fields: FieldMap = new Map();
  for (const node of members) {
    const name = getNodeName(node);
    const signature = node as ts.SignatureDeclaration;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const _type = signature.type!;
    if (ts.isTypeReferenceNode(_type)) {
      if (ts.isQualifiedName(_type.typeName)) {
        const _identifierName = getIdentifierName(
          _type.typeName.right as ts.Identifier
        );
        if (_identifierName === "JsonValue") {
          fields.set(name, {
            type: "Object",
          });
        }
      } else {
        fields.set(name, {
          type: getIdentifierName(_type.typeName as ts.Identifier),
        });
      }
    } else if (ts.isUnionTypeNode(_type)) {
      fields.set(name, getTypesFromUnionNode(_type));
    } else {
      fields.set(name, { type: getSignatureKindName(signature) });
    }
  }
  return fields;
}

function getInitialDefinition(node: ts.SourceFile, exclude?: Set<string>) {
  let prismaNode: ts.NodeArray<ts.Statement> | undefined = undefined;
  const tables: TableMap = new Map();
  const identifiers: IdentifiersMap = new Map();
  node.forEachChild((child) => {
    if (isAliasDeclarationWithMembers(child)) {
      const node = child as ts.TypeAliasDeclaration;
      const name = getNodeName(node);
      if (!exclude?.has(name)) {
        const members = getMembers(node);
        const fields = getTables(members as ts.NodeArray<ts.TypeElement>);
        if (fields.has("id")) {
          identifiers.set(name, { name: "id", mapsTo: ["id"] });
        }
        tables.set(name, fields);
      }
    } else if (
      is<ts.ModuleDeclaration, ts.Node>(child, "name") &&
      getNodeName(child) === "Prisma"
    ) {
      prismaNode = (child.body as ts.ModuleBlock).statements;
    }
  });
  return {
    identifiers,
    prismaNode: prismaNode as unknown as ts.NodeArray<ts.Statement>,
    tables,
  };
}

function getItemFromNode<A, B>(
  removeTxt: string,
  node: ts.TypeAliasDeclaration,
  tables: Map<A, B>
) {
  const name = getNodeName(node).replace(removeTxt, "") as unknown as A;
  return tables.get(name);
}

function setOptionalAndRelations(
  node: ts.TypeAliasDeclaration,
  tables: TableMap
) {
  const table = getItemFromNode("CreateInput", node, tables);
  if (table !== undefined) {
    const members = getMembers(node);
    for (const member of members) {
      const memberName = getNodeName(member);
      const required = (member as ts.TypeElement).questionToken === undefined;
      if (table.has(memberName)) {
        const field: FieldItem = {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          ...table.get(memberName)!,
          required,
        };
        table.set(memberName, field);
      } else {
        table.set(memberName, { type: "Relation", required });
      }
    }
  }
}

function getCompoundDeclaration(prop: ts.PropertySignature) {
  if (prop.type !== undefined && ts.isTypeReferenceNode(prop.type)) {
    const name = getIdentifierName(prop.type.typeName as ts.Identifier);
    return name.indexOf("CompoundUniqueInput") === -1 ? undefined : name;
  }
  return undefined;
}

function setCompoundDeclarations(
  node: ts.TypeAliasDeclaration,
  compounds: CompoundMap,
  tables: TableMap
) {
  const table = getItemFromNode("WhereUniqueInput", node, tables);
  if (table !== undefined) {
    const members = getMembers(node);
    const tableName = getNodeName(node).replace("WhereUniqueInput", "");
    for (const member of members) {
      const compoundName = getCompoundDeclaration(
        member as ts.PropertySignature
      );
      if (compoundName !== undefined) {
        compounds.set(compoundName, {
          table: tableName,
          name: getNodeName(member as ts.PropertySignature),
        });
        break;
      }
    }
  }
}

function getCompounds(
  tables: TableMap,
  prismaNode: ts.NodeArray<ts.Statement>
) {
  const compounds: CompoundMap = new Map();
  for (const child of prismaNode) {
    if (isAliasDeclarationWithMembers(child)) {
      setOptionalAndRelations(child as ts.TypeAliasDeclaration, tables);
      setCompoundDeclarations(
        child as ts.TypeAliasDeclaration,
        compounds,
        tables
      );
    }
  }
  return compounds;
}

function isMemberARelation(name: string, table: FieldMap) {
  if (table.get(name)?.type === "Relation" && name.lastIndexOf("_") === -1) {
    return true;
  }
  return false;
}

function _addRelationsDetails(
  fieldName: string,
  node: ts.Node,
  table: FieldMap,
  exclude?: Set<string>
) {
  const unionNode = (node as ts.PropertySignature).type as ts.UnionTypeNode;
  for (const n of unionNode.types) {
    if (ts.isTypeReferenceNode(n)) {
      const name = getIdentifierName(n.typeName as ts.Identifier);
      const many = name.indexOf("FindManyArgs") > -1 ? true : false;
      const fixedName = name.replace(/FindManyArgs|Args/, "");
      if (!exclude?.has(fixedName)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const item = { ...table.get(fieldName)!, table: fixedName, many };
        table.set(fieldName, item);
      } else {
        table.delete(fieldName);
      }
    }
  }
}

function addRelationsDetails(
  node: ts.TypeAliasDeclaration,
  tables: TableMap,
  exclude?: Set<string>
) {
  const table = getItemFromNode("Select", node, tables);
  if (table !== undefined) {
    const members = getMembers(node);
    for (const member of members) {
      const memberName = getNodeName(member);
      if (isMemberARelation(memberName, table)) {
        _addRelationsDetails(memberName, member, table, exclude);
      }
    }
  }
}

function addIdentifiers(
  node: ts.TypeAliasDeclaration,
  compounds: CompoundMap,
  identifiers: IdentifiersMap,
  tables: TableMap
) {
  const compound = getItemFromNode("", node, compounds);
  if (compound !== undefined) {
    const table = tables.get(compound.table);
    if (identifiers.has(compound.table)) {
      return;
    }
    const names = [];
    const members = getMembers(node);
    for (const member of members) {
      const memberName = getNodeName(member);
      if (table?.has(memberName)) {
        names.push(memberName);
      }
    }
    identifiers.set(compound.table, { name: compound.name, mapsTo: names });
  }
}

function setRelationsDetailsAndMissingIdentifiers(
  compounds: CompoundMap,
  identifiers: IdentifiersMap,
  tables: TableMap,
  prismaNode: ts.NodeArray<ts.Statement>,
  exclude?: Set<string>
) {
  for (const child of prismaNode) {
    if (isAliasDeclarationWithMembers(child)) {
      addRelationsDetails(child as ts.TypeAliasDeclaration, tables, exclude);
      addIdentifiers(
        child as ts.TypeAliasDeclaration,
        compounds,
        identifiers,
        tables
      );
    }
  }
}

function getTablesDetails(path: string, exclude?: Set<string>) {
  const node = ts.createSourceFile(
    "x.ts",
    fs.readFileSync(
      join(path, "./node_modules/.prisma/client/index.d.ts"),
      "utf8"
    ),
    ts.ScriptTarget.Latest
  );
  const { identifiers, prismaNode, tables } = getInitialDefinition(
    node,
    exclude
  );
  const compounds = getCompounds(tables, prismaNode);
  setRelationsDetailsAndMissingIdentifiers(
    compounds,
    identifiers,
    tables,
    prismaNode,
    exclude
  );
  return {
    identifiers,
    tables,
  };
}

function buildTableDefinition(table: FieldMap) {
  const fields = [];
  const relations = [];
  for (const [k, v] of table) {
    if (v.type === "Relation") {
      relations.push(
        `['${k}', { table: '${v.table}', required: ${v.required}, many: ${v.many}}],`
      );
    } else {
      const isNullable = typeof v.nullable === "undefined" ? false : v.nullable;
      fields.push(
        `['${k}', { type: ${v.type}, required: ${v.required}, nullable: ${isNullable}}],`
      );
    }
  }
  const fieldsDef = fields.join("").slice(0, -1);
  const relationsDef = relations.join("").slice(0, -1);
  return (
    `fields: new Map<string, Field>([${fieldsDef}]),` +
    `relations: new Map<string, Relation>([${relationsDef}])`
  );
}

function createDefinition(identifiers: IdentifiersMap, tables: TableMap) {
  const prismaKeys = [...tables.keys()].map((x) => `'${unTitle(x)}'`).join("|");
  const stack = [
    "import { PrismaClient } from '.prisma/client';",
    "import {Field, Relation, Table} from '../data/prisma';",
    `export type PrismaKeys = Pick<PrismaClient, ${prismaKeys} >;`,
    "export const mapper = new Map<string, Table>([",
  ];
  for (const [k, v] of tables) {
    const tableDef = buildTableDefinition(v);
    const identifierDef = JSON.stringify(identifiers.get(k));
    stack.push(`['${k}', {`, `identifier: ${identifierDef},`);
    stack.push(tableDef);
    stack.push(",}],");
  }
  stack.push("]);");
  return stack;
}

async function formatTableFile(path: string) {
  const promisify_exec = util.promisify(exec);
  return await promisify_exec(
    `npx prettier --with-node-modules --write ${path}`
  );
}

function printSuccessMessage(tableFilePath: string) {
  console.log();
  console.log(`Generated table mapper for blueprint to ${tableFilePath}`);
  console.log(`You can now start using Fastify-Serac plugin in your code.`);
}

export async function build(path: string, exclude?: Set<string>) {
  const { identifiers, tables } = getTablesDetails(path, exclude);
  const data = createDefinition(identifiers, tables);
  const _path = join(path, "node_modules/fastify-serac/lib/prisma/tables.ts");
  fs.writeFileSync(_path, data.join(""));
  const program = ts.createProgram([_path], {
    strict: true,
    esModuleInterop: true,
    declaration: true,
    target: ts.ScriptTarget.ES2015,
    module: ts.ModuleKind.CommonJS,
  });
  program.emit();
  fs.unlinkSync(_path);
  const tableFilePath = _path.replace(".ts", ".js");
  try {
    await formatTableFile(tableFilePath);
  } catch (error) {
    console.log();
    console.warn(`Couldn't format file ${tableFilePath}`);
  }
  printSuccessMessage(tableFilePath);
  return;
}
