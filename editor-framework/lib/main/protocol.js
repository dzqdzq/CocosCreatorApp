"use strict";
let e = {};
module.exports = e;
const t = require("electron");
const r = require("fire-url");
const o = require("fire-path");
const a = require("fire-fs");
const i = require("./console");
let n = ["http:", "https:", "ftp:", "ssh:", "file:"];
let l = {};

e.init = function (e) {
  const i = t.protocol;
  let n = i.registerFileProtocol("editor-framework", (t, a) => {
    if (!t.url) {
      a(-3);
      return;
    }
    let i = decodeURIComponent(t.url);
    let n = r.parse(i);
    let l = n.hostname;

    if (n.pathname) {
      l = o.join(l, n.pathname);
    }

    a({ path: o.join(e.frameworkPath, l) });
  });
  function l(e) {
    return (t) =>
      t.pathname ? o.join(e, t.hostname, t.pathname) : o.join(e, t.hostname);
  }

  if (n) {
    e.success("protocol editor-framework registered");
  } else {
    e.failed("Failed to register protocol editor-framework");
  }

  if ((n = i.registerFileProtocol("app", (t, a) => {
    if (!t.url) {
      a(-3);
      return;
    }
    let i = decodeURIComponent(t.url);
    let n = r.parse(i);
    let l = n.hostname;

    if (n.pathname) {
      l = o.join(l, n.pathname);
    }

    a({ path: o.join(e.App.path, l) });
  }))) {
    e.success("protocol app registered");
  } else {
    e.failed("Failed to register protocol app");
  }

  if ((n = i.registerFileProtocol("theme", (t, i) => {
    if (!t.url) {
      i(-3);
      return;
    }
    let n;
    let l = decodeURIComponent(t.url);
    let p = r.parse(l);
    let s = p.hostname;

    if (p.pathname) {
      s = o.join(s, p.pathname);
    }

    for (let t = 0; t < e.themePaths.length; ++t) {
      let r = o.join(e.themePaths[t], e.theme);
      if (a.isDirSync(r)) {
        n = o.join(r, s);
        break;
      }
    }
    if (!n) {
      return i(-6);
    }
    i({ path: n });
  }))) {
    e.success("protocol theme registered");
  } else {
    e.failed("Failed to register protocol theme");
  }

  if ((n = i.registerFileProtocol("packages", (t, a) => {
    if (!t.url) {
      a(-3);
      return;
    }
    let i = decodeURIComponent(t.url);
    let n = r.parse(i);
    let l = e.Package.packagePath(n.hostname);
    if (!l) {
      return a(-6);
    }
    let p = e.Package.packageInfo(l);
    return p
      ? 0 === n.pathname.indexOf("/test")
        ? a({ path: o.join(l, n.pathname) })
        : a({ path: o.join(p._destPath, n.pathname) })
      : a(-6);
  }))) {
    e.success("protocol packages registered");
  } else {
    e.failed("Failed to register protocol packages");
  }

  e.Protocol.register("editor-framework", l(e.frameworkPath));
  e.Protocol.register("app", l(e.App.path));

  e.Protocol.register("theme", function (t) {
    let r;
    for (let t = 0; t < e.themePaths.length; ++t) {
      let i = o.join(e.themePaths[t], e.theme);
      if (a.isDirSync(i)) {
        r = i;
        break;
      }
    }
    return r
      ? t.pathname
        ? o.join(r, t.hostname, t.pathname)
        : o.join(r, t.hostname)
      : "";
  });

  e.Protocol.register("profile", function (t) {
    let r = e.Profile.query(t.hostname);
    return r ? (t.pathname ? o.join(r, t.pathname) : r) : "";
  });

  e.Protocol.register("packages", function (t) {
    let r = e.Package.packagePath(t.hostname);
    return r ? (t.pathname ? o.join(r, t.pathname) : r) : "";
  });
};

e.url = function (e) {
    if (!e) {
      return null;
    }
    let t = r.parse(e);
    if (!t.protocol) {
      return e;
    }
    if (-1 !== n.indexOf(t.protocol)) {
      return e;
    }
    let o = l[t.protocol];
    return o
      ? o(t)
      : (i.error(
          `Failed to load url ${e}, please register the protocol for it.`
        ),
        null);
  };

e.register = function (e, t) {
    l[e + ":"] = t;
  };
