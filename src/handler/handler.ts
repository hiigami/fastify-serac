export abstract class Handler<A, B> {
  abstract canHandle(t: A): boolean;
  abstract handle(t: A, ...args: unknown[]): B;
}
