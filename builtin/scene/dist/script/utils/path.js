var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (t, e, r, i = r) => {
        var n = Object.getOwnPropertyDescriptor(e, r);

        if (
          !n ||
          (!("get" in n) ? !n.writable && !n.configurable : e.__esModule)
        ) {
          n = {
            enumerable: true,
            get() {
              return e[r];
            },
          };
        }

        Object.defineProperty(t, i, n);
      }
    : (t, e, r, i) => {
        t[(i = i === undefined ? r : i)] = e[r];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (t, e) => {
        Object.defineProperty(t, "default", { enumerable: true, value: e });
      }
    : (t, e) => {
        t.default = e;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var n = (t) =>
      (n =
        Object.getOwnPropertyNames ||
        ((t) => {
          var e;
          var r = [];
          for (e in t) {
            if (Object.prototype.hasOwnProperty.call(t, e)) {
              r[r.length] = e;
            }
          }
          return r;
        }))(t);
    return (t) => {
      if (t && t.__esModule) {
        return t;
      }
      var e = {};
      if (t != null) {
        for (var r = n(t), i = 0; i < r.length; i++) {
          if (r[i] !== "default") {
            __createBinding(e, t, r[i]);
          }
        }
      }
      __setModuleDefault(e, t);
      return e;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
const isWindows = true;
const util = __importStar(require("./index"));
function normalizeArray(e, r) {
  var i = [];
  for (let t = 0; t < e.length; t++) {
    var n = e[t];

    if (n && n !== ".") {
      if (n === "..") {
        if (i.length && i[i.length - 1] !== "..") {
          i.pop();
        } else if (r) {
          i.push("..");
        }
      } else {
        i.push(n);
      }
    }
  }
  return i;
}
function trimArray(t) {
  var e = t.length - 1;
  let r = 0;
  for (; r <= e && !t[r]; r++) {}
  let i = e;
  for (; i >= 0 && !t[i]; i--) {}
  return r === 0 && i === e ? t : r > i ? [] : t.slice(r, i + 1);
}

const splitDeviceRe =
  /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/;

const splitTailRe =
  /^([\s\S]*?)((?:\.{1,2}|[^\\\/]+?|)(\.[^.\/\\]*|))(?:[\\\/]*)$/;
const win32 = {};
function win32SplitPath(t) {
  var t = splitDeviceRe.exec(t) ?? [];
  var e = (t[1] || "") + (t[2] || "");
  var t = t[3] || "";
  var t = splitTailRe.exec(t) ?? [];
  return [e, t[1], t[2], t[3]];
}
function win32StatPath(t) {
  var t = splitDeviceRe.exec(t) ?? [];
  var e = t[1] || "";
  var r = !!e && e[1] !== ":";
  return { device: e, isUnc: r, isAbsolute: r || !!t[2], tail: t[3] };
}
function normalizeUNCRoot(t) {
  return "\\\\" + t.replace(/^[\\\/]+/, "").replace(/[\\\/]+/g, "\\");
}

win32.resolve = function (...args) {
  let e = "";
  let r = "";
  let i = false;
  let n = false;
  for (let t = args.length - 1; -1 <= t; t--) {
    var o;

    if (t >= 0) {
      o = args[t];
    } else if (e) {
      if (
        !(o = process.env["=" + e]) ||
        o.substr(0, 3).toLowerCase() !== e.toLowerCase() + "\\"
      ) {
        o = e + "\\";
      }
    } else {
      o = process.cwd();
    }

    if (!util.isString(o)) {
      throw new TypeError("Arguments to path.resolve must be strings");
    }

    if (o) {
      var s = win32StatPath(o);

      var { device, isAbsolute } = s;

      n = s.isUnc;
      var s = s.tail;
      if (
        (!device || !e || device.toLowerCase() === e.toLowerCase()) &&
        ((e = e || device), i || ((r = s + "\\" + r), (i = isAbsolute)), e) &&
        i
      ) {
        break;
      }
    }
  }

  if (n) {
    e = normalizeUNCRoot(e);
  }

  r = normalizeArray(r.split(/[\\\/]+/), !i).join("\\");
  return e + (i ? "\\" : "") + r || ".";
};

win32.normalize = (t) => {
  let e = win32StatPath(t);

  let { device, isUnc, isAbsolute, tail } = e;

  let s = /[\\\/]$/.test(tail);

  if (
    (tail =
      (tail = normalizeArray(tail.split(/[\\\/]+/), !isAbsolute).join("\\")) ||
      isAbsolute
        ? tail
        : ".") &&
    s
  ) {
    tail += "\\";
  }

  return (
    (device = isUnc ? normalizeUNCRoot(device) : device) +
    (isAbsolute ? "\\" : "") +
    tail
  );
};

win32.isAbsolute = (t) => win32StatPath(t).isAbsolute;

win32.join = function (...args) {
  var e = [];
  for (let t = 0; t < args.length; t++) {
    var r = args[t];
    if (!util.isString(r)) {
      throw new TypeError("Arguments to path.join must be strings");
    }

    if (r) {
      e.push(r);
    }
  }
  let t = e.join("\\");

  if (!/^[\\\/]{2}[^\\\/]/.test(e[0])) {
    t = t.replace(/^[\\\/]{2,}/, "\\");
  }

  return win32.normalize(t);
};

win32.relative = (t, e) => {
  t = win32.resolve(t);
  e = win32.resolve(e);
  var t = t.toLowerCase();
  var r = e.toLowerCase();
  var i = trimArray(e.split("\\"));
  var n = trimArray(t.split("\\"));
  var o = trimArray(r.split("\\"));
  var s = Math.min(n.length, o.length);
  let a = s;
  for (var l = 0; l < s; l++) {
    if (n[l] !== o[l]) {
      a = l;
      break;
    }
  }
  if (a == 0) {
    return e;
  }
  let u = [];
  for (l = a; l < n.length; l++) {
    u.push("..");
  }
  return (u = u.concat(i.slice(a))).join("\\");
};

win32._makeLong = (t) => {
  var e;
  return util.isString(t)
    ? t
      ? ((e = win32.resolve(t)),
        /^[a-zA-Z]\:\\/.test(e)
          ? "\\\\?\\" + e
          : /^\\\\[^?.]/.test(e)
          ? "\\\\?\\UNC\\" + e.substring(2)
          : t)
      : ""
    : t;
};

win32.dirname = (t) => {
  let e = win32SplitPath(t);
  let [r, i] = e;
  return r || i ? r + (i = i && i.substr(0, i.length - 1)) : ".";
};

win32.basename = (t, e) => {
  let r = win32SplitPath(t)[2];
  return (r =
    e && r.substr(-1 * e.length) === e ? r.substr(0, r.length - e.length) : r);
};

win32.extname = (t) => win32SplitPath(t)[3];

win32.format = (t) => {
  if (!util.isObject(t)) {
    throw new TypeError(
      "Parameter 'pathObject' must be an object, not " + typeof t
    );
  }
  var e;
  var r = t.root || "";
  if (util.isString(r)) {
    r = t.dir;
    e = t.base || "";
    return r ? (r[r.length - 1] === win32.sep ? r + e : r + win32.sep + e) : e;
  }
  throw new TypeError(
    "'pathObject.root' must be a string or undefined, not " + typeof t.root
  );
};

win32.parse = (t) => {
  if (!util.isString(t)) {
    throw new TypeError(
      "Parameter 'pathString' must be a string, not " + typeof t
    );
  }
  var e = win32SplitPath(t);
  if (e && e.length === 4) {
    return {
      root: e[0],
      dir: e[0] + e[1].slice(0, -1),
      base: e[2],
      ext: e[3],
      name: e[2].slice(0, e[2].length - e[3].length),
    };
  }
  throw new TypeError("Invalid path '" + t + "'");
};

win32.sep = "\\";
win32.delimiter = ";";

const splitPathRe =
  /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;

const posix = {};
function posixSplitPath(t) {
  return splitPathRe.exec(t)?.slice(1);
}

posix.resolve = function (...args) {
  let e = "";
  let r = false;
  for (let t = args.length - 1; -1 <= t && !r; t--) {
    var i = t >= 0 ? args[t] : process.cwd();
    if (!util.isString(i)) {
      throw new TypeError("Arguments to path.resolve must be strings");
    }

    if (i) {
      e = i + "/" + e;
      r = i[0] === "/";
    }
  }
  e = normalizeArray(e.split("/"), !r).join("/");
  return (r ? "/" : "") + e || ".";
};

posix.normalize = (t) => {
  var e = posix.isAbsolute(t);
  var r = t && t[t.length - 1] === "/";

  if (
    (t = (t = normalizeArray(t.split("/"), !e).join("/")) || e ? t : ".") &&
    r
  ) {
    t += "/";
  }

  return (e ? "/" : "") + t;
};

posix.isAbsolute = (t) => t.charAt(0) === "/";

posix.join = function (...args) {
  let e = "";
  for (let t = 0; t < args.length; t++) {
    var r = args[t];
    if (!util.isString(r)) {
      throw new TypeError("Arguments to path.join must be strings");
    }

    if (r) {
      if (e) {
        e += "/" + r;
      } else {
        e += r;
      }
    }
  }
  return posix.normalize(e);
};

posix.relative = (t, e) => {
  t = posix.resolve(t).substr(1);
  e = posix.resolve(e).substr(1);
  var r = trimArray(t.split("/"));
  var i = trimArray(e.split("/"));
  var n = Math.min(r.length, i.length);
  let o = n;
  for (var s = 0; s < n; s++) {
    if (r[s] !== i[s]) {
      o = s;
      break;
    }
  }
  let a = [];
  for (s = o; s < r.length; s++) {
    a.push("..");
  }
  return (a = a.concat(i.slice(o))).join("/");
};

posix._makeLong = (t) => t;

posix.dirname = (t) => {
  let e = posixSplitPath(t) || [];
  let [r, i] = e;
  return r || i ? r + (i = i && i.substr(0, i.length - 1)) : ".";
};

posix.basename = (t, e) => {
  let r = (posixSplitPath(t) || [])[2];
  return (r =
    e && r.substr(-1 * e.length) === e ? r.substr(0, r.length - e.length) : r);
};

posix.extname = (t) => (posixSplitPath(t) || [])[3];

posix.format = (t) => {
  if (!util.isObject(t)) {
    throw new TypeError(
      "Parameter 'pathObject' must be an object, not " + typeof t
    );
  }
  var e = t.root || "";
  if (util.isString(e)) {
    return (t.dir ? t.dir + posix.sep : "") + (t.base || "");
  }
  throw new TypeError(
    "'pathObject.root' must be a string or undefined, not " + typeof t.root
  );
};

posix.parse = (t) => {
  if (!util.isString(t)) {
    throw new TypeError(
      "Parameter 'pathString' must be a string, not " + typeof t
    );
  }
  var e = posixSplitPath(t);
  if (e && e.length === 4) {
    e[1] = e[1] || "";
    e[2] = e[2] || "";
    e[3] = e[3] || "";

    return {
      root: e[0],
      dir: e[0] + e[1].slice(0, -1),
      base: e[2],
      ext: e[3],
      name: e[2].slice(0, e[2].length - e[3].length),
    };
  }
  throw new TypeError("Invalid path '" + t + "'");
};

posix.sep = "/";
posix.delimiter = ":";
exports.default = isWindows ? win32 : posix;
