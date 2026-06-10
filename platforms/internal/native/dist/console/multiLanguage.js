Object.defineProperty(exports, "__esModule", { value: true });

exports.getCurrentString = undefined;
exports.hasKey = undefined;
exports.getString = undefined;
exports.setCurrentLanguage = undefined;

const path = require("path");
const fs = require("fs");
const cfgInfo = require("./strings");
const DEFAULTLANGUAGE = "en";
let locale = null;
let curLangString = null;
let defaultLangString = null;
function getEnvLocale() {
  var n = { lang: "en" };
  var process_env = process.env;

  var process_env =
    process_env.LCALL ||
    process_env.LCMESSAGES ||
    process_env.LANG ||
    process_env.LANGUAGE ||
    Intl.DateTimeFormat().resolvedOptions().locale;

  return process_env ? { lang: process_env.split(".")[0] || n.lang } : n;
}
function getAvaiableLangs() {
  return cfgInfo ? Object.keys(cfgInfo) : [];
}
function getLangKey(n) {
  n = n.split("_");
  return n[0] === "zh"
    ? n.length === 1 || n[1] === "cn"
      ? "zh"
      : "zhTr"
    : n[0];
}
function doInit() {
  locale = getEnvLocale();

  curLangString =
    (curLangString = cfgInfo[getLangKey(locale.lang)]) ||
    cfgInfo[DEFAULTLANGUAGE];

  defaultLangString = cfgInfo[DEFAULTLANGUAGE];
}
function setCurrentLanguage(n) {
  var e = getLangKey(n);

  if (n in cfgInfo) {
    curLangString = cfgInfo[n];
    locale.lang = n;
  } else if (e in cfgInfo) {
    curLangString = cfgInfo[e];
    locale.lang = e;
  } else {
    console.warn();
  }
}
function getString(r, ...g) {
  if (curLangString) {
    var a = curLangString[r];
    if (!a) {
      return `[KEY "${r}" is not found! lang: ${locale.lang}]`;
    }
    if (g.length === 0) {
      return a;
    }
    var o = Array.from(a);
    var u = [];
    var o_length = o.length;
    let n = 0;
    let e = 0;
    let t = 0;

    while (n < o_length) {
      if (o[n] === "%") {
        o[n + 1] !== "d" &&
        o[n + 1] !== "f" &&
        o[n + 1] !== "s" &&
        o[n + 1] === "%"
          ? u.push("%")
          : (u.push(String(g[e++])), t++);

        n += 2;
      } else {
        u.push(o[n]);
        n += 1;
      }
    }

    if (t !== g.length) {
      console.error(`format argument mismatch: ${a} & ` + g.join(", "));
    }

    return u.join("");
  }
  return `[language ${locale.lang} not set, key ${r}]`;
}
function hasKey(n, e) {
  return !!e && n in e;
}
function getCurrentString(n) {
  let e;

  if (hasKey(n, curLangString)) {
    e = curLangString[n];
  } else if (hasKey(n, defaultLangString)) {
    e = defaultLangString[n];
  }

  return e || n;
}
doInit();
exports.setCurrentLanguage = setCurrentLanguage;
exports.getString = getString;
exports.hasKey = hasKey;
exports.getCurrentString = getCurrentString;
