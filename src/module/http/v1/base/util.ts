import { WebException } from '@/utils/exception';

const CURSOR_SEPARATOR = '_';

export const decomposeCursor = <T extends readonly ('string' | 'number')[]>(
  cursor: string,
  ...types: T
): { [I in keyof T]: T[I] extends 'string' ? string : number } => {
  const strs = cursor.split(CURSOR_SEPARATOR);
  if (strs.length !== types.length) {
    throw new WebException(
      `invalid cursor. Expected "${types.join(
        CURSOR_SEPARATOR,
      )}", got "${cursor}"`,
    );
  }

  return strs.map((str, i) => {
    if (types[i] === 'string') {
      return str;
    } else if (types[i] === 'number') {
      return Number(str);
    } else {
      throw new WebException(
        `Invalid cursor. Expected ${types[i]} for sub-cursor ${str}. Is the whole cursor "${cursor}" valid?`,
      );
    }
  }) as any;
};

export const composeCursor = (...args: any[]): string => {
  return args.join(CURSOR_SEPARATOR);
};

export const getListAndCursor = <T>(
  list: T[],
  limit: number,
  cursorKeys: (keyof T)[],
): {
  list: T[];
  cursor: string | null;
} => {
  if (list.length <= limit) {
    return {
      list,
      cursor: null,
    };
  }

  const lastElement = list.pop();
  const cursor = lastElement
    ? composeCursor(...cursorKeys.map((key) => lastElement[key]))
    : null;

  return {
    list,
    cursor,
  };
};

export const capitalizeFirstLetter = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
