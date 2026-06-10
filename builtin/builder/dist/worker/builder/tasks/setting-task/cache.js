var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;

const { existsSync, readJSONSync } = require("fs-extra");

const { dirname } = require("path");

const fast_glob_1 = __importDefault(require("fast-glob"));
async function handle(t, e, s) {
  let a = e.paths.settings;
  if (!existsSync(a)) {
    var r = await (0, fast_glob_1.default)("settings*.json", {
      cwd: dirname(e.paths.settings),
      absolute: true,
    });
    if (!(a = r[0]) || !existsSync(a)) {
      return void console.error(
        `Can not find cache settings failed in ${dirname(
          e.paths.settings
        )} when build ${t.platform}.`
      );
    }
  }
  e.paths.settings = a;
  e.settings = readJSONSync(a);
}
