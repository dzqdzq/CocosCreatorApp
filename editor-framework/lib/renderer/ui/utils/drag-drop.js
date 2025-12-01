"use strict";
let e = {};
module.exports = e;
const t = require("lodash");
const n = require("fire-path");
const r = require("electron");
const o = require("../../console");
const i = require("../../ipc");
let l = false;
let f = "";
let a = [];
let c = {};

e.start = function (e, t) {
  let n = t.items || [];
  let r = t.type || "";
  let s = t.effect || "";
  let d = !!t.buildImage;
  let u = t.options || {};

  if (!Array.isArray(n)) {
    n = [n];
  }

  if (l) {
    o.warn("DragDrop.end() has not been invoked.");
  }

  l = true;
  f = r;
  a = n;
  c = u;
  e.effectAllowed = s;
  e.dropEffect = "none";
  if (
    (d)
  ) {
    let t = this.getDragIcon(n);
    e.setDragImage(t, -10, 10);
  }
  i.sendToWins("editor:dragstart", { type: r, items: n, options: u });
};

e.end = function () {
  l = false;
  f = "";
  a = [];
  c = {};
  i.sendToWins("editor:dragend");
};

e.updateDropEffect = function (e, t) {
    if (-1 === ["copy", "move", "link", "none"].indexOf(t)) {
      o.warn("dropEffect must be one of 'copy', 'move', 'link' or 'none'");
      e.dropEffect = "none";
      return;
    }
    e.dropEffect = t;
  };

e.type = function (e) {
    return e && -1 !== e.types.indexOf("Files") ? "file" : l ? f : "";
  };

e.filterFiles = function (e) {
    let t = [];
    for (let r = 0; r < e.length; ++r) {
      let o = false;
      for (let i = 0; i < t.length; ++i) {
        if (n.contains(t[i].path, e[r].path)) {
          o = true;
          break;
        }
      }

      if (!o) {
        t.push(e[r]);
      }
    }
    return t;
  };

e.items = function (e) {
    if (e && e.files.length > 0) {
      let t = new Array(e.files.length);
      for (let n = 0; n < e.files.length; ++n) {
        t[n] = e.files[n];
      }
      return t;
    }
    return l ? a.slice() : [];
  };

e.getDragIcon = function (e) {
  let t = new Image();
  let n = document.createElement("canvas");
  let r = n.getContext("2d");
  r.font = "normal 12px Arial";
  r.fillStyle = "white";
  let o = 0;
  for (let t = 0; t < e.length; ++t) {
    let n = e[t];
    if (!(t <= 4)) {
      r.fillStyle = "gray";
      r.fillText("[more...]", 20, o + 15);
      break;
    }

    if (n.icon &&
      void 0 !== n.icon.naturalWidth &&
      0 !== n.icon.naturalWidth) {
      r.drawImage(n.icon, 0, o, 16, 16);
    }

    r.fillText(n.name, 20, o + 15);
    o += 15;
  }
  t.src = n.toDataURL();
  return t;
};

e.options = function () {
    return t.cloneDeep(c);
  };

e.getLength = function () {
    return a.length;
  };

Object.defineProperty(e, "dragging", { enumerable: true, get: () => l });
const s = r.ipcRenderer;

s.on("editor:dragstart", (e, t) => {
  l = true;
  f = t.type;
  a = t.items;
  c = t.options;
});

s.on("editor:dragend", () => {
  l = false;
  f = "";
  a = [];
  c = {};
});
