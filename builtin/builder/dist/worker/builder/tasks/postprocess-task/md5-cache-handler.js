var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.md5CacheHandler = undefined;

const { outputFile, readFileSync, remove, rename } = require("fs-extra");

const { resolve, join, extname, basename, dirname } = require("path");

const { calcMd5, patchMd5ToPath } = require("../../utils");

const minimatch_1 = __importDefault(require("minimatch"));
const fast_glob_1 = __importDefault(require("fast-glob"));
const textFiles = [".js", ".ts", ".html"];
function escapeGlobChars(t) {
  return t.replace(/([*?[\]{}()!+@|^$\\])/g, "\\$1");
}
function safePatternFromAbsolute(t) {
  return t
    .replace(/\\/g, "/")
    .split("/")
    .map((t) => escapeGlobChars(t))
    .join("/");
}
class md5CacheHandler {
  hashedPathMap = {};
  options;
  _root;
  _files = [];
  _waitingMd5Files = [];
  _waitingReplaceFiles = [];
  waitUpdateFiles = {};
  constructor(t, e) {
    this.options = e;
    this._root = t;
  }
  async initFiles() {
    this.options.excludes.push("**/*.map");
    this.options.excludes.push("**.ico");
    this.options.excludes.push("**.icns");

    this.options.includes = [
      ...this.options.replaceOnly,
      ...this.options.includes,
    ].map((t) => t.replace(/\\/g, "/"));

    var t = await (0, fast_glob_1.default)(this.options.includes, {
      onlyFiles: true,
      ignore: this.options.excludes,
      cwd: this._root,
      deep: 0,
      absolute: true,
    });
    const e = Object.values(this.hashedPathMap).map((t) => resolve(t));

    this._files = t.filter((t) => !e.includes(t)).map((t) => resolve(t));

    if (this.options.replaceOnly.length) {
      this._files.forEach((e) => {
        (this.options.replaceOnly.find((t) =>
          (0, minimatch_1.default)(e, join(this._root, t))
        )
          ? this._waitingReplaceFiles
          : this._waitingMd5Files
        ).push(e);
      });
    } else {
      this._waitingMd5Files = this._files;
    }
  }
  async run() {
    await this.initFiles();
    await this.addMD5ToFiles();

    if (this._waitingMd5Files.length && this._waitingReplaceFiles.length) {
      await Promise.all(
        this._waitingReplaceFiles.map((t) => this.replacePath(t))
      );
    }
  }
  async replacePath(t) {
    var e = await this.readFileDepends(t);

    if (e && e.depends.length) {
      await this.replacePathInCode(t, e);
      await outputFile(t, e.code);
    }
  }
  async addMd5ToPath(t, e) {
    var a = calcMd5(e || readFileSync(t, "utf-8"));
    var a = patchMd5ToPath(t, a);

    if (e) {
      await remove(t);
      await outputFile(a, e);
    } else {
      await rename(t, a);
    }

    this.hashedPathMap[t] = a;
    return this.hashedPathMap[t];
  }
  findFile(t, e) {
    var a;
    if (extname(e)) {
      a = join(t, e);

      return this.checkPathExist(a) ||
        (!e.startsWith(".") &&
          ((a = join(this._root, e)), this.checkPathExist(a)))
        ? a
        : "";
    }
    for (const s of [".js", ".json", "/index.js", "/index.json"]) {
      var i = this._joinPath(t, e, s);
      if (this.checkPathExist(i)) {
        return i;
      }
      if (
        !e.startsWith(".") &&
        ((i = this._joinPath(this._root, e, s)), this.checkPathExist(i))
      ) {
        return i;
      }
    }
    return "";
  }
  checkPathExist(t) {
    return this._files.includes(t) || this.hashedPathMap[t];
  }
  _joinPath(t, e, a) {
    return a.startsWith(".") ? join(t, e + a) : join(t, e, a);
  }
  async addMD5ToFiles() {
    var t = this._waitingMd5Files;

    await Promise.all(
      t.map(async (t) => {
        var e;

        if (!this.hashedPathMap[t]) {
          if ((e = await this.readFileDepends(t)) && e.depends.length) {
            await this.replacePathInCode(t, e);

            e.depends.length
              ? (this.waitUpdateFiles[t] = e)
              : await this.addMd5ToPath(t, e.code);
          } else {
            await this.addMd5ToPath(t, e?.code);
          }
        }
      })
    );

    await new Promise(async (t, e) => {
      try {
        for (var a = Object.keys(this.waitUpdateFiles); a.length; ) {
          var i = a.shift();
          if (!i) {
            return;
          }
          var s = this.waitUpdateFiles[i];
          await this.replacePathInCode(i, s);

          if (s.depends.length === 0) {
            await this.addMd5ToPath(i, s.code);
            delete this.waitUpdateFiles[i];
          } else {
            a.push(i);
          }
        }
      } catch (t) {
        e(t);
      }
      t();
    });
  }
  replacePathInCode(a, i) {
    const s = [];

    i.depends.forEach((t, e) => {
      if (this.hashedPathMap[t.path]) {
        i.code = i.code.replaceAll(
          t.matchStr,
          t.matchStr.replace(
            basename(t.fileName),
            basename(this.hashedPathMap[t.path])
          )
        );
      } else if (
        (!this.waitUpdateFiles[t.path] ||
          !this.waitUpdateFiles[t.path].depends.find((t) => t.path === a)) &&
        this._waitingMd5Files.includes(t.path)
      ) {
        s.push(t);
      }
    });

    i.depends = s;
    return i;
  }
  async readFileDepends(t) {
    var e = extname(t);
    if (!textFiles.includes(e)) {
      return null;
    }
    var a = readFileSync(t, "utf-8");
    var i = /(?:'|\")([^\s'"]+)(?:'|\")/g;
    let s = [];
    if (e === ".html") {
      s = Array.from(a.matchAll(/(?:href|src)="([^"]*)"/g));
      e = extractScriptContents(a);
      if (e.length) {
        for (const l of e) {
          s = s.concat(Array.from(l.matchAll(i)));
        }
      }
    } else {
      s = Array.from(a.matchAll(i));
    }
    var h = [];
    var r = dirname(t);
    for (const o of s) {
      var n = this.findFile(r, o[1]);

      if (n) {
        h.push({ path: n, matchStr: o[0], fileName: o[1] });
      }
    }
    return { depends: h, code: a };
  }
}
function extractScriptContents(t) {
  for (
    var e, a = [], i = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
    null !== (e = i.exec(t));

  ) {
    if (e[1]) {
      a.push(e[1]);
    }
  }
  return a;
}
exports.md5CacheHandler = md5CacheHandler;
