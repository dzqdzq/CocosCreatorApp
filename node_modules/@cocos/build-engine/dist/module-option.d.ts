export declare enum ModuleOption {
    esm = 0,
    cjs = 1,
    system = 2,
    iife = 3
}
export declare function enumerateModuleOptionReps(): ("cjs" | "iife" | "system" | "esm")[];
export declare function parseModuleOption(rep: string): any;
