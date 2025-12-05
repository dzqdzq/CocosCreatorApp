"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recastTopLevelModule = void 0;
const typescript_1 = __importStar(require("typescript"));
const tsUtils = __importStar(require("./ts-utils"));
function recastTopLevelModule({ program, typeChecker, rModule, nameResolver, exportPrivates, resolveEntity, registerNonExportedSymbol, privateJsDocTag, }) {
    const nodeFactor = typescript_1.default.factory;
    const moduleDeclaration = recastRModule(rModule);
    return [moduleDeclaration];
    function pushIfNonNull(target, source) {
        if (source) {
            target.push(source);
        }
    }
    function pushMultiIfNonNull(target, source) {
        if (source) {
            target.push(...source);
        }
    }
    function tryEmplaceModifier(modifiers, kind) {
        if (modifiers.every((m) => m.kind !== kind)) {
            modifiers.unshift(nodeFactor.createModifier(kind));
        }
    }
    function recastRModule(rModule) {
        const statements = recastNamespaceTraits(rModule.entity.namespaceTraits);
        Object.entries(rModule.imports).map(([specifier, detail]) => {
            const importSymbols = Object.entries(detail.namedImports);
            if (importSymbols.length === 0) {
                return;
            }
            const importSpecifiers = importSymbols.map(([importId, localId]) => {
                const lId = nodeFactor.createIdentifier(localId);
                if (importId === localId) {
                    return nodeFactor.createImportSpecifier(false, undefined, lId);
                }
                else {
                    return nodeFactor.createImportSpecifier(false, nodeFactor.createIdentifier(importId), lId);
                }
            });
            statements.push(nodeFactor.createImportDeclaration(undefined, // modifiers
            nodeFactor.createImportClause(false, undefined, nodeFactor.createNamedImports(importSpecifiers)), nodeFactor.createStringLiteral(specifier)));
        });
        rModule.interopRecord.forEach((interop) => {
            if (interop.exports.length !== 0) {
                statements.push(nodeFactor.createExportDeclaration(undefined, // modifiers
                false, // isTypeOnly
                nodeFactor.createNamedExports(interop.exports.map(({ importName, asName }) => asName === importName ?
                    nodeFactor.createExportSpecifier(false, undefined, nodeFactor.createIdentifier(importName)) :
                    nodeFactor.createExportSpecifier(false, nodeFactor.createIdentifier(importName), nodeFactor.createIdentifier(asName)))), nodeFactor.createStringLiteral(interop.specifier)));
            }
            if (interop.imports.length !== 0) {
                statements.push(nodeFactor.createImportDeclaration(undefined, // modifiers
                nodeFactor.createImportClause(false, undefined, // default import name
                nodeFactor.createNamedImports(interop.imports.map(({ importName, asName }) => asName === importName ?
                    nodeFactor.createImportSpecifier(false, undefined, nodeFactor.createIdentifier(importName)) :
                    nodeFactor.createImportSpecifier(false, nodeFactor.createIdentifier(importName), nodeFactor.createIdentifier(asName))))), nodeFactor.createStringLiteral(interop.specifier)));
            }
        });
        // ts treat all things in .d.ts as public exports
        // except it contains at least one `export {}` or `export default`.
        // See:
        // https://github.com/microsoft/TypeScript/issues/19545
        statements.push(nodeFactor.createExportDeclaration(undefined, // modifiers
        false, // isTypeOnly,
        nodeFactor.createNamedExports([])));
        const moduleDeclaration = nodeFactor.createModuleDeclaration([nodeFactor.createModifier(typescript_1.default.SyntaxKind.DeclareKeyword)], nodeFactor.createStringLiteral(rModule.entity.name), nodeFactor.createModuleBlock(statements));
        return moduleDeclaration;
    }
    function recastREntity(rEntity) {
        if (!rEntity.symbol) {
            // For example: the `__private` namespace
            return null;
        }
        const namespaceTraits = rEntity.namespaceTraits;
        const declarations = rEntity.symbol.getDeclarations();
        if (!declarations || declarations.length === 0) {
            return null;
        }
        const statements = [];
        for (const declaration of declarations) {
            pushIfNonNull(statements, recastDeclaration(declaration, rEntity.name, true));
        }
        if (namespaceTraits) {
            const childrenEntityStatements = recastNamespaceTraits(namespaceTraits);
            const namespaceDeclaration = nodeFactor.createModuleDeclaration([nodeFactor.createModifier(typescript_1.default.SyntaxKind.ExportKeyword)], // TODO: recastModifiers(moduleDeclaration.modifiers),
            nodeFactor.createIdentifier(rEntity.name), nodeFactor.createModuleBlock(childrenEntityStatements), typescript_1.default.NodeFlags.Namespace);
            const declaration0 = declarations[0];
            if (declaration0.kind === typescript_1.default.SyntaxKind.ModuleDeclaration) {
                copyComments(declaration0, namespaceDeclaration);
            }
            statements.push(namespaceDeclaration);
        }
        return statements;
    }
    function recastNamespaceTraits(namespaceTraits) {
        const statements = [];
        nameResolver.enter(namespaceTraits);
        for (const childEntity of namespaceTraits.children) {
            pushMultiIfNonNull(statements, recastREntity(childEntity));
        }
        namespaceTraits.transformAliasExports();
        if (namespaceTraits.selfExports.length !== 0) {
            statements.push(nodeFactor.createExportDeclaration(undefined, // modifiers
            false, // isTypeOnly
            nodeFactor.createNamedExports(namespaceTraits.selfExports.map(({ importName, asName }) => asName === importName ?
                nodeFactor.createExportSpecifier(false, undefined, nodeFactor.createIdentifier(importName)) :
                nodeFactor.createExportSpecifier(false, nodeFactor.createIdentifier(importName), nodeFactor.createIdentifier(asName)))), undefined));
        }
        for (const { where, importName, asName } of namespaceTraits.selfExportsFromNamespaces) {
            statements.push(nodeFactor.createImportEqualsDeclaration([nodeFactor.createModifier(typescript_1.default.SyntaxKind.ExportKeyword)], // modifiers
            false, nodeFactor.createIdentifier(asName), nodeFactor.createQualifiedName(tsUtils.createEntityName(where), importName)));
        }
        nameResolver.leave();
        if (namespaceTraits.neNamespace) {
            const neNsDeclaration = nodeFactor.createModuleDeclaration([nodeFactor.createModifier(typescript_1.default.SyntaxKind.ExportKeyword)], nodeFactor.createIdentifier(namespaceTraits.neNamespace.trait.entity.name), nodeFactor.createModuleBlock(namespaceTraits.neNamespace.statements), typescript_1.default.NodeFlags.Namespace);
            statements.push(neNsDeclaration);
        }
        return statements;
    }
    function optimizeModuleSpecifierTo(from, to) {
        return to;
    }
    function recastStatement(statement) {
        if (typescript_1.default.isClassDeclaration(statement)) {
            return !statement.name ? null : recastClassDeclaration(statement, statement.name.text, false);
        }
        else if (typescript_1.default.isFunctionDeclaration(statement)) {
            return !statement.name ? null : recastFunctionDeclaration(statement, statement.name.text, false);
        }
        else if (typescript_1.default.isInterfaceDeclaration(statement)) {
            return !statement.name ? null : recastInterfaceDeclaration(statement, statement.name.text, false);
        }
        else if (typescript_1.default.isEnumDeclaration(statement)) {
            return !statement.name ? null : recastEnumDeclaration(statement, statement.name.text, false);
        }
        else if (typescript_1.default.isTypeAliasDeclaration(statement)) {
            return !statement.name ? null : recastTypeAliasDeclaration(statement, statement.name.text, false);
        }
        else if (typescript_1.default.isVariableStatement(statement)) {
            return copyComments(statement, nodeFactor.createVariableStatement(recastDeclarationModifiers(statement, false), nodeFactor.createVariableDeclarationList(statement.declarationList.declarations.map((declaration) => recastVariableDeclaration(declaration, declaration.name.getText(), false)), statement.declarationList.flags)));
        }
        else if (typescript_1.default.isImportDeclaration(statement)) {
            return recastImportDeclaration(statement);
        }
        else {
            return null;
        }
    }
    function recastStatements(statements) {
        const result = [];
        for (const statement of statements) {
            const newStatement = recastStatement(statement);
            if (Array.isArray(newStatement)) {
                result.push(...newStatement);
            }
            else if (newStatement) {
                result.push(newStatement);
            }
        }
        return result;
    }
    function recastDeclaration(declaration, newName, forceExport) {
        if (typescript_1.default.isClassDeclaration(declaration)) {
            return recastClassDeclaration(declaration, newName, forceExport);
        }
        else if (typescript_1.default.isFunctionDeclaration(declaration)) {
            return recastFunctionDeclaration(declaration, newName, forceExport);
        }
        else if (typescript_1.default.isInterfaceDeclaration(declaration)) {
            return recastInterfaceDeclaration(declaration, newName, forceExport);
        }
        else if (typescript_1.default.isEnumDeclaration(declaration)) {
            return recastEnumDeclaration(declaration, newName, forceExport);
        }
        else if (typescript_1.default.isTypeAliasDeclaration(declaration)) {
            return recastTypeAliasDeclaration(declaration, newName, forceExport);
        }
        else if (typescript_1.default.isVariableDeclaration(declaration)) {
            return copyComments(declaration, nodeFactor.createVariableStatement(recastDeclarationModifiers(declaration, forceExport), nodeFactor.createVariableDeclarationList([recastVariableDeclaration(declaration, newName, forceExport)], declaration.parent.flags)));
        }
        else if (typescript_1.default.isModuleDeclaration(declaration)) {
            // return recastModuleDeclaration(declaration, newName);
        }
        return null;
    }
    function copyComments(src, dst) {
        if (typescript_1.default.isVariableDeclaration(src) &&
            typescript_1.default.isVariableDeclarationList(src.parent) &&
            typescript_1.default.isVariableStatement(src.parent.parent)) {
            // https://github.com/microsoft/TypeScript/issues/35620
            return copyComments(src.parent.parent, dst);
        }
        const sourceFileText = src.getSourceFile().text;
        typescript_1.default.forEachLeadingCommentRange(sourceFileText, src.pos, (pos, end, kind) => {
            let tex = sourceFileText.substring(pos, end);
            if (tex.startsWith('/*')) {
                tex = tex.substr(2, tex.length - 4);
                tex = tex.split('\n').map((line, lineIndex, lines) => {
                    const noHeadSpace = line.trimLeft();
                    if (lineIndex === lines.length - 1 && noHeadSpace.length === 0) {
                        return ' ';
                    }
                    else if (!noHeadSpace.startsWith('*')) {
                        return line;
                    }
                    else if (lineIndex === 0) {
                        return noHeadSpace;
                    }
                    else {
                        return ` ${noHeadSpace}`;
                    }
                }).join('\n');
            }
            else if (tex.startsWith('//')) {
                tex = tex.substr(2);
            }
            typescript_1.default.addSyntheticLeadingComment(dst, kind, tex, true);
        });
        return dst;
    }
    function recastSourceFileDeclarationAsNamespaceDeclaration(sourceFile, newName) {
        const newBody = nodeFactor.createModuleBlock(recastStatements(sourceFile.statements));
        return nodeFactor.createModuleDeclaration(undefined, nodeFactor.createIdentifier(newName), newBody, typescript_1.default.NodeFlags.Namespace);
    }
    function recastModuleDeclarationAsNamespaceDeclaration(moduleDeclaration, newName) {
        const body = moduleDeclaration.body;
        let newBody;
        if (!body) {
            // Fall through
        }
        else if (typescript_1.default.isIdentifier(body)) {
            newBody = nodeFactor.createIdentifier(body.text);
        }
        else if (typescript_1.default.isModuleBlock(body)) {
            newBody = nodeFactor.createModuleBlock(recastStatements(body.statements));
        }
        else {
            console.warn(`Unknown module declaration type ${tsUtils.stringifyNode(body)}`);
        }
        return nodeFactor.createModuleDeclaration(recastDeclarationModifiers(moduleDeclaration, true), nodeFactor.createIdentifier(newName), newBody, typescript_1.default.NodeFlags.Namespace);
    }
    function recastFunctionDeclaration(functionDeclaration, newName, forceExport) {
        return copyComments(functionDeclaration, nodeFactor.createFunctionDeclaration(recastModifiers(functionDeclaration.modifiers), functionDeclaration.asteriskToken, newName, recastTypeParameterArray(functionDeclaration.typeParameters), recastParameterArray(functionDeclaration.parameters), // parameters
        recastTypeNode(functionDeclaration.type), undefined));
    }
    function recastVariableDeclaration(variableDeclaration, newName, forceExport) {
        return nodeFactor.createVariableDeclaration(newName, recastToken(variableDeclaration.exclamationToken), recastTypeNode(variableDeclaration.type), recastExpression(variableDeclaration.initializer));
    }
    function recastPropertySignature(propertySignature) {
        return copyComments(propertySignature, nodeFactor.createPropertySignature(recastModifiers(propertySignature.modifiers), // modifiers
        recastPropertyName(propertySignature.name), // name
        recastToken(propertySignature.questionToken), // questionToken
        recastTypeNode(propertySignature.type)));
    }
    function recastMethodSignature(methodSignature) {
        return copyComments(methodSignature, nodeFactor.createMethodSignature(recastModifiers(methodSignature.modifiers), // modifiers
        recastPropertyName(methodSignature.name), // name
        recastToken(methodSignature.questionToken), // questionToken
        recastTypeParameterArray(methodSignature.typeParameters), // typeParameters
        recastParameterArray(methodSignature.parameters), // parameters
        recastTypeNode(methodSignature.type)));
    }
    function recastIndexSignatureDeclaration(indexSignature) {
        return copyComments(indexSignature, nodeFactor.createIndexSignature(undefined, // decorators
        recastModifiers(indexSignature.modifiers), // modifiers
        recastParameterArray(indexSignature.parameters), // parameters
        recastTypeNode(indexSignature.type) || nodeFactor.createKeywordTypeNode(typescript_1.default.SyntaxKind.UndefinedKeyword)));
    }
    function recastCallSignatureDeclaration(callSignature) {
        return copyComments(callSignature, nodeFactor.createCallSignature(recastTypeParameterArray(callSignature.typeParameters), // typeParameters
        recastParameterArray(callSignature.parameters), // parameters
        recastTypeNode(callSignature.type)));
    }
    function recastConstructorSignatureDeclaration(constructSignature) {
        return copyComments(constructSignature, nodeFactor.createConstructSignature(recastTypeParameterArray(constructSignature.typeParameters), recastParameterArray(constructSignature.parameters), // parameters
        recastTypeNode(constructSignature.type)));
    }
    function recastPropertyDeclaration(propertyDeclaration) {
        return copyComments(propertyDeclaration, nodeFactor.createPropertyDeclaration(recastModifiers(nodeFactor.createNodeArray(typescript_1.default.getModifiers(propertyDeclaration))), recastPropertyName(propertyDeclaration.name), recastToken(propertyDeclaration.questionToken), recastTypeNode(propertyDeclaration.type), recastExpression(propertyDeclaration.initializer)));
    }
    function recastMethodDeclaration(methodDeclaration) {
        return copyComments(methodDeclaration, (nodeFactor.createMethodDeclaration(recastModifiers(nodeFactor.createNodeArray(typescript_1.default.getModifiers(methodDeclaration))), recastToken(methodDeclaration.asteriskToken), recastPropertyName(methodDeclaration.name), recastToken(methodDeclaration.questionToken), recastTypeParameterArray(methodDeclaration.typeParameters), recastParameterArray(methodDeclaration.parameters), // parameters
        recastTypeNode(methodDeclaration.type), undefined)));
    }
    function recastConstructorDeclaration(constructorDeclaration) {
        return copyComments(constructorDeclaration, (nodeFactor.createConstructorDeclaration(recastModifiers(constructorDeclaration.modifiers), recastParameterArray(constructorDeclaration.parameters), // parameters
        undefined)));
    }
    function recastParameter(parameter) {
        return nodeFactor.createParameterDeclaration(recastModifiers(nodeFactor.createNodeArray(typescript_1.default.getModifiers(parameter))), recastToken(parameter.dotDotDotToken), parameter.name.getText(), recastToken(parameter.questionToken), recastTypeNode(parameter.type));
    }
    function recastParameterArray(parameters) {
        const lambda = (p) => copyComments(p, (recastParameter(p)));
        if (parameters) {
            return parameters.map(lambda);
        }
        else {
            return undefined;
        }
    }
    function recastTypeParameter(typeParameter) {
        return nodeFactor.createTypeParameterDeclaration(undefined, typeParameter.name.getText(), recastTypeNode(typeParameter.constraint), recastTypeNode(typeParameter.default));
    }
    function recastTypeParameterArray(typeParameters) {
        const lambda = (tp) => copyComments(tp, (recastTypeParameter(tp)));
        if (typeParameters) {
            return typeParameters.map(lambda);
        }
        else {
            return undefined;
        }
    }
    function recastImportDeclaration(importDeclaration) {
        // if (!ts.isStringLiteral(importDeclaration.moduleSpecifier) ||
        //     !importDeclaration.importClause) {
        //     return null;
        // }
        // const moduleRegistry = this._getOrCreateModuleRegistry(importDeclaration.moduleSpecifier.text);
        // const moduleFullName = getModuleRegistryFullNameArray(moduleRegistry);
        // const moduleEntity = createEntityName(moduleFullName);
        // const { namedBindings } = importDeclaration.importClause;
        // if (namedBindings) {
        //     if (ts.isNamespaceImport(namedBindings)) {
        //         return [ts.createVariableStatement(
        //             undefined,
        //             [ts.createVariableDeclaration(
        //                 ts.createIdentifier(
        //                     namedBindings.name.text,
        //                 ),
        //                 ts.createTypeQueryNode(
        //                     moduleEntity,
        //                 ))])];
        //     } else {
        //         for (const element of namedBindings.elements) {
        //         }
        //     }
        // }
        return [];
    }
    function recastExportDeclaration(exportDeclaration) {
        // if (exportDeclaration.moduleSpecifier) {
        //     if (!ts.isStringLiteral(exportDeclaration.moduleSpecifier)) {
        //         return null;
        //     }
        //     const moduleRegistry = this._getOrCreateModuleRegistry(exportDeclaration.moduleSpecifier.text);
        //     const moduleFullName = getModuleRegistryFullNameArray(moduleRegistry);
        //     const moduleEntity = createEntityName(moduleFullName);
        //     if (!exportDeclaration.exportClause) {
        //     }
        // }
        return null;
    }
    function recastClassDeclaration(classDeclaration, newName, forceExport) {
        var _a;
        const classElements = [];
        // console.log(`Dump class ${newName}`);
        for (const element of classDeclaration.members) {
            if (!exportPrivates && isPrivateMember(element)) {
                continue;
            }
            if (privateJsDocTag) {
                const symbol = typeChecker.getSymbolAtLocation(element.name);
                if (symbol && tsUtils.hasJsDocTag(symbol.getJsDocTags(), privateJsDocTag)) {
                    continue;
                }
            }
            // const name = typeof element.name === 'string' ? typeof element.name :
            //     (element.name ? element.name.getText() : '');
            // console.log(`  Dump member ${name}`);
            if (typescript_1.default.isMethodDeclaration(element)) {
                classElements.push(recastMethodDeclaration(element));
            }
            else if (typescript_1.default.isConstructorDeclaration(element)) {
                classElements.push(recastConstructorDeclaration(element));
            }
            else if (typescript_1.default.isPropertyDeclaration(element)) {
                classElements.push(recastPropertyDeclaration(element));
            }
            else if (typescript_1.default.isIndexSignatureDeclaration(element)) {
                classElements.push(recastIndexSignatureDeclaration(element));
            }
            else if (typescript_1.default.isSemicolonClassElement(element)) {
                classElements.push(nodeFactor.createSemicolonClassElement());
            }
            else if (typescript_1.default.isGetAccessor(element)) {
                // Since TS 3.7
                classElements.push(copyComments(element, nodeFactor.createGetAccessorDeclaration(recastModifiers(nodeFactor.createNodeArray(typescript_1.default.getModifiers(element))), // modifiers
                recastPropertyName(element.name), // name
                recastParameterArray(element.parameters), // parameters
                recastTypeNode(element.type), // type
                undefined)));
            }
            else if (typescript_1.default.isSetAccessor(element)) {
                // Since TS 3.7
                classElements.push(copyComments(element, nodeFactor.createSetAccessorDeclaration(recastModifiers(nodeFactor.createNodeArray(typescript_1.default.getModifiers(element))), // modifiers
                recastPropertyName(element.name), // name
                recastParameterArray(element.parameters), // parameters
                undefined)));
            }
            else {
                console.warn(`Don't know how to handle element ${(_a = element.name) === null || _a === void 0 ? void 0 : _a.getText()} of class ${newName}`);
            }
        }
        return copyComments(classDeclaration, nodeFactor.createClassDeclaration(recastDeclarationModifiers(classDeclaration, forceExport), newName, recastTypeParameterArray(classDeclaration.typeParameters), recastHeritageClauses(classDeclaration.heritageClauses), classElements));
    }
    function isPrivateMember(classElement) {
        const modifiers = canHaveModifiers(classElement) ? typescript_1.default.getModifiers(classElement) : undefined;
        if (!modifiers) {
            return false;
        }
        return modifiers.some((modifier) => modifier.kind === typescript_1.default.SyntaxKind.PrivateKeyword);
    }
    function recastInterfaceDeclaration(interfaceDeclaration, newName, forceExport) {
        return copyComments(interfaceDeclaration, nodeFactor.createInterfaceDeclaration(recastDeclarationModifiers(interfaceDeclaration, forceExport), newName, recastTypeParameterArray(interfaceDeclaration.typeParameters), recastHeritageClauses(interfaceDeclaration.heritageClauses), recastTypeElements(interfaceDeclaration.members)));
    }
    function recastTypeElement(typeElement) {
        if (typescript_1.default.isMethodSignature(typeElement)) {
            return recastMethodSignature(typeElement);
        }
        else if (typescript_1.default.isPropertySignature(typeElement)) {
            return recastPropertySignature(typeElement);
        }
        else if (typescript_1.default.isIndexSignatureDeclaration(typeElement)) {
            return recastIndexSignatureDeclaration(typeElement);
        }
        else if (typescript_1.default.isCallSignatureDeclaration(typeElement)) {
            return recastCallSignatureDeclaration(typeElement);
        }
        else if (typescript_1.default.isConstructSignatureDeclaration(typeElement)) {
            return recastConstructorSignatureDeclaration(typeElement);
        }
    }
    function recastTypeElements(typeElements) {
        var _a;
        const result = [];
        for (const typeElement of typeElements) {
            if (privateJsDocTag) {
                const symbol = typeChecker.getSymbolAtLocation(typeElement.name);
                if (symbol && tsUtils.hasJsDocTag(symbol.getJsDocTags(), privateJsDocTag)) {
                    continue;
                }
            }
            const d = recastTypeElement(typeElement);
            if (d) {
                result.push(d);
            }
            else {
                console.warn(`Don't know how to handle element ${(_a = typeElement.name) === null || _a === void 0 ? void 0 : _a.getText()} of interface`);
            }
        }
        return result;
    }
    function recastHeritageClause(heritageClause) {
        const validClauses = [];
        for (const type of heritageClause.types) {
            validClauses.push(nodeFactor.createExpressionWithTypeArguments(recastExpression(type.expression), type.typeArguments ? type.typeArguments.map((ta) => recastTypeNode(ta)) : undefined));
        }
        return nodeFactor.createHeritageClause(heritageClause.token, validClauses);
    }
    function recastHeritageClauses(heritageClauses) {
        if (!heritageClauses) {
            return undefined;
        }
        const lambda = (heritageClause) => recastHeritageClause(heritageClause);
        if (heritageClauses) {
            return heritageClauses.map(lambda);
        }
        else {
            return undefined;
        }
    }
    function recastEnumDeclaration(enumDeclaration, newName, forceExport) {
        return copyComments(enumDeclaration, nodeFactor.createEnumDeclaration(recastDeclarationModifiers(enumDeclaration, forceExport), newName, enumDeclaration.members.map((enumerator) => {
            return copyComments(enumerator, nodeFactor.createEnumMember(enumerator.name.getText(), recastExpression(enumerator.initializer)));
        })));
    }
    function recastTypeAliasDeclaration(typeAliasDeclaration, newName, forceExport) {
        return copyComments(typeAliasDeclaration, nodeFactor.createTypeAliasDeclaration(recastDeclarationModifiers(typeAliasDeclaration, forceExport), newName, recastTypeParameterArray(typeAliasDeclaration.typeParameters), recastTypeNode(typeAliasDeclaration.type)));
    }
    function recastModifiers(modifiers) {
        if (!modifiers) {
            return;
        }
        const result = [];
        for (const modifier of modifiers) {
            switch (modifier.kind) {
                case typescript_1.default.SyntaxKind.DefaultKeyword:
                case typescript_1.default.SyntaxKind.DeclareKeyword:
                    break;
                default:
                    result.push(modifier);
                    break;
            }
        }
        return result;
    }
    function canHaveModifiers(node) {
        // NOTE: `ts.canHaveModifiers` tells that `VariableDeclaration` cannot have modifiers.
        // I think it's a bug on its implementation.
        return typescript_1.default.canHaveModifiers(node) || node.kind === typescript_1.default.SyntaxKind.VariableDeclaration;
    }
    function recastDeclarationModifiers(declaration, forceExport) {
        if (!canHaveModifiers(declaration)) {
            return [];
        }
        let modifiers = recastModifiers(nodeFactor.createNodeArray(typescript_1.default.getModifiers(declaration))).filter((m) => m.kind !== typescript_1.default.SyntaxKind.DeclareKeyword);
        if (forceExport) {
            if (!modifiers) {
                modifiers = [];
            }
            tryEmplaceModifier(modifiers, typescript_1.default.SyntaxKind.ExportKeyword);
        }
        return modifiers;
    }
    function recastTypeNode(type) {
        if (!type) {
            return undefined;
        }
        const fallthrough = () => {
            return nodeFactor.createTypeReferenceNode(type.getText(), undefined);
        };
        switch (type.kind) {
            case typescript_1.default.SyntaxKind.AnyKeyword:
            case typescript_1.default.SyntaxKind.BigIntKeyword:
            case typescript_1.default.SyntaxKind.BooleanKeyword:
            case typescript_1.default.SyntaxKind.NeverKeyword:
            case typescript_1.default.SyntaxKind.NumberKeyword:
            case typescript_1.default.SyntaxKind.ObjectKeyword:
            case typescript_1.default.SyntaxKind.StringKeyword:
            case typescript_1.default.SyntaxKind.SymbolKeyword:
            case typescript_1.default.SyntaxKind.UndefinedKeyword:
            case typescript_1.default.SyntaxKind.UnknownKeyword:
            case typescript_1.default.SyntaxKind.VoidKeyword:
                return nodeFactor.createKeywordTypeNode(type.kind);
        }
        if (typescript_1.default.isTypeReferenceNode(type)) {
            return recastEntityNameAsTypeNode(type.typeName, type.typeArguments ? type.typeArguments.map((ta) => recastTypeNode(ta)) : undefined);
        }
        else if (typescript_1.default.isUnionTypeNode(type)) {
            return nodeFactor.createUnionTypeNode(type.types.map((t) => recastTypeNode(t)));
        }
        else if (typescript_1.default.isTypeLiteralNode(type)) {
            return nodeFactor.createTypeLiteralNode(recastTypeElements(type.members));
        }
        else if (typescript_1.default.isArrayTypeNode(type)) {
            return nodeFactor.createArrayTypeNode(recastTypeNode(type.elementType));
        }
        else if (typescript_1.default.isParenthesizedTypeNode(type)) {
            return nodeFactor.createParenthesizedType(recastTypeNode(type.type));
        }
        else if (typescript_1.default.isTypeQueryNode(type)) {
            // typeof Entity
            return nodeFactor.createTypeQueryNode(recastEntityName(type.exprName));
        }
        else if (typescript_1.default.isTypeOperatorNode(type)) {
            return nodeFactor.createTypeOperatorNode(type.operator, recastTypeNode(type.type));
        }
        else if (typescript_1.default.isFunctionTypeNode(type)) {
            return nodeFactor.createFunctionTypeNode(recastTypeParameterArray(type.typeParameters), recastParameterArray(type.parameters), // parameters
            recastTypeNode(type.type));
        }
        else if (typescript_1.default.isConstructorTypeNode(type)) {
            return nodeFactor.createConstructorTypeNode(undefined, recastTypeParameterArray(type.typeParameters), recastParameterArray(type.parameters), // parameters
            recastTypeNode(type.type));
        }
        else if (typescript_1.default.isImportTypeNode(type)) {
            // import(ImportSpecifier)
            const resolvedTypeName = resolveImportTypeOrTypeQueryNode(type);
            if (resolvedTypeName) {
                if (type.isTypeOf) {
                    // Note: `typeof import("")` is treated as a single importType with `isTypeOf` set to true
                    if (type.typeArguments) {
                        console.error(`Unexpected: typeof import("...") should not have arguments.`);
                    }
                    return nodeFactor.createTypeQueryNode(resolvedTypeName);
                }
                else {
                    return nodeFactor.createTypeReferenceNode(resolvedTypeName, type.typeArguments ? type.typeArguments.map((ta) => recastTypeNode(ta)) : undefined);
                }
            }
        }
        else if (typescript_1.default.isIntersectionTypeNode(type)) {
            return nodeFactor.createIntersectionTypeNode(type.types.map((t) => recastTypeNode(t)));
        }
        else if (typescript_1.default.isIndexedAccessTypeNode(type)) {
            return nodeFactor.createIndexedAccessTypeNode(recastTypeNode(type.objectType), recastTypeNode(type.indexType));
        }
        else if (typescript_1.default.isThisTypeNode(type)) {
            return nodeFactor.createThisTypeNode();
        }
        else if (typescript_1.default.isTypePredicateNode(type)) {
            return nodeFactor.createTypePredicateNode(type.assertsModifier ? nodeFactor.createToken(typescript_1.default.SyntaxKind.AssertsKeyword) : undefined, typescript_1.default.isIdentifier(type.parameterName) ?
                nodeFactor.createIdentifier(type.parameterName.text) :
                nodeFactor.createThisTypeNode(), recastTypeNode(type.type));
        }
        else if (typescript_1.default.isConditionalTypeNode(type)) {
            return nodeFactor.createConditionalTypeNode(recastTypeNode(type.checkType), recastTypeNode(type.extendsType), recastTypeNode(type.trueType), recastTypeNode(type.falseType));
        }
        else if (typescript_1.default.isTupleTypeNode(type)) {
            return nodeFactor.createTupleTypeNode(type.elements.map((elementType) => recastTypeNode(elementType)));
        }
        else if (typescript_1.default.isLiteralTypeNode(type)) {
            const literal = type.literal;
            let dumpedLiteral;
            if (typescript_1.default.isStringLiteral(literal)) {
                dumpedLiteral = nodeFactor.createStringLiteral(literal.text);
            }
            else if (literal.kind === typescript_1.default.SyntaxKind.TrueKeyword) {
                dumpedLiteral = nodeFactor.createTrue();
            }
            else if (literal.kind === typescript_1.default.SyntaxKind.FalseKeyword) {
                dumpedLiteral = nodeFactor.createFalse();
            }
            else if (literal.kind === typescript_1.default.SyntaxKind.NullKeyword) {
                dumpedLiteral = nodeFactor.createNull();
            }
            else if (typescript_1.default.isNumericLiteral(literal)) {
                dumpedLiteral = nodeFactor.createNumericLiteral(literal.text);
            }
            else if (typescript_1.default.isBigIntLiteral(literal)) {
                dumpedLiteral = nodeFactor.createBigIntLiteral(literal.text);
            }
            else if (typescript_1.default.isRegularExpressionLiteral(literal)) {
                dumpedLiteral = nodeFactor.createRegularExpressionLiteral(literal.text);
            }
            else if (typescript_1.default.isNoSubstitutionTemplateLiteral(literal)) {
                dumpedLiteral = nodeFactor.createNoSubstitutionTemplateLiteral(literal.text);
            }
            else if (typescript_1.default.isPrefixUnaryExpression(literal)) {
                dumpedLiteral = nodeFactor.createPrefixUnaryExpression(literal.operator, recastExpression(literal.operand));
            }
            else {
                console.warn(`Don't know how to handle literal type ${type.getText()}(${tsUtils.stringifyNode(literal)})`);
            }
            if (dumpedLiteral) {
                return nodeFactor.createLiteralTypeNode(dumpedLiteral);
            }
        }
        else if (typescript_1.default.isMappedTypeNode(type)) {
            return nodeFactor.createMappedTypeNode(type.readonlyToken && type.readonlyToken.kind === typescript_1.default.SyntaxKind.ReadonlyKeyword ?
                typescript_1.factory.createModifier(type.readonlyToken.kind) :
                recastToken(type.readonlyToken), recastTypeParameter(type.typeParameter), recastTypeNode(type.nameType), recastToken(type.questionToken), recastTypeNode(type.type), undefined);
        }
        else if (typescript_1.default.isInferTypeNode(type)) {
            return nodeFactor.createInferTypeNode(recastTypeParameter(type.typeParameter));
        }
        else if (type.kind === typescript_1.default.SyntaxKind.RestType) {
            return nodeFactor.createRestTypeNode(recastTypeNode(type.type));
        }
        else if (typescript_1.default.isOptionalTypeNode(type)) {
            return nodeFactor.createOptionalTypeNode(type.type);
        }
        else if (typescript_1.default.isNamedTupleMember(type)) {
            return nodeFactor.createNamedTupleMember(recastToken(type.dotDotDotToken), recastIdentifier(type.name), recastToken(type.questionToken), recastTypeNode(type.type));
        }
        else {
            console.warn(`Don't know how to handle type ${type.getText()}(${tsUtils.stringifyNode(type)})`);
        }
        return type ? nodeFactor.createTypeReferenceNode(type.getText(), undefined) : undefined;
    }
    function recastToken(token) {
        if (!token) {
            return undefined;
        }
        const kind = token.kind;
        return nodeFactor.createToken(kind);
    }
    function recastEntityName(name) {
        const identifiers = [];
        let n = name;
        while (typescript_1.default.isQualifiedName(n)) {
            identifiers.unshift(n.right);
            n = n.left;
        }
        identifiers.unshift(n);
        let result = null;
        for (let i = identifiers.length - 1; i >= 0; --i) {
            const id = identifiers[i];
            const resolveResult = resolveIdentifier(id);
            if (resolveResult) {
                const following = identifiers.slice(i + 1).map((id) => id.text);
                // TODO
                result = tsUtils.createEntityName(following, createEntityNameFromNameResolveResult(resolveResult));
            }
        }
        return result || tsUtils.createEntityName(identifiers.map((id) => id.text));
    }
    function recastEntityNameAsTypeNode(name, typeArguments) {
        const { leftmost, rights } = tsUtils.splitLeftmost(name);
        const resolved = resolveIdentifier(leftmost);
        if (resolved) {
            return createTypeNodeFromNameResolveResult(resolved, rights.map((right) => right.text), typeArguments);
        }
        else {
            return nodeFactor.createTypeReferenceNode(recastEntityNameTrivially(name), typeArguments);
        }
    }
    function recastEntityNameTrivially(name) {
        if (typescript_1.default.isIdentifier(name)) {
            return recastIdentifier(name);
        }
        else {
            return nodeFactor.createQualifiedName(recastEntityNameTrivially(name.left), recastIdentifier(name.right));
        }
    }
    function recastIdentifier(id) {
        return nodeFactor.createIdentifier(id.text);
    }
    function recastPropertyName(propertyName) {
        if (typescript_1.default.isIdentifier(propertyName)) {
            return nodeFactor.createIdentifier(propertyName.text);
        }
        else if (typescript_1.default.isStringLiteral(propertyName)) {
            return nodeFactor.createStringLiteral(propertyName.text);
        }
        else if (typescript_1.default.isNumericLiteral(propertyName)) {
            return nodeFactor.createNumericLiteral(propertyName.text);
        }
        else if (typescript_1.default.isPrivateIdentifier(propertyName)) {
            return nodeFactor.createPrivateIdentifier(propertyName.text);
        }
        else {
            return nodeFactor.createComputedPropertyName(recastExpression(propertyName.expression));
        }
    }
    function recastBooleanLiteral(node) {
        return nodeFactor.createToken(node.kind);
    }
    function recastStringLiteral(node) {
        return nodeFactor.createStringLiteral(node.text);
    }
    // Only literals are supported
    function recastExpression(expression) {
        if (!expression) {
            return undefined;
        }
        if (typescript_1.default.isStringLiteral(expression)) {
            return nodeFactor.createStringLiteral(expression.text);
        }
        else if (typescript_1.default.isNumericLiteral(expression)) {
            return nodeFactor.createNumericLiteral(expression.text);
        }
        else if (expression.kind === typescript_1.default.SyntaxKind.TrueKeyword) {
            return nodeFactor.createTrue();
        }
        else if (expression.kind === typescript_1.default.SyntaxKind.FalseKeyword) {
            return nodeFactor.createFalse();
        }
        else if (expression.kind === typescript_1.default.SyntaxKind.NullKeyword) {
            return nodeFactor.createNull();
        }
        else if (typescript_1.default.isIdentifier(expression)) {
            return recastIdExpression(expression);
        }
        else if (typescript_1.default.isPropertyAccessExpression(expression)) {
            return nodeFactor.createPropertyAccessExpression(recastExpression(expression.expression), expression.name.text);
        }
        else {
            return nodeFactor.createStringLiteral(`Bad expression <${expression.getText()}>`);
        }
    }
    function recastIdExpression(id) {
        const resolveResult = resolveIdentifier(id);
        if (resolveResult) {
            return createAccessLinkFromNameResolveResult(resolveResult);
        }
        else {
            return nodeFactor.createIdentifier(id.text);
        }
    }
    function resolveIdentifier(id) {
        const rEntity = tryGetEntityAtLocation(id);
        if (rEntity) {
            return nameResolver.resolve(rEntity);
        }
    }
    function resolveImportTypeOrTypeQueryNode(type) {
        let symbol;
        const typeType = typeChecker.getTypeAtLocation(type);
        if (typeType) {
            symbol = typeType.symbol;
        }
        if (!symbol) {
            console.warn(`Failed to resolve type ${type.getText()}, There is no symbol info.`);
            return;
        }
        const rEntity = getEntityOfSymbol(symbol);
        if (rEntity) {
            const resolved = nameResolver.resolve(rEntity);
            if (resolved) {
                // TODO: consider 'module' ins resolve result.
                return createEntityNameFromNameResolveResult(resolved);
            }
        }
    }
    function createTypeNodeFromNameResolveResult(resolveResult, rightmost, typeArguments, isTypeOf) {
        if (isTypeOf) {
            const typeName = resolveResult.namespaces ?
                tsUtils.createEntityName(resolveResult.namespaces.concat([resolveResult.name]).concat(rightmost !== null && rightmost !== void 0 ? rightmost : []), undefined) :
                tsUtils.createEntityName(rightmost || [], nodeFactor.createIdentifier(resolveResult.name));
            if (resolveResult.module) {
                return nodeFactor.createImportTypeNode(nodeFactor.createLiteralTypeNode(nodeFactor.createStringLiteral(resolveResult.module.name)), // arguments(module specifier)
                undefined, typeName, typeArguments, isTypeOf);
            }
            else {
                return nodeFactor.createTypeReferenceNode(typeName, typeArguments);
            }
        }
        else {
            const ids = prepareAndResolveIdsFromResolveResult(resolveResult);
            return nodeFactor.createTypeReferenceNode(tsUtils.createEntityName(ids.concat(rightmost !== null && rightmost !== void 0 ? rightmost : [])), typeArguments);
        }
    }
    function createEntityNameFromNameResolveResult(resolveResult) {
        const ids = prepareAndResolveIdsFromResolveResult(resolveResult);
        return tsUtils.createEntityName(ids);
    }
    function createAccessLinkFromNameResolveResult(resolveResult) {
        const ids = prepareAndResolveIdsFromResolveResult(resolveResult);
        return tsUtils.createAccessLink(ids);
    }
    function prepareAndResolveIdsFromResolveResult(resolveResult) {
        const ids = [];
        if (resolveResult.namespaces) {
            ids.push(...resolveResult.namespaces);
        }
        ids.push(resolveResult.name);
        if (!resolveResult.module) {
            return ids;
        }
        else {
            const importName = rModule.addNamedImport(resolveResult.module.name, ids[0]);
            return [
                importName,
                ...ids.slice(1),
            ];
        }
    }
    function tryGetEntityAtLocation(node) {
        let symbol = typeChecker.getSymbolAtLocation(node);
        if (!symbol) {
            console.warn(`Failed to resolve symbol ${node.getText()}, There is no symbol info.`);
            return;
        }
        if (symbol.getFlags() & typescript_1.default.SymbolFlags.Alias) {
            symbol = typeChecker.getAliasedSymbol(symbol);
        }
        if (symbol.getFlags() & typescript_1.default.SymbolFlags.TypeParameter ||
            symbol.getFlags() & typescript_1.default.SymbolFlags.EnumMember ||
            symbol.getFlags() & typescript_1.default.SymbolFlags.FunctionScopedVariable) {
            return;
        }
        return getEntityOfSymbol(symbol);
    }
    function getEntityOfSymbol(symbol) {
        const resolved = resolveEntity(symbol);
        if (resolved) {
            return resolved;
        }
        else {
            return referenceNonExportedSymbol(symbol);
        }
    }
    function referenceNonExportedSymbol(symbol) {
        const declarations = symbol.getDeclarations();
        if (!declarations || declarations.length === 0) {
            return;
        }
        if (declarations.every((declaration) => {
            const sourceFile = declaration.getSourceFile();
            return program.isSourceFileDefaultLibrary(sourceFile) ||
                program.isSourceFileFromExternalLibrary(sourceFile);
        })) {
            return;
        }
        const { addStatements, entity } = registerNonExportedSymbol(symbol, nameResolver.current());
        // TODO: ensure that event `rEntity` is not a sub-namespace of current,
        // this also works well
        nameResolver.enter(entity.parent);
        const statements = [];
        for (const declaration of declarations) {
            if (typescript_1.default.isSourceFile(declaration) || typescript_1.default.isModuleDeclaration(declaration)) {
                // `namespace xx {}`, `import * as`, but not exported
                const namespaceTraits = entity.addNamespaceTraits();
                nameResolver.enter(namespaceTraits);
                const newNamespaceDeclaration = typescript_1.default.isSourceFile(declaration)
                    ? recastSourceFileDeclarationAsNamespaceDeclaration(declaration, entity.name)
                    : recastModuleDeclarationAsNamespaceDeclaration(declaration, entity.name);
                statements.push(newNamespaceDeclaration);
                nameResolver.leave();
            }
            else {
                pushIfNonNull(statements, recastDeclaration(declaration, entity.name, true));
            }
        }
        nameResolver.leave();
        addStatements(statements);
        return entity;
    }
}
exports.recastTopLevelModule = recastTopLevelModule;
//# sourceMappingURL=recast.js.map