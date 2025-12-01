"use strict";
let e = {};
module.exports = e;
const n = require("electron");
const o = require("./console");
const r = n.dialog;

e.openFile = function (...e) {
  try {
    return r.showOpenDialogSync.apply(r, e);
  } catch (e) {
    o.error(e);
  }
  return null;
};

e.saveFile = function (...e) {
    try {
      return r.showSaveDialogSync.apply(r, e);
    } catch (e) {
      o.error(e);
    }
    return null;
  };

e.messageBox = function (...e) {
    try {
      return r.showMessageBoxSync.apply(r, e);
    } catch (e) {
      o.error(e);
    }
    return null;
  };

const l = n.ipcMain;

l.on("dialog:open-file", async function (n, ...o) {
  let r = e.openFile.apply(e, o);

  if (void 0 === r) {
    r = -1;
  }

  n.returnValue = r;
});

l.on("dialog:save-file", async function (n, ...o) {
  let r = e.saveFile.apply(e, o);

  if (void 0 === r) {
    r = -1;
  }

  n.returnValue = r;
});

l.on("dialog:message-box", async function (n, ...o) {
  let r = e.messageBox.apply(e, o);

  if (void 0 === r) {
    r = -1;
  }

  n.returnValue = r;
});
