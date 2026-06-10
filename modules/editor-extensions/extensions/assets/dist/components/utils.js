var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, n = r) => {
        var a = Object.getOwnPropertyDescriptor(t, r);

        if (
          !a ||
          (!("get" in a) ? !a.writable && !a.configurable : t.__esModule)
        ) {
          a = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, n, a);
      }
    : (e, t, r, n) => {
        e[(n = n === undefined ? r : n)] = t[r];
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
    var a = (e) =>
      (a =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var r = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              r[r.length] = t;
            }
          }
          return r;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var r = a(e), n = 0; n < r.length; n++) {
          if (r[n] !== "default") {
            __createBinding(t, e, r[n]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.twinkle = undefined;
exports.canNotDelete = canNotDelete;
exports.canNotCreate = canNotCreate;
exports.canNotCopy = canNotCopy;
exports.canNotDuplicate = canNotDuplicate;
exports.canNotCut = canNotCut;
exports.canNotRename = canNotRename;
exports.canNotDrag = canNotDrag;
exports.canNotPaste = canNotPaste;
exports.isEmptyToPaste = isEmptyToPaste;
exports.canNotDrop = canNotDrop;
exports.canNotRevealInExplorer = canNotRevealInExplorer;
exports.canNotRevealInLibrary = canNotRevealInLibrary;
exports.canNotReimport = canNotReimport;
exports.isSearchingMode = isSearchingMode;
exports.getAsset = getAsset;
exports.getAssetForPreview = getAssetForPreview;
exports.getChildrenForPreview = getChildrenForPreview;
exports.getParent = getParent;
exports.getSibling = getSibling;
exports.getDirectory = getDirectory;
exports.getChildrenUuid = getChildrenUuid;
exports.isAIncludeB = isAIncludeB;
exports.scrollIntoView = scrollIntoView;
exports.closestWhichCanCreate = closestWhichCanCreate;
exports.openAsset = openAsset;
exports.stringToRegExp = stringToRegExp;
exports.transI18nName = transI18nName;
exports.pushAdditional = pushAdditional;
const panelData = __importStar(require("./panel-data"));
const treeData = __importStar(require("./tree-data"));
function canNotDelete(e) {
  return !e || e.isDB || e.readonly || e.isSubAsset;
}
function canNotCreate(e) {
  return !e || e.isSubAsset || e.readonly || !e.isDirectory;
}
function canNotCopy(e) {
  return !e || e.isDB || e.isSubAsset;
}
function canNotDuplicate(e) {
  return (
    !e ||
    !e.uuid ||
    ((e = treeData.uuidToParentUuid[e.uuid]) &&
      canNotCreate(treeData.uuidToAsset[e]))
  );
}
function canNotCut(e) {
  return canNotDelete(e);
}
function canNotRename(e) {
  return canNotDelete(e);
}
function canNotDrag(e) {
  return !e || e.isDB;
}
function canNotPaste(e) {
  return !e || e.isSubAsset || e.readonly || !e.isDirectory;
}
function isEmptyToPaste() {
  var e = Editor.Clipboard.read("assets-copied-info");
  var e = !e || !e.assetInfo.length;
  var t = Editor.Clipboard.read("assets-cut-info");
  var t = !t || !t.assetInfo.length || Editor.Project.path !== t.projectPath;
  return e && t;
}
function canNotDrop(e) {
  return !e || e.readonly;
}
function canNotRevealInExplorer(e) {
  return !e || !e.file || e.isSubAsset;
}
function canNotRevealInLibrary(e) {
  return !e || Object.keys(e.library).length === 0;
}
function canNotReimport(e) {
  return !e || e.isDB;
}
function isSearchingMode() {
  var e;
  var t;
  var r;
  var n;
  var a = panelData.$.panel;
  return (
    !!a &&
    (({
      searchValue: a,
      searchType: e,
      extendSearchFunc: t,
      searchInFolder: r,
      searchAssetTypes: n,
    } = a),
    a !== "" || e === "fails" || t[e] || r || !!n.length)
  );
}
function getAsset(e) {
  return e ? treeData.uuidToAsset[e] : null;
}
async function getAssetForPreview(e, t) {
  return !e || t
    ? null
    : treeData.uuidToAsset[e] ||
        Editor.Message.request("assets", "query-asset", e, !!panelData.$.panel);
}
async function getChildrenForPreview(e, t) {
  return !e || t
    ? null
    : (t = treeData.uuidToChildren[e]) && t.length
    ? t.map((e) => treeData.uuidToAsset[e]).filter(Boolean)
    : Editor.Message.request(
        "assets",
        "query-children",
        e,
        !!panelData.$.panel
      );
}
function getParent(e) {
  return e ? getAsset(treeData.uuidToParentUuid[e]) : null;
}
function getSibling(e) {
  var { displayArray, uuidToAsset } = treeData;
  var n = displayArray.indexOf(e);
  var a = displayArray.length - 1;
  let o = n - 1;
  let i = n + 1;

  if (n === 0) {
    o = a;
  }

  if (n === displayArray.length - 1) {
    i = 0;
  }

  return [
    uuidToAsset[e],
    uuidToAsset[displayArray[o]],
    uuidToAsset[displayArray[i]],
  ];
}
function getDirectory(e) {
  var t = getAsset(e);
  return (
    !!t && (t.isDirectory ? t : getDirectory(treeData.uuidToParentUuid[e]))
  );
}
function getChildrenUuid(e, t, r = false, n = false) {
  var a = treeData.uuidToChildren[e];
  if (a && (!r || treeData.uuidToExpand[e])) {
    var a_length = a.length;
    for (let e = 0; e < a_length; e++) {
      var i = a[e];
      var s = getAsset(i);

      if (s && s.visible) {
        t.push(i);
        !s.isParent || (n && !s.isDirectory) || getChildrenUuid(i, t, r, n);
      }
    }
  }
}
function isAIncludeB(e, t) {
  e = treeData.uuidToAsset[e];
  t = treeData.uuidToAsset[t];
  return !(!e || !t) && t.url.startsWith(e.url + "/");
}
async function scrollIntoView(r, n = false) {
  var a = getAsset(r);
  if (a) {
    await treeData.pointExpand(r);
    var o = panelData.$.viewBox.clientHeight;
    var i = panelData.$.viewBox.offsetWidth;
    var s = panelData.$.viewBox.scrollWidth;
    let e = panelData.$.viewBox.scrollLeft;
    let t = panelData.$.viewBox.scrollTop;
    const d = panelData.config.assetHeight;
    var u = panelData.config.iconWidth;
    var c = panelData.$.tree.scrollTop;
    var l = c + o - d - 4;
    var p = e > a.left;
    var s = i < s && 0.3 * i < a.left - e;

    if (p || s) {
      e = a.left - 2 * u;
    }

    const g = treeData.displayArray.indexOf(r) * d;

    if (n) {
      t = g - o / 2;
    } else if (g <= c) {
      t = g;
    } else if (g >= l) {
      t = g - o + d + 4;

      setTimeout(() => {
        t = g - panelData.$.viewBox.clientHeight + d + 4;

        if (
          panelData.$.viewBox.scrollWidth !== panelData.$.viewBox.clientWidth
        ) {
          t += 10;
        }

        panelData.$.viewBox.scrollTo(e, t);
      }, 100);
    }

    panelData.$.tree.$nextTick(() => {
      panelData.$.viewBox.scrollTo(e, t);
    });
  }
}
function closestWhichCanCreate(e) {
  var t = getAsset(e);
  return t
    ? canNotCreate(t)
      ? t.isDirectory
        ? null
        : closestWhichCanCreate(treeData.uuidToParentUuid[e])
      : t
    : null;
}
async function openAsset(e) {
  if (!e.isSubAsset && !e.isDirectory) {
    try {
      await Editor.Message.request("asset-db", "open-asset", e.url);
    } catch (e) {
      console.error(e);
    }
  }
}
function stringToRegExp(e) {
  var t = e.replace(/^\/|\/[gimsuy]*$/g, "");
  var e = e.replace(/.*\/([gimsuy]*)$/, "$1");
  return new RegExp(t, e);
}
function transI18nName(e) {
  return typeof e != "string"
    ? ""
    : (e.startsWith("i18n:") &&
        ((e = e.replace("i18n:", "")),
        Editor.I18n.t(e) || console.debug(e + " is not defined in i18n"),
        Editor.I18n.t(e))) ||
        e;
}
function pushAdditional(e, t) {
  if (!e.some((e) => e.type === t.type && e.value === t.value)) {
    e.push(t);
  }
}
exports.twinkle = {
  requestAnimationId: 0,
  watch: true,
  start() {
    this.watch = true;
  },
  stop() {
    this.watch = false;
  },
  add(e, t = "hint") {
    if (this.watch) {
      panelData.act.twinkles[e] = t;

      setTimeout(() => {
        panelData.act.twinkles[e] = undefined;
        delete panelData.act.twinkles[e];
        window.cancelAnimationFrame(this.requestAnimationId);

        this.requestAnimationId = requestAnimationFrame(() => {
          panelData.$.tree.render();
        });
      }, 1000 /* 1e3 */);
    }
  },
};
