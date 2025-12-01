"use strict";
let e = {};
module.exports = e;
const n = require("./ipc");
const r = require("./console");

e.checkTemplate = function (n) {
  for (var t = 0; t < n.length; ++t) {
    var u = n[t];
    if (u.click) {
      r.error(
        "The `click` event is not currently implemented for a page-level menu declaration due to known IPC deadlock problems in Electron"
      );

      return false;
    }
    if (u.submenu && !e.checkTemplate(u.submenu)) {
      return false;
    }
  }
  return true;
};

e.popup = function (r, t, u) {
  if (e.checkTemplate(r)) {
    n.sendToMain("menu:popup", r, t, u);
  }
};

e.register = function (r, t, u) {
  if (e.checkTemplate(t)) {
    n.sendToMain("menu:register", r, t, u);
  }
};

e.walk = function (n, r) {
  if (!Array.isArray(n)) {
    n = [n];
  }

  n.forEach((n) => {
    r(n);

    if (n.submenu) {
      e.walk(n.submenu, r);
    }
  });
};
