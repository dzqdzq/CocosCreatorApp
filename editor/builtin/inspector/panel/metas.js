"use strict";
const e = ["material"];

const _ = [
  "__assetType__",
  "__name__",
  "__path__",
  "__url__",
  "__mtime__",
  "__dirty__",
];

let t = [];

exports.add = function (e) {
  t.push(e);
};

exports.get = function () {
  if (!t || 0 === t.length) {
    return null;
  }
  const n = t.length > 1;
  let s = JSON.parse(JSON.stringify(t[t.length - 1]));
  if (t.every((_) => e.includes(_.__assetType__))) {
    return n
      ? {
          __assetType__: "unknown",
          __name__: `${t.length} ${s.__assetType__}`,
          multi: n,
        }
      : ((s.multi = false), (s.multiValues = []), s);
  }
  if (!t.every((e) => s.__assetType__ === e.__assetType__)) {
    return {
      __assetType__: "unknown",
      __name__: Editor.i18n.t("INSPECTOR.selections", { num: t.length }),
      multi: n,
    };
  }
  let a = {};

  Object.keys(s).forEach((e) => {
    if (!_.includes(e)) {
      a[e] = t.map((_) => _[e]);
    }
  });

  s.multiValues = a;
  s.metas = t;
  s.multi = n;

  if (n) {
    s.__name__ = `${t.length} ${s.__assetType__}s`;
  }

  return s;
};

exports.syncData = function (_, n, s) {
  if (t.every((_) => e.includes(_.__assetType__))) {
    return;
  }
  let a;
  let r;
  let l;
  let i = n.split(".").filter(Boolean);
  let u = _;
  for (let e = 0; e < i.length; e++) {
    a = u;
    r = i[e];
    if ((!a)) {
      Editor.warn(`Sync meta data error, path: ${n}, target: ${_.__name__}`);
      break;
    }
    u = l = a[r];
  }
  a[r] = s;
};

exports.change = function (e, _) {
    t.forEach((t) => {
      this.syncData(t, e, _);
    });
  };

exports.clear = function () {
    t.length = 0;
  };
