import ts from 'typescript';
import * as rConcepts from './r-concepts';
import { NameResolver } from './name-resolver';
export declare function recastTopLevelModule({ program, typeChecker, rModule, nameResolver, exportPrivates, resolveEntity, registerNonExportedSymbol, privateJsDocTag, }: {
    program: ts.Program;
    typeChecker: ts.TypeChecker;
    rModule: rConcepts.ModuleTraits;
    nameResolver: NameResolver;
    exportPrivates?: boolean;
    resolveEntity: (symbol: ts.Symbol) => rConcepts.Entity | undefined;
    registerNonExportedSymbol: (symbol: ts.Symbol, currentModule: rConcepts.NamespaceTraits) => {
        entity: rConcepts.Entity;
        addStatements: (statements: ts.Statement[]) => void;
    };
    privateJsDocTag?: string;
}): ts.ModuleDeclaration[];
