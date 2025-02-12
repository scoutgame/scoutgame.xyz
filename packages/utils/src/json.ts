// supports bigint serialization
export function toJson(data: any): string | undefined {
  if (data !== undefined) {
    return JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? `${v}#bigint` : v)).replace(
      /"(-?\d+)#bigint"/g,
      (_, a) => a
    );
  }
}
