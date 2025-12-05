"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typescript_1 = __importDefault(require("typescript"));
const path_1 = __importDefault(require("path"));
function default_1({ configFileName, }) {
    const parsedCommandLine = typescript_1.default.getParsedCommandLineOfConfigFile(configFileName, {}, {
        onUnRecoverableConfigFileDiagnostic: () => { },
        useCaseSensitiveFileNames: typescript_1.default.sys.useCaseSensitiveFileNames,
        readDirectory: typescript_1.default.sys.readDirectory,
        getCurrentDirectory: typescript_1.default.sys.getCurrentDirectory,
        fileExists: typescript_1.default.sys.fileExists,
        readFile: typescript_1.default.sys.readFile,
    });
    if (!parsedCommandLine) {
        throw new Error(`Failed to read tsconfig`);
    }
    const { baseUrl, paths } = parsedCommandLine.options;
    let resolveId;
    if (paths) {
        const baseUrlNormalized = path_1.default.resolve(configFileName, baseUrl !== null && baseUrl !== void 0 ? baseUrl : '.');
        const simpleMap = {};
        for (const [key, mapped] of Object.entries(paths)) {
            simpleMap[key] = path_1.default.resolve(baseUrlNormalized, mapped[0]);
        }
        resolveId = function (source, importer) {
            if (!(source in simpleMap)) {
                return null;
            }
            else {
                return simpleMap[source];
            }
        };
    }
    return {
        name: 'ts-paths',
        resolveId,
    };
}
exports.default = default_1;
//# sourceMappingURL=ts-paths.js.map