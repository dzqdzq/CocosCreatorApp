var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (i, e, t, r = t) => {
        Object.defineProperty(i, r, {
          enumerable: true,
          get() {
            return e[t];
          },
        });
      }
    : (i, e, t, r) => {
        i[(r = r === undefined ? t : r)] = e[t];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (i, e) => {
        Object.defineProperty(i, "default", { enumerable: true, value: e });
      }
    : (i, e) => {
        i.default = e;
      });

var __importStar =
  (this && this.__importStar) ||
  ((i) => {
    if (i && i.__esModule) {
      return i;
    }
    var e = {};
    if (i != null) {
      for (var t in i) {
        if (t !== "default" && Object.prototype.hasOwnProperty.call(i, t)) {
          __createBinding(e, i, t);
        }
      }
    }
    __setModuleDefault(e, i);
    return e;
  });

Object.defineProperty(exports, "__esModule", { value: true });
exports.afs = undefined;
const fs = __importStar(require("fs"));
const util_1 = require("util");
exports.afs = {
  readFile: util_1.promisify(fs.readFile),
  readdir: util_1.promisify(fs.readdir),
  stat: util_1.promisify(fs.stat),
  exists: util_1.promisify(fs.exists),
  copyFile: util_1.promisify(fs.copyFile),
  writeFile: util_1.promisify(fs.writeFile),
  mkdir: util_1.promisify(fs.mkdir),
  mkdtemp: util_1.promisify(fs.mkdtemp),
  unlink: util_1.promisify(fs.unlink),
  rmdir: util_1.promisify(fs.rmdir),
};
