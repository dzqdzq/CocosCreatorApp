Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientID = getClientID;
exports.getPackages = getPackages;
exports.calcMd5 = calcMd5;
exports.getLatestFilePath = getLatestFilePath;
exports.createSpan = createSpan;
exports.createUIProp = createUIProp;

const { readdirSync, statSync } = require("fs-extra");

const { join } = require("path");

const md5 = require("md5");
const getmac = require("getmac");
async function getClientID() {
  return new Promise((t) => {
    try {
      return t(md5(getmac));
    } catch (e) {
      console.error(e);
      var r = require("os").networkInterfaces();
      for (const c in r) {
        if (c) {
          var a = r[c];
          for (let e = 0; e < a.length; ++e) {
            var n = a[e];
            if (!n.internal && n.mac) {
              return t(md5(n.mac));
            }
          }
        }
      }
      return t(md5("00:00:00:00:00:00"));
    }
  });
}
function getPackages() {
  return Editor.Package.getPackages()
    .map((e) => {
      if (e.enable) {
        return e.name + "-" + e.version;
      }
    })
    .filter(Boolean);
}
function calcMd5(e) {
  var t = require("crypto").createHash;
  var t = t("md5");
  t.update(e);
  return t.digest("hex");
}
function getLatestFilePath(t, r) {
  return (
    readdirSync(t)
      .map((e) => {
        if (e.endsWith(r)) {
          return join(t, e);
        }
      })
      .filter(Boolean)
      .sort((e, t) => {
        e = statSync(e);
        return statSync(t).mtimeMs - e.mtimeMs;
      })[0] || ""
  );
}
function createSpan(e, t) {
  if (!t) {
    t = document.createElement("span");
    e.appendChild(t);
  }

  return t;
}
function createUIProp(e, t, r, a) {
  var n;
  var c;

  if (a) {
    a.setAttribute("value", t);
  } else {
    (n = document.createElement("ui-prop")).setAttribute("class", "left-width");

    (c = document.createElement("ui-label")).setAttribute("slot", "label");
    c.setAttribute("style", "color: #A3A3A3;");

    (a = document.createElement("ui-label")).setAttribute("slot", "content");

    n.appendChild(c);
    n.appendChild(a);
    c.setAttribute("value", e);
    a.setAttribute("value", t);
    r.appendChild(n);
  }

  return a;
}
