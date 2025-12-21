import * as rConcepts from './r-concepts';
export declare class NameResolver {
    resolve(entity: rConcepts.Entity): NameResolver.ResolveResult;
    enter(ns: rConcepts.NamespaceTraits): void;
    leave(): void;
    current(): rConcepts.NamespaceTraits;
    private _contextStack;
}
export declare namespace NameResolver {
    interface ResolveResult {
        module?: rConcepts.Entity;
        namespaces?: string[];
        name: string;
    }
}
export declare function resolveRelativePath(from: rConcepts.NamespaceTraits, to: rConcepts.Entity): NameResolver.ResolveResult;
