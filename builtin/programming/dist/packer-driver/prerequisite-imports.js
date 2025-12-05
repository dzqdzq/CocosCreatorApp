"use strict";function makePrerequisiteImportsMod(e){return`
// Auto generated represents the prerequisite imports of project modules.

${e.map(e=>`import ${createStringLiteralCode(e)};`).join("\n")}

export { }; // To make sure this module can by recognized as ES2015 module even no imports.
    `}function makeTentativePrerequisiteImports(e){return`
// Auto generated represents the prerequisite imports of project modules.

await (async () => {
    const requests = [${e.map(e=>`() => import(${createStringLiteralCode(e)})`).join(", ")}];
    for (const request of requests) {
        try {
            await request();
        } catch (_err) {
            // The error should have been caught by executor.
        }
    }
})();
    `}function createStringLiteralCode(e){return JSON.stringify(e)}Object.defineProperty(exports,"__esModule",{value:!0}),exports.makeTentativePrerequisiteImports=exports.makePrerequisiteImportsMod=exports.prerequisiteImportsModURL=void 0,exports.prerequisiteImportsModURL="cce:/internal/x/prerequisite-imports",exports.makePrerequisiteImportsMod=makePrerequisiteImportsMod,exports.makeTentativePrerequisiteImports=makeTentativePrerequisiteImports;