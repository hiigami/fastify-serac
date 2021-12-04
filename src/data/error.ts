import { UnknownDict } from "./types";

export interface SeracErrorArgs {
  id?: string;
  code: string;
  detail: string;
  meta?: UnknownDict;
  source?: UnknownDict;
  status: number;
  title: string;
}
