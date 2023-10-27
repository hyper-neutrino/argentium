import { SlashUtil } from "./slash-util.ts";

export type Extend<T, U, K extends string, R extends boolean, V> = SlashUtil<
    { [S in keyof T | K]: S extends keyof T ? T[S] : R extends true ? V : V | null },
    U
>;
