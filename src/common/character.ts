export function asTitle(s: string): Capitalize<string> {
  return `${s.charAt(0).toUpperCase()}${s.slice(1)}`;
}

export function unTitle(s: string): Capitalize<string> {
  return `${s.charAt(0).toLowerCase()}${s.slice(1)}`;
}
