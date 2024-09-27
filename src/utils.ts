import { readFileSync } from "fs";

export const readJsonFile = <T>(path: string): T => {
    return JSON.parse(readFileSync(path, "utf-8"));
};

export function castToEnum<T>(enumObj: T, value: string): T[keyof T] | undefined {
    // check if value exists in an enum
    if (Object.values(enumObj).includes(value as T[keyof T])) {
        return value as T[keyof T]
    }
    return undefined
}