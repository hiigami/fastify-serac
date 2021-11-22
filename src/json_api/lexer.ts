import { TokenType } from "../data/enumeration";
import { Token } from "../data/json_api";
import { getTokenValue } from "../common";
import { getLexerKeywords, getLexerLiteralRules } from "../mapper";

function createToken(type: TokenType, start: number, length = 1): Token {
  return {
    type,
    start,
    length,
  };
}

function lookaheadString(
  str: string,
  currentPosition: number,
  input: string
): boolean {
  const parts = str.split("");
  for (let i = 0; i < parts.length; i++) {
    if (input[currentPosition + i] !== parts[i]) {
      return false;
    }
  }
  return true;
}
function lookaheadRegExp(
  re: RegExp,
  currentPosition: number,
  input: string,
  tokenType: TokenType
) {
  const m = input.slice(currentPosition).match(re);
  if (m) {
    return createToken(tokenType, currentPosition, m[1].length);
  }
  return undefined;
}

export function tokenizer(input: string, literals?: Set<string>): Token[] {
  const out: Token[] = [];
  let currentPosition = 0;
  const keywords = getLexerKeywords();
  const literalRules = getLexerLiteralRules();
  while (currentPosition < input.length) {
    let didMatch = false;

    for (const [k, v] of keywords) {
      if (lookaheadString(k, currentPosition, input)) {
        out.push(createToken(v, currentPosition, k.length));
        currentPosition += k.length;
        didMatch = true;
        break;
      }
    }

    if (didMatch) continue;
    const last = out[out.length - 1].type;
    for (const [k, v] of literalRules) {
      if (last === k) {
        const t = lookaheadRegExp(v.re, currentPosition, input, v.type);
        if (t !== undefined) {
          if (
            t.type === TokenType.Literal &&
            literals !== undefined &&
            !literals.has(getTokenValue(input, t))
          ) {
            break;
          }
          out.push(t);
          currentPosition += t.length;
          didMatch = true;
        }
      }
    }
    if (didMatch) continue;
    throw new Error(`Unknown input character: ${input[currentPosition]}`);
  }
  return out;
}
