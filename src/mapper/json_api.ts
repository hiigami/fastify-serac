import { TokenType } from "../data/enumeration";

export const getQueryParamsGrammar = new Map([
  ["S", ["Z"]],
  ["Z", ["V", "BCYE", "A"]],
  ["Y", ["AHA", "X"]],
  ["X", ["VHX", "V"]],
  ["V", ["QCAE"]],
  ["A", ["BCDE", "D"]],
  ["B", [TokenType.Condition]],
  ["C", [TokenType.L_PAREN]],
  ["D", ["FHD", "GHD", "F", "G"]],
  ["E", [TokenType.R_PAREN]],
  ["F", ["ICGE", "ICKHLE"]],
  ["G", ["JCKHLE", "MCKHNE"]],
  ["H", [TokenType.Comma]],
  ["I", [TokenType.Negate]],
  ["J", [TokenType.Operator]],
  ["K", [TokenType.Literal]],
  ["L", ["OPO"]],
  ["M", [TokenType.AnyOperator]],
  ["N", ["LHN", "L"]],
  ["O", [TokenType.S_QUOTE]],
  ["P", [TokenType.String]],
  ["Q", [TokenType.R_Condition]],
]);

export function getLexerKeywords() {
  return new Map([
    ["in", TokenType.AnyOperator],
    [",", TokenType.Comma],
    ["and", TokenType.Condition],
    ["or", TokenType.Condition],
    ["(", TokenType.L_PAREN],
    ["not", TokenType.Negate],
    ["equals", TokenType.Operator],
    ["lte", TokenType.Operator],
    ["lt", TokenType.Operator],
    ["gte", TokenType.Operator],
    ["gt", TokenType.Operator],
    ["contains", TokenType.Operator],
    ["startsWith", TokenType.Operator],
    ["endsWith", TokenType.Operator],
    ["every", TokenType.R_Condition],
    ["some", TokenType.R_Condition],
    ["none", TokenType.R_Condition],
    [")", TokenType.R_PAREN],
    ["'", TokenType.S_QUOTE],
  ]);
}

export function getLexerLiteralRules() {
  return new Map([
    [TokenType.L_PAREN, { re: /([a-z0-9]+),/i, type: TokenType.Literal }],
    [TokenType.S_QUOTE, { re: /([^']+)'/i, type: TokenType.String }],
  ]);
}
