"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filePathToModuleRequest = void 0;
function filePathToModuleRequest(path) {
    return path.replace(/\\/g, '\\\\');
}
exports.filePathToModuleRequest = filePathToModuleRequest;
//# sourceMappingURL=utils.js.map