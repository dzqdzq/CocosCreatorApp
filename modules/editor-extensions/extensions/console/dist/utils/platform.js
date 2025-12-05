"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWindows = exports.isMacintosh = void 0;
const os_1 = __importDefault(require("os"));
const isMacintosh = globalThis.navigator?.userAgent?.includes('Macintosh') ?? os_1.default.platform() === 'darwin';
exports.isMacintosh = isMacintosh;
const isWindows = globalThis.navigator?.userAgent?.includes('win32') ?? os_1.default.platform() === 'win32';
exports.isWindows = isWindows;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxhdGZvcm0uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdXRpbHMvcGxhdGZvcm0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsNENBQW9CO0FBRXBCLE1BQU0sV0FBVyxHQUFZLFVBQVUsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxZQUFFLENBQUMsUUFBUSxFQUFFLEtBQUssUUFBUSxDQUFDO0FBSTlHLGtDQUFXO0FBSGYsTUFBTSxTQUFTLEdBQVksVUFBVSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLFlBQUUsQ0FBQyxRQUFRLEVBQUUsS0FBSyxPQUFPLENBQUM7QUFJdkcsOEJBQVMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgb3MgZnJvbSAnb3MnO1xuXG5jb25zdCBpc01hY2ludG9zaDogYm9vbGVhbiA9IGdsb2JhbFRoaXMubmF2aWdhdG9yPy51c2VyQWdlbnQ/LmluY2x1ZGVzKCdNYWNpbnRvc2gnKSA/PyBvcy5wbGF0Zm9ybSgpID09PSAnZGFyd2luJztcbmNvbnN0IGlzV2luZG93czogYm9vbGVhbiA9IGdsb2JhbFRoaXMubmF2aWdhdG9yPy51c2VyQWdlbnQ/LmluY2x1ZGVzKCd3aW4zMicpID8/IG9zLnBsYXRmb3JtKCkgPT09ICd3aW4zMic7XG5cbmV4cG9ydCB7XG4gICAgaXNNYWNpbnRvc2gsXG4gICAgaXNXaW5kb3dzLFxufTtcblxuIl19