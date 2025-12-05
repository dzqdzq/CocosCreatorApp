import ts from 'typescript';
export declare function splitLeftmost(entityName: ts.EntityName): {
    leftmost: ts.Identifier;
    rights: ts.Identifier[];
};
export declare function createEntityName(identifiers: string[], leftmost?: ts.EntityName | null): ts.EntityName;
export declare function createAccessLink(identifiers: string[], leftmost?: ts.Expression | null): ts.Expression;
export declare function printSymbol(symbol: ts.Symbol): void;
export declare function hasJsDocTag(tagInfos: ts.JSDocTagInfo[], tagName: string): boolean;
export declare function stringifySymbolFlags(flags: ts.SymbolFlags): string;
export declare function stringifyNode(node: ts.Node): string;
