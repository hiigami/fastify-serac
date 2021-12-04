import { removeUndefinedOrEmpty } from "../common";
import { SeracErrorArgs } from "../data/error";
import { Maybe, UnknownDict } from "../data/types";

export class SeracError extends Error {
  protected code: string;
  protected id: Maybe<string>;
  protected meta: Maybe<UnknownDict>;
  protected source: Maybe<UnknownDict>;
  readonly status: number;
  protected title: string;
  constructor(args: SeracErrorArgs) {
    super();
    this.code = args.code;
    this.id = args.id;
    this.meta = args.meta;
    this.name = "SeracError";
    this.message = args.detail;
    this.source = args.source;
    this.status = args.status;
    this.title = args.title;
    Error.captureStackTrace(this, SeracError);
  }
  toJSON() {
    return removeUndefinedOrEmpty({
      code: this.code,
      detail: this.message,
      id: this.id,
      meta: this.meta,
      source: this.source,
      status: this.status.toString(),
      title: this.title,
    });
  }
}
