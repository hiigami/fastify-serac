import { TokenType } from "../data/enumeration";
import { Token } from "../data/json_api";
import { Field, FieldType } from "../data/prisma";
import { getTokenValue } from "../common";
import { QueryItem } from "../data/serializer";

function toType(x: string, t: FieldType) {
  if (t.name.toLowerCase() === "boolean") {
    return x.toLowerCase() === "true";
  }
  if (t.name.toLowerCase() === "number") {
    return +x;
  }
  if (t.name.toLowerCase() === "date") {
    return new Date(x);
  }
  return x;
}

function generateOperator(
  input: string,
  tokens: Token[],
  mapper: Map<string, Field>
): QueryItem {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const operator = getTokenValue(input, tokens.shift()!);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const literal = getTokenValue(input, tokens.shift()!);
  const getType = mapper.get(literal)?.type;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const value = tokens.map((x) => toType(getTokenValue(input, x), getType!));
  return { [literal]: { [operator]: value.length > 1 ? value : value[0] } };
}

function generateConditional(
  input: string,
  token: Token,
  items: QueryItem[]
): QueryItem {
  const conditional = getTokenValue(input, token).toUpperCase();
  if (["AND", "OR"].indexOf(conditional) > -1) {
    return { [conditional]: [...items] };
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return { [conditional]: items.shift()! };
}

function generateRelationConditional(
  input: string,
  token: Token,
  item: QueryItem
): QueryItem {
  const conditional = getTokenValue(input, token);
  return { [conditional]: item };
}
function getStringTokens(tokens: Token[]): Token[] {
  const items = [];
  while (tokens.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const t = tokens.shift()!;
    if (t.type === TokenType.R_PAREN) {
      break;
    }
    if ([TokenType.String, TokenType.Literal].indexOf(t.type) > -1) {
      items.push(t);
    }
  }
  return items;
}

export function serializeFilter(
  input: string,
  tokens: Token[],
  mapper: Map<string, Field>
) {
  const stack: Token[] = [];
  let stackQ: QueryItem[] = [];
  while (tokens.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const c = tokens.shift()!;
    if (
      [TokenType.Condition, TokenType.R_Condition].indexOf(c.type) > -1 ||
      (TokenType.Negate === c.type &&
        tokens.length > 2 &&
        [TokenType.AnyOperator, TokenType.Operator, TokenType.Negate].indexOf(
          tokens[1].type
        ) > -1)
    ) {
      stack.push(c);
    } else if (
      [TokenType.AnyOperator, TokenType.Operator].indexOf(c.type) > -1 ||
      (TokenType.Negate === c.type &&
        tokens.length > 2 &&
        tokens[1].type === TokenType.Literal)
    ) {
      const strTokens = getStringTokens(tokens);
      strTokens.unshift(c);
      const item = generateOperator(input, strTokens, mapper);
      stackQ.push(item);
    } else if (TokenType.R_PAREN === c.type) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const token = stack.pop()!;
      let item;
      if (token.type === TokenType.R_Condition) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        item = generateRelationConditional(input, token, stackQ.pop()!);
      } else {
        item = generateConditional(input, token, stackQ);
      }
      if (
        [TokenType.Negate, TokenType.R_Condition].indexOf(token.type) === -1
      ) {
        stackQ = [];
      }
      stackQ.push(item);
    }
  }
  return stackQ[0];
}
