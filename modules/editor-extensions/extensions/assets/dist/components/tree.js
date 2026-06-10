var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, a, r = a) => {
        var i = Object.getOwnPropertyDescriptor(t, a);

        if (
          !i ||
          (!("get" in i) ? !i.writable && !i.configurable : t.__esModule)
        ) {
          i = {
            enumerable: true,
            get() {
              return t[a];
            },
          };
        }

        Object.defineProperty(e, r, i);
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
    var i = (e) =>
      (i =
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
        for (var a = i(e), r = 0; r < a.length; r++) {
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

exports.watch = undefined;
exports.methods = undefined;
exports.components = undefined;
exports.template = undefined;
exports.props = undefined;
exports.name = undefined;

exports.data = data;
exports.mounted = mounted;

const { join, basename } = require("path");

const { readFileSync } = require("fs");

const panelData = __importStar(require("./panel-data"));
const treeData = __importStar(require("./tree-data"));
const utils = __importStar(require("./utils"));
let vm = null;
let requestAnimationId;
let dragOverUuid;
let dragOverTimeId;
let selectedTimeId;
let refreshingTimeId;
function data() {
  return {
    assets: [],
    renameUrl: "",
    addInfo: {
      type: "",
      importer: "",
      name: "",
      fileExt: "",
      fileName: "",
      parentDir: "",
    },
    intoViewBySelected: "",
    intoViewByUser: "",
    scrollTop: 0,
    droppableTypes: [],
    checkShiftUpDownMerge: { uuid: "", direction: "" },
    searchTimer: undefined,
  };
}
async function mounted() {
  (vm = this).refreshing.ignores = {};
}
exports.name = "tree";

exports.props = {
  droppableTypesProp: {
    type: Array,
    default() {
      return [];
    },
  },
};

exports.template = readFileSync(
  join(__dirname, "../../static/template/tree.html"),
  "utf8"
);

exports.components = { "tree-node": require("./tree-node") };

exports.methods = {
  t(e) {
    return panelData.$.panel.t(e);
  },
  update() {
    vm.droppableTypes = [
      ...vm.droppableTypesProp,
      ...panelData.config.assetTypes(),
    ];

    vm.addInfo.parentDir = "";
    vm.renameUrl = "";
  },
  clear() {
    treeData.clear();
    vm.render();
  },
  refreshing(e, t, a) {
    if (a && vm.refreshing.ignores[a]) {
      delete vm.refreshing.ignores[a];
    } else {
      panelData.$.panel.refreshing = { type: e, name: t };
      window.clearTimeout(refreshingTimeId);

      refreshingTimeId = window.setTimeout(() => {
        panelData.$.panel.refreshing.type = "";
        vm.refreshing.ignores = {};
      }, 1000 /* 1e3 */);
    }
  },
  toggle(e, t, a) {
    if (a) {
      treeData.loopExpand(e, t);
    } else {
      treeData.toggleExpand(e, t);
    }
  },
  nextToggleExpand(e) {
    let t = false;
    e = e.every((e) => {
      var t = treeData.uuidToAsset[e];

      if (!("isParent" in t) || !t.isParent) {
        e = treeData.uuidToParentUuid[e];
      }

      return !treeData.uuidToExpand[e];
    });
    return (t = e ? true : t);
  },
  allToggle() {
    let a = treeData.uuidToChildren[panelData.config.protocol];
    var e = panelData.act.selects.length;
    var r = (a = e ? panelData.act.selects : a).length;
    if (r) {
      var i = vm.nextToggleExpand(a);
      for (let t = 0; t < r; t++) {
        let e = a[t];
        var s = treeData.uuidToAsset[e];

        if (!("isParent" in s) || !s.isParent) {
          e = treeData.uuidToParentUuid[e];
        }

        treeData.loopExpand(e, i);
      }
    }
  },
  selectAll(a) {
    if (utils.isSearchingMode()) {
      Editor.Selection.clear("asset");
      Editor.Selection.select("asset", treeData.displayArray);
    } else {
      let e = a || vm.getFirstSelectSortByDisplay();

      if (!treeData.uuidToChildren[e]) {
        e = treeData.uuidToParentUuid[e];
      }

      var r = [];
      utils.getChildrenUuid(e, r, true);
      a = panelData.act.selects.slice().includes(e);
      let t = true;
      var r_length = r.length;
      for (let e = 0; e < r_length; e++) {
        if (!panelData.act.selects.includes(r[e])) {
          t = false;
        }
      }

      if (t) {
        if (a) {
          if (e !== panelData.config.protocol) {
            vm.selectAll(treeData.uuidToParentUuid[e]);
          }
        } else {
          Editor.Selection.select("asset", e);
        }
      } else {
        Editor.Selection.clear("asset");
        a && r.unshift(e);
        Editor.Selection.select("asset", r);
      }
    }
  },
  selectClear() {
    Editor.Selection.clear("asset");
  },
  selected(e) {
    (e = Array.isArray(e) ? e : [e]).forEach((e) => {
      if (!panelData.act.selects.includes(e)) {
        panelData.act.selects.push(e);
        vm.intoViewBySelected = e;
        window.clearTimeout(selectedTimeId);

        selectedTimeId = window.setTimeout(() => {
          utils.scrollIntoView(vm.intoViewBySelected);
        }, 50);

        e === vm.checkShiftUpDownMerge.uuid && vm.shiftUpDownMergeSelected();
      }
    });

    panelData.$.panel.allExpand = vm.isAllExpand();
  },
  unselected(e) {
    var t = panelData.act.selects.indexOf(e);

    if (-1 !== t) {
      panelData.act.selects.splice(t, 1);
      window.clearTimeout(selectedTimeId);

      selectedTimeId = window.setTimeout(() => {
        treeData.render();
      }, 50);
    }

    if (vm.intoViewBySelected === e) {
      vm.intoViewBySelected = "";
    }
  },
  resetSelected() {
    panelData.act.selects = [];
    var e = Editor.Selection.getSelected("asset");
    vm.selected(e);
    window.clearTimeout(selectedTimeId);
    utils.scrollIntoView(vm.intoViewBySelected, true);
  },
  shiftClick(e) {
    if (panelData.act.selects.length === 0) {
      vm.ipcSelect(e);
    } else {
      var t = [];
      var treeData_displayArray = treeData.displayArray;
      var r = treeData_displayArray.indexOf(panelData.act.selects[0]);
      var i = treeData_displayArray.indexOf(e);
      if (-1 !== r || -1 !== i) {
        if (r <= i) {
          for (let e = r; e <= i; e++) {
            t.push(treeData_displayArray[e]);
          }
        } else {
          for (let e = r; e >= i; e--) {
            t.push(treeData_displayArray[e]);
          }
        }
      }
      vm.ipcSelect(t);
    }
  },
  ctrlClick(e) {
    if (panelData.act.selects.includes(e)) {
      Editor.Selection.unselect("asset", e);
    } else {
      Editor.Selection.select("asset", e);
    }
  },
  ipcSelect(e) {
    Editor.Selection.clear("asset");
    Editor.Selection.select("asset", e);
  },
  ipcSelectFirstChild() {
    Editor.Selection.clear("asset");
    var e = this.getFirstChild();

    if (e) {
      Editor.Selection.select("asset", e);
    }
  },
  click() {
    if (!panelData.$.panel.isOperating) {
      Editor.Selection.clear("asset");
    }
  },
  async addTo(e) {
    if (utils.isSearchingMode()) {
      panelData.$.panel.clearSearch();
      await new Promise((e) => setTimeout(e, 300));
    }

    if (!e.folderUuid) {
      e.folderUuid = vm.getFirstSelect();
    }

    var t;
    var a;
    var r;
    var i = utils.closestWhichCanCreate(e.folderUuid);

    if (!i || treeData.uuidToState[i.uuid]) {
      t = Editor.I18n.t("assets.operate.canNotAddTo", {
        uuid: e.folderUuid,
      });

      console.warn(t);
    } else {
      vm.toggle(i.uuid, true);
      await utils.scrollIntoView(i.uuid);
      r = (t = i.url) + "/" + (e.fileName || "New File") + (a = e.fileExt);

      r = await Editor.Message.request("asset-db", "generate-available-url", r);

      vm.addInfo = {
        url: r,
        importer: e.importer,
        template: e.template,
        content: e.content,
        fileExt: a,
        fileName: basename(r, a),
        name: basename(r),
        parentDir: t,
        parentUuid: i.uuid,
        fileNameCheckConfigs: e.fileNameCheckConfigs,
      };
    }
  },
  async addConfirm(e) {
    var t;
    var a;

    if (e && e.parentDir && e.parentUuid && e.fileName) {
      e.name = e.fileName + e.fileExt;

      (t = utils.closestWhichCanCreate(e.parentUuid)) &&
        ((vm.addInfo.parentDir = ""),
        (treeData.uuidToState[t.uuid] = "add-loading"),
        (panelData.$.panel.isOperating = true),
        (a = e.parentDir + "/" + e.fileName + e.fileExt),
        (await vm.add({
          handler: e.importer,
          target: a,
          template: e.template,
          content: e.content,
          overwrite: true,
        })) ||
          ((treeData.uuidToState[t.uuid] = ""),
          treeData.unFreeze(t.uuid),
          treeData.render()),
        setTimeout(() => {
          panelData.$.panel.isOperating = false;
        }, 200));
    } else {
      vm.addInfo.parentDir = "";
    }
  },
  async add(e) {
    const t = await Editor.Message.request("asset-db", "new-asset", e);
    return t
      ? (vm.ipcSelect(t.uuid),
        setTimeout(() => {
          utils.scrollIntoView(t.uuid);
        }, 300),
        t.uuid)
      : null;
  },
  async added(e, t) {
    panelData.act.twinkleQueue.push({ uuid: e, animation: "shrink" });
    treeData.added(e, t);
    vm.refreshing("added", t.name);
    t = treeData.uuidToParentUuid[e];
    vm.refreshing.ignores[t] = true;
  },
  async changed(e, t) {
    panelData.act.twinkleQueue.push({ uuid: e, animation: "light" });
    treeData.changed(e, t);
    vm.refreshing("changed", t.name, e);
    t = treeData.uuidToParentUuid[e];
    vm.refreshing.ignores[t] = true;

    if (e === vm.intoViewByUser) {
      setTimeout(() => {
        var vm_intoViewByUser = vm.intoViewByUser;
        vm.intoViewByUser = "";
        utils.scrollIntoView(vm_intoViewByUser);
      }, 300);
    }
  },
  async delete(a) {
    let t = [];
    var e = panelData.act.selects.includes(a);
    var r = (t = a && !e ? [a] : panelData.act.selects.slice()).length;
    let i = [];
    for (let e = 0; e < r; e++) {
      const a = t[e];
      var s = utils.getAsset(a);

      if (
        s &&
        !utils.canNotDelete(s) &&
        !i
          .filter((e) => !utils.isAIncludeB(a, e))
          .some((e) => utils.isAIncludeB(e, a))
      ) {
        i.push(a);
      }
    }
    const i_length = i.length;
    if (i_length) {
      let t = "";
      for (let e = 0; e < i_length; e++) {
        var l = i[e];
        if (e > 5) {
          break;
        }
        l = utils.getAsset(l);

        if (l) {
          if (e < 5) {
            t +=
              l.name +
              `
`;
          } else {
            t += "...";
          }
        }
      }
      var o = await Editor.Message.request("asset-db", "execute-script", {
        name: "assets",
        method: "queryDepends",
        args: [i],
      });
      if (o && o.length > 0) {
        t += "\n" + Editor.I18n.t("assets.operate.maybeDependOther");
        for (let e = 0; e < 5 && o[e]; e++) {
          t +=
            `
` + o[e];
        }

        if (o.length > 5) {
          t += "\n...";
        }
      }

      a = Editor.I18n.t("assets.operate.sureDelete", {
        length: String(i_length),
        filelist: t,
      });

      a = await Editor.Dialog.warn(a, {
        buttons: [
          Editor.I18n.t("assets.operate.confirm"),
          Editor.I18n.t("assets.operate.cancel"),
        ],
        default: 0,
        cancel: 1,
        title: Editor.I18n.t("assets.operate.dialogQuestion"),
      });

      if (a.response !== 1) {
        var u = [];
        for (let e = 0; e < i_length; e++) {
          var d = i[e];
          var c = utils.getAsset(d);

          if (c) {
            treeData.uuidToState[d] = "loading";
            treeData.unFreeze(d);

            u.push(Editor.Message.request("asset-db", "delete-asset", c.url));
          }
        }
        treeData.render();

        await Promise.all(u).then(() => {
          for (let e = 0; e < i_length; e++) {
            delete treeData.uuidToState[i[e]];
          }
        });

        if (e) {
          Editor.Selection.clear("asset");
        }
      }
    }
  },
  deleted(e, t) {
    treeData.deleted(e, t);
    vm.refreshing("deleted", t.name);
    t = treeData.uuidToParentUuid[e];
    vm.refreshing.ignores[t] = true;
  },
  upDownLeftRight(t) {
    var e;
    var a = vm.getLastSelect();
    if (t === "right") {
      if (vm.isExpand(a)) {
        e = treeData.uuidToChildren[a];
        Array.isArray(e) && e.length && vm.ipcSelect(e[0]);
      } else {
        vm.toggle(a, true);
      }
    } else if (t === "left") {
      if (vm.isExpand(a)) {
        vm.toggle(a, false);
      } else if (
        (e = treeData.uuidToParentUuid[a]) !== panelData.config.protocol
      ) {
        vm.ipcSelect(e);
      }
    } else {
      var r = utils.getSibling(a);
      let e;
      switch (t) {
        case "up": {
          e = r[1];
          break;
        }
        case "down": {
          e = r[2];
        }
      }

      if (e) {
        vm.ipcSelect(e.uuid);
      }
    }
  },
  async shiftUpDown(e) {
    var t = panelData.act.selects.length;
    if (t !== 0) {
      var [t, a, r] = utils.getSibling(panelData.act.selects[t - 1]);
      var i = panelData.act.selects.includes(a.uuid);
      var s = panelData.act.selects.includes(r.uuid);
      if (e === "up") {
        if (!i) {
          Editor.Selection.select("asset", a.uuid);
          vm.checkShiftUpDownMerge.uuid = a.uuid;
          return void (vm.checkShiftUpDownMerge.direction = e);
        }

        if (!s) {
          Editor.Selection.unselect("asset", t.uuid);
        }

        await utils.scrollIntoView(a.uuid);

        panelData.act.selects.splice(panelData.act.selects.indexOf(a.uuid), 1);

        panelData.act.selects.push(a.uuid);
      }

      if (e === "down") {
        if (s) {
          i || Editor.Selection.unselect("asset", t.uuid);
          await utils.scrollIntoView(r.uuid);

          panelData.act.selects.splice(
            panelData.act.selects.indexOf(r.uuid),
            1
          );

          panelData.act.selects.push(r.uuid);
        } else {
          Editor.Selection.select("asset", r.uuid);
          vm.checkShiftUpDownMerge.uuid = r.uuid;
          vm.checkShiftUpDownMerge.direction = e;
        }
      }
    }
  },
  shiftUpDownMergeSelected() {
    if (vm.checkShiftUpDownMerge.uuid) {
      let e = true;
      let t = vm.checkShiftUpDownMerge.uuid;
      vm.checkShiftUpDownMerge.uuid = "";
      let a = panelData.act.selects.length;

      while (e) {
        var r = utils.getSibling(t);
        if (!(r && r[1] && r[2] && a)) {
          return;
        }

        t = (vm.checkShiftUpDownMerge.direction === "down" ? r[2] : r[1]).uuid;

        a--;

        if (panelData.act.selects.includes(t)) {
          panelData.act.selects.splice(panelData.act.selects.indexOf(t), 1);

          panelData.act.selects.push(t);
        } else {
          e = false;
        }
      }
    }
  },
  async keyboardRename() {
    var e;
    var t;

    if (!vm.renameUrl) {
      e = vm.getFirstSelect();

      (t = utils.getAsset(e)) &&
        !utils.canNotRename(t) &&
        (await utils.scrollIntoView(e), (vm.renameUrl = t.url));
    }
  },
  async rename(e, t = "") {
    var a = utils.getAsset(e);
    if (!a || treeData.uuidToState[e] === "loading") {
      return false;
    }
    vm.renameUrl = "";

    if (utils.canNotRename(a) || t === "" || t === a.fileName) {
      treeData.uuidToState[e] = "";
      treeData.unFreeze(e);
      treeData.render();
      return false;
    }

    var r = utils.getParent(e);
    if (!r) {
      return false;
    }
    treeData.uuidToState[e] = "loading";
    t += a.fileExt;
    r = r.url + "/" + t;
    await Editor.Message.request("asset-db", "move-asset", a.url, r);
    treeData.uuidToState[e] = "";
    treeData.unFreeze(e);
    treeData.resort();
    return true;
  },
  sort() {
    treeData.resort();
  },
  clearSearchTimer() {
    window.clearTimeout(vm.searchTimer);
    vm.searchTimer = null;
  },
  search() {
    treeData.render();
    vm.clearSearchTimer();

    if (panelData.$.panel.searchValue) {
      vm.searchTimer = window.setTimeout(() => {
        panelData.$.viewBox.scrollTo(0, 0);
      }, 100);
    } else if (!panelData.$.panel.searchInFolder) {
      vm.searchTimer = window.setTimeout(() => {
        utils.scrollIntoView(vm.intoViewBySelected, true);
      }, 100);
    }
  },
  dragOver(s, n) {
    window.cancelAnimationFrame(requestAnimationId);

    requestAnimationId = requestAnimationFrame(() => {
      var t = utils.getAsset(s);
      if (t) {
        if (t.isDirectory) {
          var a = Date.now();

          var a =
            (dragOverUuid !== s
              ? ((dragOverUuid = s), (dragOverTimeId = a))
              : 800 < a - dragOverTimeId && vm.toggle(s, true),
            panelData.$.viewBox);

          var r = vm.scrollTop % panelData.config.assetHeight;

          var i =
            a.getBoundingClientRect().top - vm.$el.getBoundingClientRect().top;

          var r =
            treeData.displayArray.indexOf(s) * panelData.config.assetHeight +
            r -
            i +
            3;

          var i = [];
          let e = t.readonly ? 0 : 1;

          if (vm.isSearchingMode()) {
            if (n) {
              e = n.isDirectory ? e : 0;
            }
          } else {
            utils.getChildrenUuid(s, i, true);
          }

          panelData.$.panel.dropBoxStyle = {
            left: a.scrollLeft + "px",
            top: r + "px",
            height: (i.length + 1) * panelData.config.assetHeight + 2 + "px",
            opacity: e,
          };
        } else {
          if (!vm.isSearchingMode()) {
            vm.dragOver(treeData.uuidToParentUuid[s], n || t);
          }
        }
      }
    });
  },
  dragLeave(e) {
    let t = utils.getAsset(e);

    if ((t = t && !t.isDirectory ? utils.getParent(e) : t)) {
      treeData.uuidToState[t.uuid] = "";
    }
  },
  async drop(e) {
    if (!utils.isSearchingMode()) {
      var t =
        JSON.parse(
          JSON.stringify(Editor.UI.__protected__.DragArea.currentDragInfo)
        ) || {};
      if (vm.assets[0]) {
        var a = vm.assets[0].uuid;
        var r = Array.from(e.dataTransfer.files);

        if (r && r.length > 0) {
          t.type = "osFile";
          t.files = r;
        }

        if (t.value) {
          r = utils.getParent(t.value);
          if (r && r.uuid === a) {
            return;
          }
        }

        t.to = a;
        t.copy = e.ctrlKey;
        vm.ipcDrop(t);
      }
    }
  },
  dragEnter() {
    if (utils.isSearchingMode()) {
      panelData.$.panel.dropBoxStyle = {};
    } else {
      window.cancelAnimationFrame(requestAnimationId);

      requestAnimationId = requestAnimationFrame(() => {
        vm.dragOver(treeData.displayArray[0]);
      });
    }
  },
  async ipcDrop(a) {
    panelData.$.panel.focusWindow();

    if (utils.isSearchingMode()) {
      panelData.$.panel.clearSearch();
      await new Promise((e) => setTimeout(e, 300));
    }

    const r = utils.getDirectory(a.to);
    if (!r || utils.canNotCreate(r)) {
      e = Editor.I18n.t("assets.operate.canNotDrop", { uuid: a.to });
      console.warn(e);
    } else {
      if (
        panelData.config.extendDrop.types &&
        panelData.config.extendDrop.types.includes(a.type)
      ) {
        var e = Object.values(panelData.config.extendDrop.callbacks[a.type]);
        if (Array.isArray(e)) {
          const n = utils.getAsset(a.to);
          if (!n) {
            return void console.debug("Can not find asset " + a.to);
          }
          try {
            if (
              !(
                await Promise.all(
                  e.map((e) =>
                    e(
                      {
                        uuid: n.uuid,
                        type: n.type,
                        isDirectory: n.isDirectory,
                        targetUrl: n.url,
                      },
                      a.additional
                    )
                  )
                )
              ).every((e) => e === false)
            ) {
              return;
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
      if (a.type === "osFile") {
        if (Array.isArray(a.files)) {
          e = a.files.map((e) => e.path);
          treeData.uuidToState[r.uuid] = "loading";
          treeData.unFreeze(r.uuid);
          treeData.render();

          const l = await e.reduce(async (e, t) => {
            var e = await e;
            var a = r.url + "/" + basename(t);

            if (
              a !==
              (await Editor.Message.request(
                "asset-db",
                "generate-available-url",
                a
              ))
            ) {
              e.push({ file: t, name: basename(t) });
            }

            return e;
          }, Promise.resolve([]));

          const o = { overwrite: false, rename: false };
          let u_value = false;
          if (l.length > 0) {
            let e = l
              .map((e) => e.name)
              .slice(0, 5)
              .join("\n");

            if (l.length > 5) {
              e += "\n ...";
            }

            var i = await Editor.Dialog.warn(
              Editor.I18n.t("assets.operate.repeatTip"),
              {
                title: Editor.I18n.t("assets.operate.dialogQuestion"),
                detail: e,
                buttons: [
                  Editor.I18n.t("assets.operate.overwrite"),
                  Editor.I18n.t("assets.operate.rename"),
                  Editor.I18n.t("assets.operate.cancel"),
                ],
                default: 0,
                cancel: 2,
              }
            );

            if (i.response === 0) {
              o.overwrite = true;
            } else if (i.response === 1) {
              o.rename = true;
            } else {
              u_value = true;
            }
          }

          if (!u_value && e.length) {
            await Promise.all(
              e.map((t) =>
                Editor.Message.request(
                  "asset-db",
                  "import-asset",
                  t,
                  r.url + "/" + basename(t),
                  l.some((e) => e.file === t) ? o : {}
                )
              )
            );
          }

          treeData.uuidToState[r.uuid] = "";
          treeData.unFreeze(r.uuid);
          treeData.render();
        }
      } else if (a.type === "cc.Node") {
        for (const u of a.additional) {
          if (u.type === "cc.Node") {
            var u_value = u.value;
            var s = await Editor.Message.request(
              "scene",
              "query-node",
              u_value
            );
            var s = `${r.url}/${s.name.value || "Node"}.prefab`;
            const d = await Editor.Message.request(
              "scene",
              "create-prefab",
              u_value,
              s
            );

            if (d) {
              vm.ipcSelect(d);

              setTimeout(() => {
                utils.scrollIntoView(d);
              }, 300);
            }
          }
        }
      } else {
        if (a.additional && Array.isArray(a.additional)) {
          if (a.copy) {
            i = a.additional.map((e) => e.value.split("@")[0]);
            vm.copy([...new Set(i)]);
            vm.paste(a.to);
          } else {
            await vm.move(a, r);
          }
        }
      }
    }
  },
  copy(t) {
    if (!panelData.$.panel.isOperating) {
      let e = [];

      t = (e = Array.isArray(t)
        ? t
        : t && !panelData.act.selects.includes(t)
        ? [t]
        : panelData.act.selects.slice()).filter((e) => {
        e = utils.getAsset(e);
        return e && !utils.canNotCopy(e);
      });

      t =
        (t.forEach((e) => {
          utils.twinkle.add(e, "light");
        }),
        vm.uuidsToCopiedInfo(t));

      Editor.Clipboard.write("assets-copied-info", t);
      vm.render();
    }
  },
  async paste(e, t) {
    if (!panelData.$.panel.isOperating) {
      e = e || vm.getFirstSelect();
      let i = utils.closestWhichCanCreate(e);
      if (i) {
        var a = Editor.Clipboard.read("assets-cut-info");
        if (a && a.assetInfo.length && Editor.Project.path === a.projectPath) {
          a = a.assetInfo.map((e) => e.uuid);

          return i && a.includes(i.uuid)
            ? undefined
            : ((a = {
                additional: a.map((e) => ({
                  value: e,
                })),
              }),
              await vm.move(a, i),
              void Editor.Clipboard.clear());
        }
        if (!t) {
          var a = Editor.Clipboard.read("assets-copied-info");
          let e = [];

          if (a) {
            t = a.assetInfo.map((e) => e.uuid);

            e = a.assetInfo.map((e) => ({
              srcPath: e.file,
              tarPath: i.url + "/" + e.name,
            }));
          }

          if (e.length && Editor.Project.path !== a.projectPath) {
            treeData.uuidToState[i.uuid] = "loading";
            treeData.unFreeze(i.uuid);
            treeData.render();
            vm.toggle(i.uuid, true);
            for (const o of e) {
              await Editor.Message.request(
                "asset-db",
                "import-asset",
                o.srcPath,
                o.tarPath
              );
            }
            return void (treeData.uuidToState[i.uuid] = "");
          }
        }
        if (i && t?.includes(i.uuid)) {
          if (
            !(i = utils.closestWhichCanCreate(
              treeData.uuidToParentUuid[i.uuid]
            ))
          ) {
            a = Editor.I18n.t("assets.operate.canNotPaste", { uuid: e });
            return void console.warn(a);
          }
        }
        const l = [];

        t?.forEach((e) => {
          var t;
          var a;
          var r = utils.getAsset(e);

          if (
            r &&
            ((t = !utils.canNotCopy(r)) ||
              ((a = Editor.I18n.t("assets.operate.copyFail") + ": " + r.name),
              console.warn(a)),
            (a = utils.isAIncludeB(e, i.uuid)) &&
              ((r =
                Editor.I18n.t("assets.operate.errorPasteParentToChild") +
                ": " +
                r.name),
              console.warn(r)),
            t) &&
            !a
          ) {
            l.push(e);
          }
        });

        if (l.length !== 0) {
          let e = 0;
          let t;
          var r = [];
          treeData.uuidToState[i.uuid] = "loading";
          treeData.unFreeze(i.uuid);
          treeData.render();
          vm.toggle(i.uuid, true);
          do {
            var s;
            var n = utils.getAsset(l[e]);
            e++;
            t = null;

            if (
              n &&
              ((s = basename(n.url)),
              (s = i.url + "/" + s),
              (s = await Editor.Message.request(
                "asset-db",
                "generate-available-url",
                s
              )),
              (t = await Editor.Message.request(
                "asset-db",
                "copy-asset",
                n.url,
                s
              )))
            ) {
              vm.intoViewByUser = t.uuid;
              r.push(t.uuid);
            }
          } while (t);
          treeData.uuidToState[i.uuid] = "";
          vm.ipcSelect(r);
        }
      } else {
        a = Editor.I18n.t("assets.operate.canNotPaste", { uuid: e });
        console.warn(a);
      }
    }
  },
  cut(t) {
    if (!panelData.$.panel.isOperating) {
      let e = [];

      t = (e = Array.isArray(t)
        ? t
        : t && !panelData.act.selects.includes(t)
        ? [t]
        : panelData.act.selects.slice()).filter((e) => {
        e = utils.getAsset(e);
        return e && !utils.canNotCut(e);
      });

      t =
        (t.forEach((e) => {
          utils.twinkle.add(e, "light");
        }),
        vm.uuidsToCopiedInfo(t));

      Editor.Clipboard.write("assets-cut-info", t);
      vm.render();
    }
  },
  uuidsToCopiedInfo(e) {
    const t = {};
    t.projectPath = Editor.Project.path;
    t.assetInfo = [];

    e.forEach((e) => {
      e = utils.getAsset(e);

      e = {
        uuid: e ? e.uuid : "",
        file: e ? e.file : "",
        name: e ? e.name : "",
      };

      t.assetInfo.push(e);
    });

    return t;
  },
  async duplicate(e) {
    if (!panelData.$.panel.isOperating) {
      e = (e = e || panelData.act.selects.slice().filter(Boolean)).filter(
        (e) => {
          e = utils.getAsset(e);
          return e && !utils.canNotDuplicate(e);
        }
      );
      if (e.length !== 0) {
        try {
          for (const t of e) {
            await vm.paste(treeData.uuidToParentUuid[t], [t]);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  },
  async move(t, a) {
    if (t && a && Array.isArray(t.additional)) {
      vm.toggle(a.uuid, true);
      var r = t.additional.map((e) => e.value.split("@")[0]);
      r.sort((e, t) => treeData.uuidToIndex[e] - treeData.uuidToIndex[t]);
      const p = [];
      var r_length = r.length;
      for (let e = 0; e < r_length; e++) {
        var s;
        var n;
        var l = r[e];

        if (!p.includes(l)) {
          s = utils.getAsset(l);
          n = utils.getParent(l);

          s &&
            n &&
            (a.uuid === s.uuid ||
              utils.canNotCut(s) ||
              utils.isAIncludeB(s.uuid, t.to) ||
              (a.uuid !== n.uuid && p.push(l)));
        }
      }
      var o = [];
      const p_length = p.length;
      for (let e = 0; e < p_length; e++) {
        var u = p[e];
        var d = utils.getAsset(u);
        var c = utils.getParent(u);

        if (d && c) {
          vm.intoViewByUser = d.uuid;
          treeData.uuidToState[u] = "loading";
          treeData.unFreeze(u);
          treeData.render();
          c = a.url + "/" + basename(d.url);

          d.instantiation
            ? o.push(Editor.Message.request("asset-db", "init-asset", d.url, c))
            : o.push(
                Editor.Message.request("asset-db", "move-asset", d.url, c)
              );
        }
      }

      await Promise.all(o).finally(() => {
        for (let e = 0; e < p_length; e++) {
          var t = p[e];
          treeData.uuidToState[t] = "";
          treeData.unFreeze(t);
        }
        treeData.render();
      });

      vm.ipcSelect(p);
    }
  },
  async reimport(t) {
    let a = [];
    var r = (a = panelData.act.selects.includes(t)
      ? panelData.act.selects
      : [t]).length;
    let i = [];
    for (let e = 0; e < r; e++) {
      const t = a[e];
      var s = utils.getAsset(t);
      if (s && !utils.canNotReimport(s)) {
        if (s.isDirectory) {
          if (!i.includes(t)) {
            i.push(t);
          }

          s = treeData.uuidToChildren[t];
          if (Array.isArray(s)) {
            for (const n of s) {
              if (!i.includes(n)) {
                i.push(n);
              }
            }
          }
        } else {
          if (
            !(i = i.filter((e) => !utils.isAIncludeB(t, e))).some((e) =>
              utils.isAIncludeB(e, t)
            ) &&
            !i.includes(t)
          ) {
            i.push(t);
          }
        }
      }
    }
    if (i.length) {
      for (const e of i) {
        treeData.uuidToState[e] = "loading";
        treeData.unFreeze(e);
      }
      treeData.render();
      for (const l of i) {
        await Editor.Message.request("asset-db", "reimport-asset", l);
        treeData.uuidToState[t] = "";
        treeData.unFreeze(t);
        treeData.render();
      }
    }
  },
  render() {
    panelData.$.panel.treeHeight =
      treeData.displayArray.length * panelData.config.assetHeight;

    panelData.$.panel.allExpand = vm.isAllExpand();
    vm.filterAssets();

    while (panelData.act.twinkleQueue.length) {
      var e = panelData.act.twinkleQueue.shift();
      utils.twinkle.add(e.uuid, e.animation);
    }
  },
  filterAssets() {
    vm.assets = [];
    var e = vm.scrollTop % panelData.config.assetHeight;
    var t = vm.scrollTop - e;
    var a = t + panelData.$.panel.viewHeight;

    var e =
      ((vm.$el.style.top = `-${e}px`),
      Math.round(t / panelData.config.assetHeight));

    var t = Math.ceil(a / panelData.config.assetHeight) + 1;
    vm.assets = treeData.outputDisplay(e, t);
  },
  getFirstSelect() {
    var e = panelData.act.selects[0];
    return e || treeData.displayArray[0];
  },
  getLastSelect() {
    var e = panelData.act.selects.length;
    return e
      ? panelData.act.selects[e - 1]
      : ((e = treeData.displayArray.length), treeData.displayArray[e - 1]);
  },
  getFirstSelectSortByDisplay() {
    let t = panelData.config.protocol;
    var a = treeData.displayArray.length;
    var r = panelData.act.selects.length;
    if (r) {
      for (let e = 0; e < r; e++) {
        var i = panelData.act.selects[e];

        if (treeData.displayArray.indexOf(i) < a) {
          t = i;
        }
      }
    }
    return t;
  },
  getFirstChild() {
    return treeData.displayArray[0];
  },
  isExpand(e) {
    return treeData.uuidToExpand[e];
  },
  isSelect(e) {
    return panelData.act.selects.includes(e);
  },
  getTwinkle(e) {
    return panelData.act.twinkles[e] ?? "";
  },
  isAllExpand() {
    let a = true;
    let r = treeData.uuidToChildren[panelData.config.protocol];
    var e = panelData.act.selects.length;
    if (!(r = e ? panelData.act.selects : r) || !r.length) {
      return a;
    }
    var r_length = r.length;
    for (let t = 0; t < r_length; t++) {
      let e = r[t];
      var s = treeData.uuidToAsset[e];

      if (s && "isParent" in s && !s.isParent) {
        e = treeData.uuidToParentUuid[e];
      }

      if (treeData.uuidToExpand[e]) {
        a = false;
        break;
      }
    }
    return !a;
  },
  isSearchingMode() {
    return utils.isSearchingMode();
  },
  async dialogError(e) {
    await Editor.Dialog.error(Editor.I18n.t("assets.operate." + e), {
      title: Editor.I18n.t("assets.operate.dialogError"),
    });
  },
};

exports.watch = {
  scrollTop() {
    vm.filterAssets();
  },
  activeAsset() {
    panelData.$.panel.activeAsset = vm.activeAsset;
  },
};
