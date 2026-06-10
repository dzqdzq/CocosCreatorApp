Object.defineProperty(exports, "__esModule", { value: true });
exports.assetDBMask = undefined;
exports.assetDBStart = assetDBStart;
exports.assetAdd = assetAdd;
exports.assetAdded = assetAdded;
exports.assetChange = assetChange;
exports.assetChanged = assetChanged;
exports.assetDelete = assetDelete;
exports.assetDeleted = assetDeleted;
const data = { wait: false, percent: "0/0", execList: {} };
function updateImportMaskImmediately() {
  let t = "";
  let e = 0;
  for (const s in data.execList) {
    if (5 <= ++e) {
      break;
    }
    t += data.execList[s].url + "<br />";
  }
  exports.assetDBMask.update(
    "import-asset",
    Editor.I18n.t("asset-db.mask.loading") + " " + data.percent,
    t
  );
}
function updateImportMask() {
  if (!data.wait) {
    updateImportMaskImmediately();
    data.wait = true;

    setTimeout(() => {
      data.wait = false;
      updateImportMaskImmediately();
    }, 200);
  }
}
function assetDBStart(t, e) {
  exports.assetDBMask.update(
    "import-asset",
    "" + Editor.I18n.t("asset-db.mask.startup", { name: t }),
    e
  );
}
function assetAdd(t) {
  data.execList[t.uuid] = t;
  updateImportMask();
}
function assetAdded(t) {
  var { current, total } = t._assetDB.assetProgressInfo;
  data.percent = current + "/" + total;
  delete data.execList[t.uuid];
  updateImportMask();
}
function assetChange(t) {
  data.execList[t.uuid] = t;
  updateImportMask();
}
function assetChanged(t) {
  var { current, total } = t._assetDB.assetProgressInfo;
  data.percent = current + "/" + total;
  delete data.execList[t.uuid];
  updateImportMask();
}
function assetDelete(t) {
  data.execList[t.uuid] = t;
  updateImportMask();
}
function assetDeleted(t) {
  var { current, total } = t._assetDB.assetProgressInfo;
  data.percent = current + "/" + total;
  delete data.execList[t.uuid];
  updateImportMask();
}
class AssetDBMask {
  enabled = !Editor.App.args.debugAssets;
  add(...t) {
    if (this.enabled) {
      Editor.Task.__protected__.addSyncTask(...t);
    }
  }
  remove(t) {
    if (this.enabled) {
      Editor.Task.__protected__.removeSyncTask(t);
    }
  }
  update(...t) {
    if (this.enabled) {
      Editor.Task.__protected__.updateSyncTask(...t);
    }
  }
}
exports.assetDBMask = new AssetDBMask();
