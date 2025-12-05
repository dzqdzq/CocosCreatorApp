import ts from 'typescript';
export declare function distributeExports(moduleSymbols: ts.Symbol[], typeChecker: ts.TypeChecker, priorityList?: string[], privateJsDocTag?: string): distributeExports.ModuleMeta[];
declare const prioritySymbol: unique symbol;
export declare namespace distributeExports {
    interface ModuleMeta extends InternalModuleMeta {
    }
    interface InternalModuleMeta {
        symbol: ts.Symbol;
        mainExports: Array<{
            originalSymbol: ts.Symbol;
            exportSymbol: ts.Symbol;
            children?: InternalModuleMeta[];
        }>;
        aliasExports: Array<{
            module: InternalModuleMeta;
            /**
             * Index to the `mainExports` of `module`.
             */
            mainExportIndex: number;
            exportSymbol: ts.Symbol;
        }>;
        /**
         * Index into the priority list indicates what priority this module has, to export a symbol.
         * If this module is not in priority list, it's set to length of the priority list.
         */
        [prioritySymbol]: number;
    }
    type ManualMainExport = string | RegExp;
}
export {};
