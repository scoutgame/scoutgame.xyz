/**
 * Sort an array of objects by a property. Include an optional valuesOrder for looking up the order of a certain value
 */
export function sortArrayByObjectProperty<T = object>(
  data: readonly T[],
  propertyKey: keyof T,
  valuesOrder?: any[]
): T[] {
  const sortedData = [...data].sort((first, second) => {
    let firstPropertyValueIndex = valuesOrder ? valuesOrder.indexOf(first[propertyKey]) : first[propertyKey];
    if (firstPropertyValueIndex === -1) {
      firstPropertyValueIndex = valuesOrder ? valuesOrder.length : data.length;
    }

    let secondPropertyValueIndex = valuesOrder ? valuesOrder.indexOf(second[propertyKey]) : second[propertyKey];
    if (secondPropertyValueIndex === -1) {
      secondPropertyValueIndex = valuesOrder ? valuesOrder.length : data.length;
    }

    // Handle
    if (firstPropertyValueIndex < secondPropertyValueIndex) {
      return -1;
    } else if (firstPropertyValueIndex > secondPropertyValueIndex) {
      return 1;
    } else {
      return 0;
    }
  });

  return sortedData;
}

export function uniqueValues<T = any>(values: T[]): T[] {
  return Array.from(new Set(values));
}

export function uniqueValuesBy<T = Record<string, any>>(values: T[], key: keyof T): T[] {
  return Array.from(new Set(values.map((value) => value[key]))) as T[];
}

// Flattens an object with list of arrays to a single list
export function flatArrayMap<T>(obj: { [key: string]: T[] }): T[] {
  return Object.keys(obj).reduce((list, key) => {
    list.push(...(obj[key] as any));
    return list;
  }, [] as T[]);
}

export function partition<T>(collection: T[], predicate: (value: T, key: number, collection: T[]) => boolean) {
  return collection.reduce<[T[], T[]]>(
    (result, value, key) => {
      (predicate(value, key, collection) ? result[0] : result[1]).push(value);
      return result;
    },
    [[], []]
  );
}
