import { resolve } from "path";

/**
 * Default values
 */


/**
 * package.json
 */
export type PackageJson = {
    name: string;
    displayName: string;
    version: string;
};

/**
 * config/config.json
 */
export type Config = {
    enabled?: boolean;
    debug?: boolean;
    loggerPrefix: string;
};

export const PACKAGE_JSON_PATH = resolve(__dirname, "..", "package.json");
export const CONFIG_PATH = resolve(__dirname, "..", "config/config.json");