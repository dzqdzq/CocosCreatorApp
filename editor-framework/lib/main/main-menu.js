"use strict";
let e = {};
module.exports = e;
const l = require("electron");
const r = require("./ipc");
const t = require("./window");
const o = require("./menu");
const a = require("./debugger");
const n = require("./i18n");
const i = require("../share/platform");
const d = n.t;
let c;
function p() {
  return [
    {
      label: d("MAIN_MENU.help.title"),
      role: "help",
      id: "help",
      submenu: [
        { label: d("MAIN_MENU.help.docs"), click() {} },
        { label: d("MAIN_MENU.help.api"), click() {} },
        { label: d("MAIN_MENU.help.forum"), click() {} },
        { type: "separator" },
        { label: d("MAIN_MENU.help.subscribe"), click() {} },
        { type: "separator" },
      ],
    },
    {
      label: d("SHARED.product_name"),
      position: "before=help",
      submenu: [
        {
          label: d("MAIN_MENU.about", { product: d("SHARED.product_name") }),
          role: "about",
        },
        {
          label: d("MAIN_MENU.window.hide", {
            product: d("SHARED.product_name"),
          }),
          accelerator: "CmdOrCtrl+H",
          role: "hide",
        },
        {
          label: d("MAIN_MENU.window.hide_others"),
          accelerator: "CmdOrCtrl+Shift+H",
          role: "hideothers",
        },
        { label: d("MAIN_MENU.window.show_all"), role: "unhide" },
        { type: "separator" },
        { label: "Quit", accelerator: "CmdOrCtrl+Q", role: "quit" },
      ],
    },
    {
      label: d("MAIN_MENU.edit.title"),
      submenu: [
        {
          label: d("MAIN_MENU.edit.undo"),
          accelerator: "CmdOrCtrl+Z",
          role: "undo",
        },
        {
          label: d("MAIN_MENU.edit.redo"),
          accelerator: "Shift+CmdOrCtrl+Z",
          role: "redo",
        },
        { type: "separator" },
        {
          label: d("MAIN_MENU.edit.cut"),
          accelerator: "CmdOrCtrl+X",
          role: "cut",
        },
        {
          label: d("MAIN_MENU.edit.copy"),
          accelerator: "CmdOrCtrl+C",
          role: "copy",
        },
        {
          label: d("MAIN_MENU.edit.paste"),
          accelerator: "CmdOrCtrl+V",
          role: "paste",
        },
        {
          label: d("MAIN_MENU.edit.selectall"),
          accelerator: "CmdOrCtrl+A",
          role: "selectall",
        },
      ],
    },
    {
      label: "Window",
      id: "window",
      role: "window",
      submenu: [
        {
          label: d("MAIN_MENU.window.hide", {
            product: d("SHARED.product_name"),
          }),
          accelerator: "CmdOrCtrl+H",
          visible: i.isDarwin,
          role: "hide",
        },
        {
          label: d("MAIN_MENU.window.hide_others"),
          accelerator: "CmdOrCtrl+Shift+H",
          visible: i.isDarwin,
          role: "hideothers",
        },
        {
          label: d("MAIN_MENU.window.show_all"),
          role: "unhide",
          visible: i.isDarwin,
        },
        {
          label: d("MAIN_MENU.window.minimize"),
          accelerator: "CmdOrCtrl+M",
          role: "minimize",
        },
        {
          label: d("MAIN_MENU.window.bring_all_front"),
          visible: i.isDarwin,
          role: "front",
        },
        { type: "separator" },
        {
          label: d("MAIN_MENU.window.close"),
          accelerator: "CmdOrCtrl+W",
          role: "close",
        },
      ],
    },
    { label: "Panel", id: "panel", submenu: [] },
    {
      label: d("MAIN_MENU.layout.title"),
      id: "layout",
      submenu: [
        {
          label: d("MAIN_MENU.layout.default"),
          click() {
            t.main.resetLayout(t.defaultLayoutUrl);
          },
        },
        {
          label: d("MAIN_MENU.layout.empty"),
          dev: true,
          click() {
            t.main.emptyLayout();
          },
        },
      ],
    },
    {
      label: d("MAIN_MENU.developer.title"),
      id: "developer",
      submenu: [
        {
          label: d("MAIN_MENU.developer.reload"),
          accelerator: "CmdOrCtrl+R",
          role: "reload",
        },
        {
          label: d("MAIN_MENU.developer.reload_no_cache"),
          accelerator: "CmdOrCtrl+Shift+R",
          click(e, l) {
            l.webContents.reloadIgnoringCache();
          },
        },
        { type: "separator" },
        {
          label: d("MAIN_MENU.developer.inspect"),
          accelerator: "CmdOrCtrl+Shift+C",
          click() {
            let e = l.BrowserWindow.getFocusedWindow();
            let r = t.find(e);

            if (r) {
              r.send("editor:window-inspect");
            }
          },
        },
        {
          label: d("MAIN_MENU.developer.devtools"),
          accelerator:
            "darwin" === process.platform ? "Alt+Command+I" : "Ctrl+Shift+I",
          click(e, l) {
            if (l) {
              l.openDevTools();

              if (l.devToolsWebContents) {
                l.devToolsWebContents.focus();
              }
            }
          },
        },
        {
          label: d("MAIN_MENU.developer.toggle_node_inspector"),
          type: "checkbox",
          dev: true,
          checked: a.isNodeInspectorEnabled,
          click() {
            a.toggleNodeInspector();
          },
        },
        {
          label: d("MAIN_MENU.developer.toggle_repl"),
          type: "checkbox",
          dev: true,
          checked: a.isReplEnabled,
          click() {
            a.toggleRepl();
          },
        },
        { type: "separator" },
        {
          label: "Human Tests",
          dev: true,
          submenu: [
            { type: "separator" },
            {
              label: "Throw an Uncaught Exception",
              click() {
                throw new Error(
                  "Editor-Framework encountered an unknown error."
                );
              },
            },
            {
              label: "send2panel 'foo:bar' foobar.panel",
              click() {
                r.sendToPanel("foobar", "foo:bar");
              },
            },
          ],
        },
        { type: "separator" },
      ],
    },
  ];
}

e.init = function () {
  if (!c) {
    c = new o(p());
  }

  let l = o.getMenu("main-menu");

  if (!l) {
    o.register("main-menu", p);
    l = o.getMenu("main-menu");
  }

  c.reset(l);
  e.apply();
};

e.reset = function (l) {
  c.reset(l);
  e.apply();
};

e.apply = function () {
    l.Menu.setApplicationMenu(c.nativeMenu);
  };

e.add = function (l, r) {
  if (c.add(l, r)) {
    e.apply();
  }
};

e.insert = function (l, r, t) {
  if (c.insert(l, r, t)) {
    e.apply();
  }
};

e.update = function (l, r) {
  if (c.update(l, r)) {
    e.apply();
  }
};

e.remove = function (l) {
  if (c.remove(l)) {
    e.apply();
  }
};

e._resetToBuiltin = function () {
  o.register("main-menu", p, true);
  e.init();
};

e.set = function (l, r) {
  if (c.set(l, r)) {
    e.apply();
  }
};

e.exists = function (e) {
    return c.exists(e);
  };

Object.defineProperty(e, "menu", { enumerable: true, get: () => c });
const u = l.ipcMain;

u.on("main-menu:init", () => {
  e.init();
});

u.on("main-menu:add", (l, r, t) => {
  e.add(r, t);
});

u.on("main-menu:remove", (l, r) => {
  e.remove(r);
});

u.on("main-menu:set", (l, r, t) => {
  e.set(r, t);
});

u.on("main-menu:reset", (l, r) => {
  e.reset(r);
});

u.on("main-menu:update", (l, r, t) => {
  e.update(r, t);
});

u.on("main-menu:apply", () => {
  e.apply();
});
