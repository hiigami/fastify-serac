type DictItems<T> = { [key: string]: T };
export class Dictionary<T> {
  private items: DictItems<T>;
  constructor() {
    this.items = {};
  }
  setDefault(key: string, defaults: T) {
    if (!(key in this.items)) {
      this.add(key, defaults);
    }
  }
  add(key: string, value: T) {
    this.items[key] = value;
  }
  get(key: string) {
    return this.items[key];
  }
  entries() {
    const o: DictItems<T> = {};
    for (const x in this.items) {
      if (this.items[x] instanceof Dictionary) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        o[x] = this.items[x].entries();
      } else {
        o[x] = this.items[x];
      }
    }
    return o;
  }
}
