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
exports.components = undefined;
exports.template = undefined;
exports.name = undefined;

exports.data = data;

const { readFileSync } = require("fs");

const { join, basename } = require("path");

const { popupContextMenu } = require("./panel-menu");

const panelData = __importStar(require("./panel-data"));
const treeData = __importStar(require("./tree-data"));
const utils = __importStar(require("./utils"));
const tree_node_icon_1 = require("./tree-node-icon");

const { transI18nName } = require("./utils");

const illegalFileName = /[\\/:*?"<>|]+/;
let renameTimeId;
function data() {
  return {
    renameUuid: "",
    renameValue: "",
    renameInputState: "",
    addInputState: {},
  };
}
exports.name = "tree-node";

exports.template = readFileSync(
  join(__dirname, "../../static/template/tree-node.html"),
  "utf8"
);

exports.components = { "tree-node-icon": tree_node_icon_1.TreeNodeIcon };

exports.props = {
  asset: { type: Object },
  expand: Boolean,
  select: Boolean,
  renameUrl: String,
  addInfo: Object,
  twinkle: String,
};

exports.computed = {
  displayName() {
    var e = this.asset;
    return basename(e.path) || e.displayName || e.fileName;
  },
  state() {
    var e = this;
    var e_asset = e.asset;
    return e_asset
      ? e_asset.url && e.renameUrl === e_asset.url
        ? "rename"
        : e_asset.url && e.addInfo.parentDir === e_asset.url
        ? (e.addState(), "add")
        : treeData.uuidToState[e_asset.uuid] || ""
      : "";
  },
  draggable() {
    var e = this.asset;
    return !e ||
      treeData.uuidToState[e.uuid] ||
      this.state !== "" ||
      utils.canNotDrag(e)
      ? "false"
      : "true";
  },
  style() {
    var e = this.asset.left;
    return { paddingLeft: e + "px" };
  },
  addInputStyle() {
    var { left, isParent } = this.asset;
    var a = panelData.config.iconWidth;
    return { paddingLeft: left + a / 2 + (isParent ? a : 0) + "px" };
  },
  showInnerInvalid() {
    var e = this.asset;
    return (
      !this.expand &&
      e.isDB !== true &&
      e.isParent === true &&
      treeData.getChildrenInvalid(e.uuid)
    );
  },
  showInvalid() {
    return this.asset.invalid || this.showInnerInvalid;
  },
};

exports.watch = {
  state() {
    const e = this;
    var e_asset = e.asset;

    if (e.state === "rename") {
      e.renameUuid = e_asset.uuid;
      e.renameValue = e_asset.fileName;
      e.renameInputState = "";

      e.$nextTick(() => {
        if (e.$refs.renameInput) {
          e.$refs.renameInput.focusInput();
        }
      });
    } else if (e.state === "add") {
      e.addState();
    }
  },
};

exports.methods = {
  t(e) {
    return panelData.$.panel.t(e);
  },
  async dblclick(e) {
    clearTimeout(renameTimeId);

    if (e.isDirectory) {
      if (utils.isSearchingMode()) {
        panelData.$.tree.toggle(e.uuid, true);
        panelData.$.panel.clearSearch();
        await utils.scrollIntoView(e.uuid, true);
      } else {
        panelData.$.tree.toggle(e.uuid);
      }
    } else {
      await utils.openAsset(e);
    }
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
  rename(e, t) {
    panelData.$.tree.renameUrl = e.url;
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
  async renameChange(e) {
    var t = this;
    const { uuid, fileExt, fileName } = t.asset;
    var i = treeData.uuidToParentUuid[uuid];

    var i = (treeData.uuidToChildren[i] || [])
      .map((e) => {
        e = utils.getAsset(e);
        return e && e.fileExt === fileExt && e.fileName !== fileName
          ? e.fileName
          : null;
      })
      .filter(Boolean);

    t.renameValue = e.detail.value.trim();
    let s = "";

    if (i.includes(t.renameValue)) {
      s = "errorNewnameDuplicate";
    } else if (t.renameValue === "") {
      s = "errorNewnameEmpty";
    } else if (illegalFileName.test(t.renameValue)) {
      s = "errorNewnameUnlegal";
    }

    t.renameInputState = s;
  },
  renameSubmit(e) {
    let t = e.detail.value.trim();

    if (this.renameInputState !== "" || !t) {
      t = "";
    }

    panelData.$.tree.rename(this.renameUuid || this.asset.uuid, t);
  },
  async addChange() {
    const { parentUuid, fileExt, fileNameCheckConfigs } = this.addInfo;

    var r = (treeData.uuidToChildren[parentUuid] || [])
      .map((e) => {
        e = utils.getAsset(e);
        return e && e.fileExt === fileExt ? e.fileName : null;
      })
      .filter(Boolean);

    var n = this.$refs.addInput.value;
    let i = n.trim();

    if (i.endsWith(fileExt)) {
      i = i.substr(0, i.lastIndexOf(fileExt));
    }

    var s = { state: "", title: "", message: "" };

    if (r.includes(i)) {
      s.state = "errorNewnameDuplicate";
    } else if (i === "") {
      s.state = "errorNewnameEmpty";
    } else if (illegalFileName.test(i)) {
      s.state = "errorNewnameUnlegal";
    } else if (
      fileNameCheckConfigs &&
      (r = fileNameCheckConfigs.find(
        (e) => !utils.stringToRegExp(e.regStr).test(i)
      ))
    ) {
      s.state = r.failedType;
      s.title = transI18nName(r.failedInfo);
    }

    if (
      s.state &&
      !s.title &&
      ((s.title = this.t("operate." + s.state)), "message" in s)
    ) {
      s.title = s.title.replace("$$className", s.message);
    }

    this.addInputState = s;
    this.addInfo.fileName = n;
  },
  addSubmit() {
    var e = this;
    var t = Object.assign({}, e.addInfo);
    let a = e.$refs.addInput.value.trim();

    if (a.endsWith(e.addInfo.fileExt)) {
      a = a.substr(0, a.lastIndexOf(e.addInfo.fileExt));
    }

    if (
      (e.addInputState.state && e.addInputState.state.startsWith("error")) ||
      !a
    ) {
      panelData.$.tree.addConfirm(null);
    } else {
      t.fileName = a;
      panelData.$.tree.addConfirm(t);
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
        e = utils.getAsset(e);

        if (e) {
          r = a.mergeAdditional(r, e);
        }
      });
    } else {
      r = a.mergeAdditional(r, e);
    }

    if (t.dataTransfer) {
      t.dataTransfer.setData("name", e.name);
      t.dataTransfer.setData("value", (e.redirect || e).uuid);
      t.dataTransfer.setData("additional", JSON.stringify(r));

      e = r
        .map((e) => {
          var t = [e.type];

          if (e.subAssets) {
            t.push(...Object.values(e.subAssets).map((e) => e.type));
          }

          if (Array.isArray(e.extends)) {
            t.push(...e.extends);
          }

          return t;
        })
        .flat()
        .filter(Boolean);

      t.dataTransfer.setData("types", [...new Set(e)].join());
      e = new Image();
      e.src =
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAEALAAAAAABAAEAAAICRAEAOw==";
      t.dataTransfer.setDragImage(e, 0, 0);
    }
  },
  dragOver(e, t) {
    t.preventDefault();
    t = t.currentTarget;
    t.setAttribute("drag", "over");
    t.setAttribute("insert", "inside");
    panelData.$.tree.dragOver(e.uuid);
  },
  dragLeave(e, t) {
    t = t.currentTarget;
    t.removeAttribute("insert");
    t.removeAttribute("drag");
    panelData.$.tree.dragLeave(e.uuid);
  },
  drop(e, t) {
    var a;
    var r;
    var n;

    if (utils.isSearchingMode() && !e.isDirectory) {
      t.preventDefault();
    } else {
      t.preventDefault();
      a = (r = t.currentTarget).getAttribute("insert");
      r.removeAttribute("insert");
      r.removeAttribute("drag");

      (r = panelData.$.tree.$el).hasAttribute("hoving") &&
        (t.stopPropagation(),
        r.removeAttribute("hoving"),
        utils.canNotDrop(e) ||
          ((r =
            JSON.parse(
              JSON.stringify(Editor.UI.__protected__.DragArea.currentDragInfo)
            ) || {}),
          (n = Array.from(t.dataTransfer.files)) &&
            n.length > 0 &&
            ((r.type = "osFile"), (r.insert = "inside"), (r.files = n)),
          (r.to = e.uuid),
          (r.insert = a),
          (r.copy = t.ctrlKey || (process.platform === "darwin" && t.altKey)),
          panelData.$.tree.ipcDrop(r)));
    }
  },
  mergeAdditional(e, t) {
    let a = [{ type: t.type, value: t.uuid, name: t.name, extends: t.extends }];

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
  addState() {
    const e = this;
    const t = e.addInfo.name;
    e.addInputState = {};

    e.$nextTick(() => {
      if (e.$refs.addInput) {
        e.$refs.addInput.focus({ preventScroll: true });
        e.$refs.addInput.setSelectionRange(0, t.length);
      }
    });
  },
};

exports.inject = ["profile"];
