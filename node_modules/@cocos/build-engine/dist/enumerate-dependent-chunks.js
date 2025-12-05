"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enumerateDependentChunks = void 0;
/**
 * Enumerates all chunk files that used by specified feature units.
 * @param meta Metadata of build result.
 * @param featureUnits Feature units.
 */
function enumerateDependentChunks(meta, featureUnits) {
    const result = [];
    const visited = new Set();
    const addChunk = (chunkFileName) => {
        if (visited.has(chunkFileName)) {
            return;
        }
        visited.add(chunkFileName);
        result.push(chunkFileName);
        if (meta.dependencyGraph && chunkFileName in meta.dependencyGraph) {
            for (const dependencyChunk of meta.dependencyGraph[chunkFileName]) {
                addChunk(dependencyChunk);
            }
        }
    };
    for (const featureUnit of featureUnits) {
        const chunkFileName = meta.exports[featureUnit];
        if (!chunkFileName) {
            console.error(`Feature unit ${featureUnit} is not in build result!`);
            continue;
        }
        addChunk(chunkFileName);
    }
    return result;
}
exports.enumerateDependentChunks = enumerateDependentChunks;
//# sourceMappingURL=enumerate-dependent-chunks.js.map