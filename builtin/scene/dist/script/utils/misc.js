Object.defineProperty(exports, "__esModule", { value: true });

exports.extname = undefined;
exports.relative = undefined;
exports.join = undefined;
exports.basename = undefined;
exports.writeFile = undefined;
exports.writeFileSync = undefined;
exports.mkdirSync = undefined;
exports.writeJSONSync = undefined;
exports.ensureDirSync = undefined;
exports.readJSONSync = undefined;
exports.readFileSync = undefined;
exports.existsSync = undefined;
exports.promisify = undefined;

exports.get = get;
exports.set = set;
exports.sleep = sleep;
const path_1 = require("path");

Object.defineProperty(exports, "basename", {
  enumerable: true,
  get() {
    return path_1.basename;
  },
});

Object.defineProperty(exports, "join", {
  enumerable: true,
  get() {
    return path_1.join;
  },
});

Object.defineProperty(exports, "relative", {
  enumerable: true,
  get() {
    return path_1.relative;
  },
});

Object.defineProperty(exports, "extname", {
  enumerable: true,
  get() {
    return path_1.extname;
  },
});

const { get: get_2, set: set_2 } = require("lodash");

const util_1 = require("util");

Object.defineProperty(exports, "promisify", {
  enumerable: true,
  get() {
    return util_1.promisify;
  },
});

const fs_extra_1 = require("fs-extra");

function get(e, t, r) {
  return get_2(e, t, r);
}
function set(e, t, r) {
  return set_2(e, t, r);
}
async function sleep(t) {
  return new Promise((e) => setTimeout(e, 1000 /* 1e3 */ * t));
}

Object.defineProperty(exports, "existsSync", {
  enumerable: true,
  get() {
    return fs_extra_1.existsSync;
  },
});

Object.defineProperty(exports, "readJSONSync", {
  enumerable: true,
  get() {
    return fs_extra_1.readJSONSync;
  },
});

Object.defineProperty(exports, "readFileSync", {
  enumerable: true,
  get() {
    return fs_extra_1.readFileSync;
  },
});

Object.defineProperty(exports, "ensureDirSync", {
  enumerable: true,
  get() {
    return fs_extra_1.ensureDirSync;
  },
});

Object.defineProperty(exports, "writeFileSync", {
  enumerable: true,
  get() {
    return fs_extra_1.writeFileSync;
  },
});

Object.defineProperty(exports, "writeJSONSync", {
  enumerable: true,
  get() {
    return fs_extra_1.writeJSONSync;
  },
});

Object.defineProperty(exports, "mkdirSync", {
  enumerable: true,
  get() {
    return fs_extra_1.mkdirSync;
  },
});

Object.defineProperty(exports, "writeFile", {
  enumerable: true,
  get() {
    return fs_extra_1.writeFile;
  },
});
