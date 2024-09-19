import { readFileSync } from "fs";

export const readJsonFile = <T>(path: string): T => {
    return JSON.parse(readFileSync(path, "utf-8"));
};