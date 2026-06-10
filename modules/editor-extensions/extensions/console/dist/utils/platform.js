var __importDefault =
  (this && this.__importDefault) ||
  ((s) => (s && s.__esModule ? s : { default: s }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWindows = undefined;
exports.isMacintosh = undefined;
const os_1 = __importDefault(require("os"));

const isMacintosh =
  globalThis.navigator?.userAgent?.includes("Macintosh") ??
  os_1.default.platform() === "darwin";

exports.isMacintosh = isMacintosh;

const isWindows =
  globalThis.navigator?.userAgent?.includes("win32") ??
  os_1.default.platform() === "win32";

exports.isWindows = isWindows;
