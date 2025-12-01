"use strict";
const e = require("lodash");
const t = require("async");
const i = require("fire-path");
const s = require("jsondiffpatch");
const r = Editor.require("packages://inspector/utils/utils");
const a = Editor.require("packages://inspector/panel/data");

const { changeCurveState: o, changeCurveData: n } = Editor.require(
  "packages://curve-editor/panel/manager"
);

const l = Editor.require("packages://inspector/panel/metas");
let d = 1e3;

let h = s.create({
  objectHash(e, t) {
    if (!e) {
      return -1;
    }
    if (e.value) {
      let t = e.value;
      if (t.uuid && t.uuid.value) {
        return t.uuid.value;
      }
      if (t.name && t.name.value && t.attrs) {
        return t.name.value;
      }
    }
    return `$$index:${t}`;
  },
  arrays: { detectMove: true },
});

let c = {
  numerically: (e, t) => e - t,
  numericallyBy: (e) => (t, i) => t[e] - i[e],
};

Editor.Panel.extend({
  style:
    "\n    @import url('theme://globals/fontello.css');\n    @import url('app://node_modules/font-awesome/css/font-awesome.min.css');\n\n    :host {\n      display: flex;\n      flex-direction: column;\n    }\n\n    #view {\n      position: relative;\n      overflow: hidden;\n    }\n\n    .props {\n      overflow-x: hidden;\n      overflow-y: scroll;\n      margin-left: 4px;\n      margin-bottom: 10px;\n    }\n\n    .props::-webkit-scrollbar-track {\n      border: 5px solid transparent;\n      background: none !important;\n      background-clip: content-box;\n    }\n\n    .highlight {\n      border: 2px solid #0f0;\n      background-color: rgba( 0, 128, 0, 0.2 );\n      box-sizing: border-box;\n      pointer-events: none;\n    }\n  ",
  template: `\n    <div id="view" class="flex-1"></div>\n    <ui-loader id="loader" class="fit" hidden>${Editor.T(
    "SHARED.loading"
  )}</ui-loader>\n    <div id="highlightBorder" class="highlight fit" hidden></div>\n  `,
  $: { view: "#view", loader: "#loader", highlightBorder: "#highlightBorder" },
  behaviors: [Editor.UI.Droppable],
  listeners: {
    "panel-resize"() {
      if (this._vm && this._vm.resize) {
        this._vm.resize();
      }
    },
    "drop-area-move"(e) {
      e.preventDefault();

      if (this._vm &&
        "node" === this._selectType) {
        e.stopPropagation();

        if (this.dropAccepted) {
          Editor.UI.DragDrop.updateDropEffect(e.detail.dataTransfer, "copy");
        } else {
          Editor.UI.DragDrop.updateDropEffect(
                e.detail.dataTransfer,
                "none"
              );
        }
      }
    },
    "drop-area-enter"(e) {
      e.stopPropagation();
      if (!this._vm || "node" !== this._selectType) {
        return;
      }
      let t = e.detail.dragItems;
      this.highlightBorderFlag = true;

      Editor.assetdb.queryInfoByUuid(t[0].id, (t, i) => {
        let s = i.type;

        if (!("javascript" !== s && "typescript" !== s)) {
          this.dropAccepted = true;

          if (this.highlightBorderFlag) {
            this.$highlightBorder.hidden = false;
          }

          Editor.UI.DragDrop.updateDropEffect(e.detail.dataTransfer, "none");
        }
      });
    },
    "drop-area-leave"(e) {
      e.stopPropagation();

      if (this._vm &&
        "node" === this._selectType) {
        this.dropAccepted = false;
        this.highlightBorderFlag = false;
        this.$highlightBorder.hidden = true;
      }
    },
    "drop-area-accept"(e) {
      e.stopPropagation();
      if (!this._vm || "node" !== this._selectType) {
        return;
      }
      this.dropAccepted = false;
      this.$highlightBorder.hidden = true;
      Editor.Selection.cancel();
      let t = e.detail.dragItems[0].id;
      Editor.Ipc.sendToPanel(
        "scene",
        "scene:add-component",
        this._selectID,
        Editor.Utils.UuidUtils.compressUuid(t)
      );
    },
    "meta-revert"(e) {
      e.stopPropagation();
      this.refresh();
    },
    async "meta-apply"(e) {
      e.stopPropagation();
      if (!(await this._vm._onApply())) {
        return;
      }
      let i = e.detail.target.metas;

      t.map(
        i,
        (e, t) => {
          let i = e.uuid;
          let s = {};

          if (e.subMetas) {
            e.subMetas.forEach((e) => {
              s[e.__name__] = e;
              delete e.__name__;
            });
          }

          e.subMetas = s;
          let r = JSON.stringify(e);
          let a = [];
          for (let t in e.subMetas) {
            let i = e.subMetas[t];
            i.__name__ = t;
            a.push(i);
          }
          e.subMetas = a;
          Editor.assetdb.saveMeta(i, r, t);
        },
        (e) => {
          if (e) {
            Editor.error(e);
          }

          this.refresh();
        }
      );

      this.showLoaderAfter(0);
    },
    "reset-prop"(e) {
      e.stopPropagation();
      let t = r.normalizePath(e.detail.path);
      let i = r.compPath(e.detail.path);
      let s = this._vm.$get(i);
      let a = s ? s.value.uuid.value : this._selectID;

      Editor.Ipc.sendToPanel("scene", "scene:reset-property", {
        id: a,
        path: r.normalizePath(t),
        type: e.detail.type,
      });

      this._queryNode(this._selectID);
    },
    "new-prop"(e) {
      e.stopPropagation();
      let t = r.normalizePath(e.detail.path);
      let i = r.compPath(e.detail.path);
      let s = this._vm.$get(i);
      let a = s ? s.value.uuid.value : this._selectID;

      Editor.Ipc.sendToPanel("scene", "scene:new-property", {
        id: a,
        path: r.normalizePath(t),
        type: e.detail.type,
      });

      this._queryNode(this._selectID);
    },
    "prefab-select-asset"(e) {
      e.stopPropagation();
      let t = this._vm.target.__prefab__.uuid;
      Editor.Ipc.sendToAll("assets:hint", t);
    },
    "prefab-select-root"(e) {
      e.stopPropagation();
      let t = this._vm.target.__prefab__.rootUuid;
      Editor.Ipc.sendToAll("hierarchy:hint", t);
    },
    "prefab-revert"(e) {
      e.stopPropagation();

      Editor.Ipc.sendToPanel(
        "scene",
        "scene:revert-prefab",
        this._vm.target.uuid
      );
    },
    "prefab-apply"(e) {
      e.stopPropagation();

      Editor.Ipc.sendToPanel(
        "scene",
        "scene:apply-prefab",
        this._vm.target.uuid
      );
    },
    "prefab-set-sync"(e) {
      e.stopPropagation();

      Editor.Ipc.sendToPanel(
        "scene",
        "scene:set-prefab-sync",
        this._vm.target.uuid
      );
    },
  },
  ready() {
    this.droppable = "asset";
    this.multi = false;
    this._initDroppable(this);
    this._forceUpdate = false;
    this.reset();
    let e = Editor.Selection.curGlobalActivate();

    if (e) {
      this._inspect(e.type, e.id);
    }

    var t = (e) => (t) => {
      var i = t.path[0];
      if ("node" !== this._inspectType) {
        let e =
          (t.detail && t.detail.path) || i.getAttribute("path") || i.expression;

        if (e) {
          Editor.UI.fire(this.root, "target-change", {
            detail: { path: e, value: t.detail.value },
          });
        }

        return;
      }
      if (i.expression) {
        var s = i.expression.replace(/\.value(s)?(\.[^\.]+)?$/, "");
        var a = r.findRootVue(i);
        if (a) {
          var o = a.$get(s);
          if (o) {
            var n = {};

            if ("UI-PROP" === i.tagName) {
              o.value = t.detail.value;
            }

            n.type = "cc.Asset" === o.type ? o.attrs.assetType : o.type;
            n.path = o.path;
            n.attrs = o.attrs;
            n.value = o.value;
            Editor.UI.fire(this.root, e, { detail: n });
          }
        }
      }
    };
    this._onChange = t("target-change");
    this._onConfirm = t("target-confirm");
    this._onCancel = t("target-cancel");
    this.root.addEventListener("change", this._onChange);
    this.root.addEventListener("confirm", this._onConfirm);
    this.root.addEventListener("cancel", this._onCancel);

    a.onSendBegin = () => {
      clearTimeout(this._queryNodeTimeoutID);
      this._queryNodeTimeoutID = null;
    };

    a.onSendEnd = () => {
      this._queryNode();
      Editor.Ipc.sendToPanel("scene", "scene:undo-commit");
    };
  },
  close() {
    this.removeEventListener("change", this._onChange);
    this.removeEventListener("confirm", this._onConfirm);
    this.removeEventListener("cancel", this._onCancel);
    this._clear();
  },
  reset() {
    this._hasActivated = false;
    this._selectType = null;
    this._selectID = null;
    this._inspectType = null;
    this._clear();
    this.hideLoader();
  },
  refresh() {
    this._inspect(this._selectType, this._selectID);
  },
  uninspect() {
    this.reset();
  },
  _clear() {
    clearTimeout(this._queryNodeTimeoutID);

    if (this._vm) {
      this._vm.$destroy();
      this._vm = null;
    }

    Editor.UI.clear(this.$view);
    let e = this.shadowRoot.getElementById("custom-style");

    if (e) {
      e.remove();
    }
  },
  _inspect(e, t) {
    if (!t) {
      this.uninspect();
      return;
    }
    clearTimeout(this._queryNodeTimeoutID);

    if (this._queryNodeID) {
      Editor.Ipc.cancelRequest(this._queryNodeID);
      this._queryNodeID = null;
    }

    this.showLoaderAfter(200);
    this._selectType = e;
    this._selectID = Editor.Selection.curSelection(e);
    ++d;
    this._curSessionID = d;

    if ("asset" === e && this._selectID.length > 0) {
      this._queryMeta(this._selectID);
    } else {
      if ("node" === e) {
        this._queryNode(this._selectID);
      }
    }
  },
  _doInspect(t, i, s, r, a, o) {
    if (this._inspectType === i && this._vm && !this._forceUpdate) {
      this._forceUpdate = false;
      this._vm.target = s;
      this._vm.multi = !!r;
      return;
    }
    this._clear();
    this._inspectType = i;

    this._loadInspector(i, (n, l, d) => {
      if (n) {
        Editor.error(`Failed to load inspector ${i}: ${n.stack}`);
        return;
      }
      if (t === this._curSessionID) {
        (d = e.defaults(d, {
            el: l,
            data: {},
            methods: {},
            profiles: this.profiles,
          })).data.target = s;

        d.data.multi = !!r;
        d.methods.T = Editor.T;

        d.beforeDestroy = () => {
          if (o) {
            o(this);
          }
        };

        this._vm = new Vue(d);

        if (!this._vm._onApply) {
          this._vm._onApply = function () {
              return true;
            };
        }

        if (d.$) {
          for (let e in d.$) if (l[`$${e}`]) {
            Editor.warn(`failed to assign selector $${e}, already used`);
          } else {
            l[`$${e}`] = l.querySelector(d.$[e]);
          }
        }

        if (a) {
          a(this);
        }

        this.$view.appendChild(l);

        if (d.ready) {
          d.ready.call(this._vm);
        }
      }
    });
  },
  _loadInspector(e, t) {
    let i = Editor.remote.inspectors[e];
    if (!i) {
      t(
        new Error(
          `Can not find inspector for ${e}, please register it first.`
        )
      );

      return;
    }
    Editor.import(i)
      .then((e) => {
      let i = document.createElement("div");
      i.classList.add("fit");
      i.classList.add("layout");
      i.classList.add("vertical");
      let s = {};
      Editor.JS.assignExcept(s, e, ["dependencies", "template", "style"]);
      let r = e.dependencies || [];
      Editor.import(r)
        .then(() => {
          if (e.template) {
            if ("string" === typeof e.template) {
              i.innerHTML = e.template;
            }
          }
          if (e.style) {
            let t = document.createElement("style");
            t.type = "text/css";
            t.textContent = e.style;
            t.id = "custom-style";
            this.shadowRoot.insertBefore(t, this.shadowRoot.firstChild);
          }
          t(null, i, s);
        })
        .catch((e) => {
          t(e);
        });
    })
      .catch((e) => {
        t(e);
      });
  },
  showLoaderAfter(e) {
    if (false !== this.$loader.hidden) {
      if (!this._loaderID) {
        this._loaderID = setTimeout(() => {
          this.$loader.hidden = false;
          this._loaderID = null;
        }, e);
      }
    }
  },
  hideLoader() {
    clearTimeout(this._loaderID);
    this._loaderID = null;
    this.$loader.hidden = true;
  },
  _checkIfApply() {
    if ("asset" === this._selectType &&
      this._vm &&
      this._vm.target.__dirty__) {
      this._applyPopup(this._vm.target);
    }
  },
  _applyPopup(e) {
    if (0 ===
    Editor.Dialog.messageBox({
      type: "warning",
      buttons: [Editor.T("MESSAGE.apply"), Editor.T("MESSAGE.revert")],
      title: Editor.T("MESSAGE.warning"),
      message: Editor.T("MESSAGE.inspector.apply_import_setting_message"),
      detail: Editor.T("MESSAGE.inspector.apply_import_setting_detail", {
        url: e.__url__,
      }),
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    })) {
      Editor.UI.fire(this.root, "meta-apply", { detail: { target: e } });
    } else {
      Editor.UI.fire(this.root, "meta-revert");
    }
  },
  _loadMeta(e, t) {
    if (0 === e.indexOf("mount-")) {
      if (t) {
        t(null, "mount", {
          __name__: e.substring(6),
          __path__: "",
          __assetType__: "mount",
          uuid: e,
        });
      }

      return;
    }
    Editor.assetdb.queryMetaInfoByUuid(e, (s, r) => {
      if (!r) {
        if (t) {
          t(new Error(`Failed to query meta info by ${e}`));
        }

        return;
      }
      let a = JSON.parse(r.json);
      a.__assetType__ = r.assetType;
      a.__name__ = i.basenameNoExt(r.assetPath);
      a.__path__ = r.assetPath;
      a.__url__ = r.assetUrl;
      a.__mtime__ = r.assetMtime;
      a.__dirty__ = false;
      if (
        (a.subMetas)
      ) {
        let e = [];
        for (let t in a.subMetas) {
          let i = a.subMetas[t];
          i.__name__ = t;
          e.push(i);
        }
        a.subMetas = e;
      }

      if (t) {
        t(null, r.defaultType, a);
      }
    });
  },
  messages: {
    "selection:activated"(e, t, i) {
      if (!("node" !== t && "asset" !== t)) {
        this._checkIfApply();
        this._inspect(t, i);
        this._hasActivated = true;
      }
    },
    "selection:changed"(e, t) {
      if ("asset" !== t || this._hasActivated) {
        this._hasActivated = false;
        return;
      }
      this.refresh();
    },
    "selection:deactivated"(e, t, i) {
      if ("node" === t &&
        "node" === this._selectType) {
        this._checkIfApply();
        this._selectID = null;
      }
    },
    "selection:unselected"(e, t, i) {
      if ("node" === t) {
        this._selectID = null;
      }
    },
    "scene:reloading"() {
      if ("node" === this._selectType) {
        this.uninspect();
      }
    },
    "asset-db:assets-moved"(e, t) {
      if ("asset" === this._selectType &&
      this._selectID &&
      this._selectID.length > 0) {
        for (let e = 0; e < t.length; ++e) {
          if (this._selectID.includes(t[e].uuid)) {
            this._forceUpdate = true;
            this.refresh();
            break;
          }
        }
      }
    },
    "asset-db:asset-changed"(e, t) {
      if (!this._vm) {
        return;
      }
      if (this._selectID && this._selectID.includes(t.uuid)) {
        this._forceUpdate = true;
        this.refresh();
        return;
      }
      let i = this._vm.target && this._vm.target.subMetas;

      if ("asset" === this._selectType &&
        i &&
        i.some((e) => e.uuid === t.uuid)) {
        this._forceUpdate = true;
        this.refresh();
      }
    },
    "asset-db:asset-uuid-changed"(e, t) {
      if (this._curInspector &&
        this._selectID === t.oldUuid) {
        this._selectID = t.uuid;
        this._forceUpdate = true;
        this.refresh();
      }
    },
    "curve:state"(e, t) {
      o("true" === t);
    },
    "curve:change"(e, t) {
      n(t);
    },
  },
  _queryMeta(e) {
    t.map(
      e,
      (e, t) => {
        this._loadMeta(e, (i, s, r) => {
          if (i) {
            Editor.error(`Failed to load meta ${e}: ${i.message}`);
            return;
          }
          t(i, r);
        });
      },
      (e, t) => {
        if (e) {
          return Editor.warn(e);
        }
        l.clear();

        t.forEach((e) => {
          l.add(e);
        });

        let i = {
          setProp: (e) => {
            e.stopPropagation();
            let t = r.normalizePath(e.detail.path);
            let i = e.detail.value;
            if ("object" == typeof i) {
              let e = {};
              for (let t in i) e[t] = i[t];
              i = e;
            }
            l.change(t, i);

            if (this._vm.target.multi) {
              this._vm.target = l.get();
            } else {
              l.syncData(this._vm.target, t, i);
            }

            this._vm.target.__dirty__ = true;
          },
        };
        try {
          let e = l.get();

          this._doInspect(
            this._curSessionID,
            e.__assetType__,
            e,
            e.multi,
            (e) => {
              e.root.addEventListener("target-change", i.setProp);
            },
            (e) => {
              e.root.removeEventListener("target-change", i.setProp);
            }
          );

          this.hideLoader();
        } catch (e) {
          Editor.warn(e);
        }
      }
    );
  },
  _queryNode(e) {
    if (this._queryNodeTimeoutID) {
      clearTimeout(this._queryNodeTimeoutID);
      this._queryNodeTimeoutID = null;
    }

    if (this._queryNodeID) {
      Editor.Ipc.cancelRequest(this._queryNodeID);
      this._queryNodeID = null;
    }

    var i = e || Editor.Selection.curSelection("node");
    var s = i.length > 1 ? 300 : 100;

    this._queryNodeTimeoutID = setTimeout(() => {
      var e;
      t.map(
        i,
        (t, i) => {
          e = Editor.Ipc.sendToPanel(
            "scene",
            "scene:query-node",
            t,
            (e, t) => {
              i(e, t);
            }
          );

          this._queryNodeID = e;
          this._curSessionID = this._queryNodeID;
        },
        (t, i) => {
          if (t) {
            this._selectID = Editor.Selection.curSelection("node");
            if (!this._selectID) {
              return;
            }
            this._queryNode(this._selectID);
            return Editor.warn(t);
          }

          if (null != this._queryNodeTimeoutID) {
            a.clear();

            i.forEach((e) => {
              a.add(e);
            });

            this._handleQueryNode(a.get(), e);
          }
        }
      );
    }, s);
  },
  _handleQueryNode(e, t) {
    if (!e) {
      return;
    }
    let i = e.value;
    if (!i) {
      return;
    }
    let s = i.uuid;
    let o = e.types;
    if ("node" === this._selectType) {
      r.buildNode("target", i, o);
      if (
        (this._vm && "node" === this._inspectType && this._vm.target.uuid === s)
      ) {
        let e = h.diff(this._vm.target, i);

        if (e) {
          this._applyPatch(e);
        }

        this.hideLoader();
        this._queryNode(this._selectID);
      } else {
        let s = {
          cancel: (e) => {
            e.stopPropagation();
            Editor.Ipc.sendToPanel("scene", "scene:undo-cancel");
          },
          setProp: (e) => {
            e.stopPropagation();
            let t = r.normalizePath(e.detail.path);
            let i = r.compPath(e.detail.path);
            let s = e.detail.value;
            if ("object" == typeof s) {
              let e = {};
              for (let t in s) e[t] = s[t];
              s = e;
            }
            let o = e.detail.type;

            if ("cc.Node" === o) {
              o = e.detail.attrs.typeid;
            }

            a.change(t, i, e.detail.type, s);
          },
        };

        this._doInspect(
          t,
          "node",
          i,
          e.multi,
          (e) => {
            e.root.addEventListener("target-cancel", s.cancel);
            e.root.addEventListener("target-change", s.setProp);
            e.root.addEventListener("target-size-change", s.setProp);
          },
          (e) => {
            e.root.removeEventListener("target-cancel", s.cancel);
            e.root.removeEventListener("target-change", s.setProp);
            e.root.removeEventListener("target-size-change", s.setProp);
          }
        );

        this.hideLoader();
        this._queryNode(this._selectID);
      }
    }
  },
  _applyPatch(e) {
    for (let t in e) this._patchAt(`target.${t}`, e[t]);
  },
  _cloneData(e) {
    return (function e(t) {
      var i = null;
      var s = typeof t;
      if (Array.isArray(t)) {
        i = t.map(function (t) {
          return e(t);
        });
      } else {
        if ("object" === s) {
          i = {};
          for (let s in t) i[s] = e(t[s]);
        } else {
          i = t;
        }
      }
      return i;
    })(this._vm.$get(e));
  },
  _patchAt(e, t) {
    if (Array.isArray(t)) {
      let s;
      let r;
      let a;

      r = e.replace(/(\.value)?(\.[^\.]+)?$/, function (e) {
        a = (a = e.split(".")).filter(function (e) {
          return e;
        });

        return "";
      });

      s = this._cloneData(r);
      if ("target" === r) {
        r = e;

        if (1 === t.length) {
          s = t[0];
        } else {
          if (2 === t.length) {
            s = t[1];
          } else {
            if (3 === t.length) {
              s = void 0;
            }
          }
        }
      } else {
        var i = s;
        a.forEach(function (e, s) {
          if (s !== a.length - 1) {
            i = i[e];
          } else {
            if (1 === t.length) {
              i[e] = t[0];
            } else {
              if (2 === t.length) {
                i[e] = t[1];
              } else {
                if (3 === t.length) {
                  delete i[e];
                }
              }
            }
          }
        });
      }
      this._vm.$set(r, s);
    } else {
      if ("a" === t._t) {
        let i = [];
        let s = [];
        let r = [];
        for (let e in t) {
          if ("_t" === e) {
            continue;
          }
          let a;
          a = t[e];

          if ("_" === e[0]) {
            if (!(0 !== a[2] && 3 !== a[2])) {
              i.push(parseInt(e.slice(1), 10));
            }
          } else {
            if (1 === a.length) {
              s.push({ index: parseInt(e, 10), value: a[0] });
            } else {
              r.push({ index: parseInt(e, 10), delta: a });
            }
          }
        }
        let a = this._vm.$get(e);
        let o = new Array(a.length);
        for (let e = 0; e < a.length; ++e) {
          o[e] = a[e];
        }
        for (let e = (i = i.sort(c.numerically)).length - 1; e >= 0; e--) {
          let r = i[e];
          let a = t["_" + r];
          let n = o.splice(r, 1)[0];

          if (3 === a[2]) {
            s.push({ index: a[1], value: n });
          }
        }
        s = s.sort(c.numericallyBy("index"));
        for (let e = 0; e < s.length; e++) {
          let t = s[e];
          o.splice(t.index, 0, t.value);
        }

        if ((i.length || s.length)) {
          this._vm.$set(e, o);
        }

        if (r.length > 0) {
          for (let t = 0; t < r.length; t++) {
            let i = r[t];
            this._patchAt(`${e}[${i.index}]`, i.delta);
          }
        }
      } else {
        for (let i in t) this._patchAt(`${e}.${i}`, t[i]);
      }
    }
  },
});
