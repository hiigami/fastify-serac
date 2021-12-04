import { Dictionary } from "../dictionary";
import { SeracError } from "./serac_error";

export class SeracAggregateError extends Error {
  private errors: SeracError[];
  constructor(error: SeracError, ...errors: SeracError[]) {
    super();
    this.name = "SeracAggregateError";
    this.errors = [error, ...errors];
    Error.captureStackTrace(this, SeracAggregateError);
  }
  get status() {
    const counter = new Dictionary<number>();
    const uniqueStatus = new Dictionary<Set<number>>();
    for (const e of this.errors) {
      const key = e.status.toString().charAt(0);
      counter.setDefault(key, 0);
      counter.add(key, counter.get(key) + 1);
      uniqueStatus.setDefault(key, new Set());
      uniqueStatus.get(key).add(e.status);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [statusKey, _] = Object.entries(counter.entries()).sort(
      ([, a], [, b]) => b - a
    )[0];
    if (uniqueStatus.get(statusKey).size > 1) {
      return Number(`${statusKey}00`);
    }
    return [...uniqueStatus.get(statusKey)][0];
  }
  toJSON() {
    return this.errors.map((x) => x.toJSON());
  }
}
