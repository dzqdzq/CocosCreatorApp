var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, a, r = a) => {
        var n = Object.getOwnPropertyDescriptor(t, a);

        if (
          !n ||
          (!("get" in n) ? !n.writable && !n.configurable : t.__esModule)
        ) {
          n = {
            enumerable: true,
            get() {
              return t[a];
            },
          };
        }

        Object.defineProperty(e, r, n);
      }
    : (e, t, a, r) => {
        e[(r = r === undefined ? a : r)] = t[a];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, t) => {
        Object.defineProperty(e, "default", { enumerable: true, value: t });
      }
    : (e, t) => {
        e.default = t;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var n = (e) =>
      (n =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var a = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              a[a.length] = t;
            }
          }
          return a;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var a = n(e), r = 0; r < a.length; r++) {
          if (a[r] !== "default") {
            __createBinding(t, e, a[r]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });

exports.inject = undefined;
exports.methods = undefined;
exports.watch = undefined;
exports.computed = undefined;
exports.props = undefined;
exports.template = undefined;
exports.name = undefined;

exports.data = data;
exports.mounted = mounted;

const { join } = require("path");

const { readFileSync } = require("fs");

const treeData = __importStar(require("./tree-data"));
const panelData = __importStar(require("./panel-data"));

const { popupContextMenu } = require("./panel-menu");

const utils = __importStar(require("./utils"));
let renameTimeId;
function data() {
  return {
    renameValue: "",
    renameInputState: "",
    addValue: "",
    addInputState: "",
    addInputStyle: {},
    editPrefabIconStyle: { left: 0 },
    assetIcon: { type: "icon", value: "scene" },
  };
}
async function mounted() {
  this.assetIcon = await this.queryAssetIcon();
}
exports.name = "tree-node";

exports.template = readFileSync(
  join(__dirname, "../../static/template/tree-node.html"),
  "utf8"
);

exports.props = ["node", "renameUuid", "addNode"];

exports.computed = {
  state() {
    var e = this;
    var e_node = e.node;
    return e_node
      ? e.renameUuid === e_node.uuid
        ? "rename"
        : e.addNode.sibling === e_node.uuid
        ? "add"
        : e.addNode.parent === e_node.uuid
        ? "creating"
        : treeData.uuidToState[e_node.uuid] || ""
      : "";
  },
  draggable() {
    var e = this.node;
    return this.state !== "" || utils.canNotDragNode(e) ? "false" : "true";
  },
  style() {
    return { paddingLeft: utils.getDisplayNodeLeft(this.node) + "px" };
  },
  showEditPrefabIcon() {
    var e = this.node;
    var t = e.prefab && e.prefab.state && e.prefab.state !== 3;
    if (t && !e.prefab.assetUuid.includes("@")) {
      return e.prefab.assetUuid !== panelData.act.assetUuid;
    }
    return false;
  },
  showCustomComponent() {
    return (
      this.node.components.some(
        (e) => e.isCustom && !Editor.UI.__protected__.Icon.Map.component[e.type]
      ) && this.profile.showCustomScriptIcon
    );
  },
  componentIcon() {
    var e = this.node.components.sort(utils.sortComponents);
    return e.length ? e[0].type : null;
  },
};

exports.watch = {
  state: {
    handler() {
      const e = this;
      var iconWidth = e.node;
      if (e.state === "rename") {
        e.renameValue = iconWidth.name;
        e.renameInputState = "";

        window.setTimeout(() => {
          if (e.$refs.renameInput) {
            e.$refs.renameInput.focusInput();
          }
        });
      } else if (e.state === "add") {
        const { name, parent } = e.addNode;
        var { iconWidth, padding } = panelData.config;
        e.addValue = name;
        e.addInputState = "";
        var r = utils.getNode(parent);
        e.addInputStyle = {
          paddingLeft: (r.depth + 2) * iconWidth + padding + "px",
        };

        window.setTimeout(() => {
          if (e.$refs.addInput) {
            e.$refs.addInput.focus({ preventScroll: true });
            e.$refs.addInput.setSelectionRange(0, name.length);
          }
        });
      }
    },
    immediate: true,
  },
};

exports.methods = {
  t(e) {
    return panelData.$.panel.t(e);
  },
  popupMenu(e) {
    popupContextMenu(e);
  },
  click(e, t) {
    if (t.shiftKey) {
      panelData.$.tree.shiftClick(e.uuid);
    } else if (t.ctrlKey || t.metaKey) {
      panelData.$.tree.ctrlClick(e.uuid);
    } else {
      panelData.$.tree.ipcSelect(e.uuid);
    }
  },
  dblclick(e) {
    clearTimeout(renameTimeId);

    Editor.Message.send(panelData.act.messageProtocol.scene, "focus-camera", [
      e.uuid,
    ]);
  },
  rename(e, t) {
    panelData.$.tree.renameUuid = e.uuid;
    t.preventDefault();
    t.stopPropagation();
  },
  canRename(e) {
    return !utils.canNotRename(e);
  },
  toggle(e, t) {
    const t_currentTarget = t.currentTarget;
    t_currentTarget.setAttribute("animate", "");

    setTimeout(() => {
      t_currentTarget.removeAttribute("animate");
    }, 500);

    panelData.$.tree.toggle(e.uuid, undefined, t.altKey);
  },
  renameChange(e) {
    this.renameValue = e.detail.value.trim();
    this.renameInputState = "";
  },
  renameSubmit(e) {
    let t = e.detail.value.trim();

    if (this.renameInputState !== "") {
      t = null;
    }

    panelData.$.tree.rename(this.renameUuid || this.node.uuid, t);
  },
  renameCancel() {
    this.renameInputState = "cancel";
    panelData.$.tree.rename(this.renameUuid || this.node.uuid, null);
  },
  addChange() {
    var e = this.addNode;
    e.name = this.$refs.addInput.value.trim();
  },
  addSubmit() {
    var e;
    var t;

    if (this.state === "add") {
      e = Object.assign({}, this.addNode);
      t = this.$refs.addInput.value.trim();
      e.name = t;
      panelData.$.tree.addConfirm(e);
    }
  },
  addCancel() {
    this.$refs.addInput.value = "";
    panelData.$.tree.addConfirm(null);
  },
  dragStart(e, t) {
    const a = this;
    let r = [];

    if (panelData.act.selects.includes(e.uuid)) {
      panelData.act.selects.forEach((e) => {
        e = utils.getNode(e);

        if (e) {
          r = a.mergeAdditional(r, e);
        }
      });
    } else {
      r = a.mergeAdditional(r, e);
    }

    if (t.dataTransfer) {
      t.dataTransfer.setData("name", e.name);
      t.dataTransfer.setData("value", e.uuid);
      t.dataTransfer.setData("additional", JSON.stringify(r));
      t.dataTransfer.setData("types", r.map((e) => e.type).join());
      e = new Image();
      e.src =
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAEALAAAAAABAAEAAAICRAEAOw==";
      t.dataTransfer.setDragImage(e, 0, 0);
    }
  },
  dragOver(e, t) {
    t.preventDefault();
    var t_currentTarget = t.currentTarget;
    var r = t_currentTarget.getBoundingClientRect();
    let n = "inside";

    if (t.clientY - r.top <= 4) {
      n = "before";
    } else if (r.bottom - t.clientY <= 7) {
      n = "after";
    }

    t_currentTarget.setAttribute("drag", "over");
    panelData.$.tree.dragOver(e.uuid, n, t.clientX, t.clientY, t_currentTarget);
  },
  dragEnter(e) {
    e.stopPropagation();
    e.preventDefault();
  },
  dragLeave(e, t) {
    t = t.currentTarget;
    t.removeAttribute("insert");
    t.removeAttribute("drag");
  },
  drop(e, t) {
    var a;
    var r;
    var n;
    var i;
    t.preventDefault();

    if (!e.readonly) {
      r = (a = t.currentTarget).getAttribute("insert");
      a.removeAttribute("insert");
      a.removeAttribute("drag");

      panelData.$.tree.$el.hasAttribute("hoving") &&
        (t.stopPropagation(),
        panelData.$.tree.$el.removeAttribute("hoving"),
        (n =
          JSON.parse(
            JSON.stringify(Editor.UI.__protected__.DragArea.currentDragInfo)
          ) || {}),
        (i = a.getAttribute(utils.ATTRIBUTE_TO_NODE) || ""),
        a.removeAttribute(utils.ATTRIBUTE_TO_NODE),
        (n.to = i || e.uuid),
        (n.insert = r),
        (n.copy = t.ctrlKey || (process.platform === "darwin" && t.altKey)),
        (n.keepWorldTransform = !t.shiftKey),
        panelData.$.tree.ipcDrop(n));
    }
  },
  mergeAdditional(e, t) {
    let a = [{ type: t.type, value: t.uuid }];

    (a =
      Array.isArray(t.additional) && t.additional.length
        ? a.concat(t.additional)
        : a).forEach((t) => {
      if (!e.some((e) => e.type === t.type && e.value === t.value)) {
        e.push(t);
      }
    });

    return e;
  },
  toggleLock(e, t) {
    const a = !e.locked;
    const r = !t.altKey;

    if (panelData.act.selects.includes(e.uuid)) {
      panelData.act.selects.forEach((e) => {
        Editor.Message.send(
          panelData.act.messageProtocol.scene,
          "change-node-lock",
          e,
          a,
          r
        );
      });
    } else {
      Editor.Message.send(
        panelData.act.messageProtocol.scene,
        "change-node-lock",
        e.uuid,
        a,
        r
      );
    }
  },
  showInsideLock(e) {
    return (function e(t) {
      if (Array.isArray(treeData.uuidToChildren[t])) {
        for (const r of treeData.uuidToChildren[t]) {
          var a = utils.getNode(r);
          if (a) {
            if (a.locked) {
              return true;
            }
            if (e(r)) {
              return true;
            }
          }
        }
      }
      return false;
    })(e.uuid);
  },
  editPrefab(e) {
    if (e.prefab && e.prefab.assetUuid) {
      Editor.Message.request("asset-db", "open-asset", e.prefab.assetUuid);
    }
  },
  calcEditPrefabIconStyle() {
    var e =
      panelData.$.viewBox.clientWidth + panelData.$.viewBox.scrollLeft - 26;
    this.editPrefabIconStyle.left = e + "px";
  },
  twinkle(e) {
    utils.twinkle.asset(e);
  },
  async queryAssetIcon() {
    var e = this.node;
    if (!e.isPrefabRoot && !e.isScene) {
      return null;
    }
    var t = e.isScene ? e.uuid : e.prefab.assetUuid;
    if (!t) {
      return null;
    }
    e = e.isScene
      ? { type: "icon", value: "scene" }
      : { type: "icon", value: "prefab" };
    try {
      var a = await Editor.UI.AssetImage.previewImageManager.get(t);
      if (a && a.value !== "file") {
        return { type: "asset", value: t };
      }
    } catch (e) {
      console.debug(e);
    }
    return e;
  },
};

exports.inject = ["profile"];
