"use strict";
const e = require("electron").BrowserWindow;

module.exports = {
  load() {
    Editor.Menu.register(
      "node-inspector",
      () => [
        {
          label: "Reset Node",
          message: "scene:reset-node",
          panel: "scene",
          params: [],
        },
        {
          label: "Reset All",
          message: "scene:reset-all",
          panel: "scene",
          params: [],
        },
        {
          label: "Paste Component",
          message: "scene:paste-component",
          panel: "scene",
          params: [],
        },
      ],
      true
    );

    Editor.Menu.register("component-inspector", () => [
      {
        label: "Remove",
        message: "scene:remove-component",
        panel: "scene",
        params: [],
      },
      { type: "separator" },
      {
        label: "Reset",
        message: "scene:reset-component",
        panel: "scene",
        params: [],
      },
      {
        label: "Move Up",
        message: "scene:move-up-component",
        panel: "scene",
        params: [],
      },
      {
        label: "Move Down",
        message: "scene:move-down-component",
        panel: "scene",
        params: [],
      },
      { type: "separator" },
      {
        label: "Copy Component",
        message: "scene:copy-component",
        panel: "scene",
        params: [],
      },
      {
        label: "Paste Component",
        message: "scene:paste-component",
        panel: "scene",
        params: [],
      },
    ]);
  },
  unload() {
    Editor.Menu.unregister("node-inspector");
    Editor.Menu.unregister("component-inspector");
  },
  messages: {
    open() {
      Editor.Panel.open("inspector");
    },
    "popup-node-inspector-menu"(n, s) {
      let o = Editor.Menu.getMenu("node-inspector");
      Editor.Menu.walk(o, (e) => {
        if (e.params) {
          e.params.unshift(s.uuids);
        }

        if ("scene:paste-component" === e.message) {
          e.enabled = s.hasCopyComp;
        }
      });
      let p = new Editor.Menu(o, n.sender);
      let a = Math.floor(s.x);
      let t = Math.floor(s.y);
      p.nativeMenu.popup(e.fromWebContents(n.sender), a, t);
      p.dispose();
    },
    "popup-component-inspector-menu"(n, s) {
      let o = Editor.Menu.getMenu("component-inspector");
      Editor.Menu.walk(o, (e) => {
        if (e.params) {
          if ("scene:paste-component" === e.message) {
            e.params.unshift(s.nodeUuids, s.compIndex + 1);
          } else {
            if ("scene:copy-component" === e.message) {
              e.params.unshift(s.compUuids);
            } else {
              e.params.unshift(s.nodeUuids, s.compUuids);
            }
          }
        }

        if ("scene:move-up-component" === e.message) {
          e.enabled = s.compIndex - 1 >= 0;
        } else {
          if ("scene:move-down-component" === e.message) {
            e.enabled = s.compIndex + 1 < s.compCount;
          } else {
            if ("scene:paste-component" === e.message) {
              e.enabled = s.hasCopyComp;
            } else {
              if ("scene:copy-component" === e.message) {
                e.enabled = !s.multi;
              }
            }
          }
        }
      });
      let p = new Editor.Menu(o, n.sender);
      let a = Math.floor(s.x);
      let t = Math.floor(s.y);
      p.nativeMenu.popup(e.fromWebContents(n.sender), a, t);
      p.dispose();
    },
    "popup-comp-menu"(n, s, o, p) {
      let a = Editor.Menu.getMenu("add-component");
      Editor.Menu.walk(a, (e) => {
        if (e.params) {
          e.params[0] = p;
        }
      });
      let t = new Editor.Menu(a, n.sender);
      s = Math.floor(s);
      o = Math.floor(o);
      t.nativeMenu.popup(e.fromWebContents(n.sender), s, o);
      t.dispose();
    },
  },
};
