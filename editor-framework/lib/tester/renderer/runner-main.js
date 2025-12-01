"use strict";
const e = require("electron");
const r = require("fire-path");
const t = require("fire-fs");
const i = require("globby");
const o = require("chalk");

module.exports = function (s, n, d) {
  let l = [];

  l = t.isDirSync(s)
    ? i.sync([
        r.join(s, "**/*.js"),
        "!" + r.join(s, "**/*.skip.js"),
        "!**/fixtures/**",
      ])
    : [s];

  let c = new Editor.Window("__test__", {
    title: "Testing Renderer...",
    width: 400,
    height: 300,
    show: false,
    resizable: true,
  });
  Editor.Window.main = c;
  const u = e.ipcMain;

  u.on("stdout:write", (e, ...r) => {
    process.stdout.write.apply(process.stdout, r);
  });

  u.on("tap:error", (e, r) => {
    (function (e) {
      console.log(o.red(e));
    })(r);
  });

  u.on("tap:end", (e, r) => {
    if (n.detail) {
      if (r) {
        c.openDevTools();
      }

      return;
    }
    c.close();

    if (d) {
      d(r);
    }
  });

  c.show();

  c.load("editor-framework://lib/tester/renderer/index.html", {
    files: l,
    detail: n.detail,
    reporter: n.reporter,
  });
};
