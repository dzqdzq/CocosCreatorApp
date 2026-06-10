Object.defineProperty(exports, "__esModule", { value: true });
exports.changeMetaUuid = changeMetaUuid;
exports.isLegalMetaFile = isLegalMetaFile;
exports.metricCreateAsset = metricCreateAsset;
exports.formatCreateMenu = formatCreateMenu;
exports.sortAssetCreateMenu = sortAssetCreateMenu;
exports.handleAssetOption = handleAssetOption;

const {
  statSync,
  readdir,
  existsSync,
  readJson,
  outputJson,
} = require("fs-extra");

const { join } = require("path");

const asset_config_1 = require("./asset-config");
const v4 = require("node-uuid").v4;
async function changeMetaUuid(e) {
  var t = statSync(e);
  if (t.isDirectory()) {
    for (const r of await readdir(e)) {
      await changeMetaUuid(join(e, r));
    }
  } else if (existsSync(e) && e.endsWith(".meta")) {
    try {
      var a = await readJson(e);
      a.uuid = v4();
      await outputJson(e, a);
    } catch (e) {
      console.warn("" + Editor.I18n.t("asset-db.copyAsset.fail.metauuid"));
      console.warn(e);
    }
  }
}
async function isLegalMetaFile(e) {
  if (!existsSync(e) || !e.endsWith(".meta")) {
    return false;
  }
  if (!statSync(e).isFile()) {
    return false;
  }
  try {
    var t = await readJson(e);
    return "subMetas" in t && "userData" in t ? true : false;
  } catch (e) {
    return false;
  }
}
function metricCreateAsset(e) {
  let t = "";
  let a = "";

  if (e.endsWith(".animgraph")) {
    t = "animationStateMachine";
    a = "A100000";
  } else if (e.endsWith(".animask")) {
    t = "animationStateMachine";
    a = "A100001";
  }

  if (t && a) {
    Editor.Metrics._trackEventWithTimer({ category: t, id: a, value: 1 });
  }
}
function formatCreateMenu(e) {
  const a = [];
  const t = {};
  const r = {};

  e.forEach((e) => {
    (e.group
      ? (t[e.group] ||
          ((t[e.group] = { handler: e.group, list: [] }), a.push(t[e.group])),
        collectCreateTemplateFromMenu(e, r),
        t[e.group].list)
      : (collectCreateTemplateFromMenu(e, r), a)
    ).push(e);
  });

  const s = [];

  sortAssetCreateMenu(a);

  a.forEach((e, t) => {
    if (e.list) {
      s.push(...e.list);
    } else {
      s.push(e);
    }

    if (t !== a.length - 1) {
      s.push({ type: "separator" });
    }
  });

  e = sortAssetCreateMenu(Object.values(r));
  s.push({ label: "i18n:asset-db.createAssetTemplate.title", submenu: e });
  return s;
}
function collectCreateTemplateFromMenu(e, t) {
  if (e.handler && e.template && !t[e.handler]) {
    t[e.handler] = {
      label: e.label,
      handler: e.handler,
      message: {
        target: "asset-db",
        name: "create-asset-template",
        params: [e.handler, e.template || ""],
      },
    };
  } else if (e.submenu) {
    e.submenu.forEach((e) => collectCreateTemplateFromMenu(e, t));
  }

  return t;
}
function sortAssetCreateMenu(e) {
  e.sort(
    (e, t) =>
      (asset_config_1.createListOrder.includes(e.handler)
        ? asset_config_1.createListOrder.indexOf(e.handler)
        : asset_config_1.createListOrder.length) -
      (asset_config_1.createListOrder.includes(t.handler)
        ? asset_config_1.createListOrder.indexOf(t.handler)
        : asset_config_1.createListOrder.length)
  );

  return e;
}
async function handleAssetOption(e, t) {
  return (t = t || {}).overwrite
    ? "overwrite"
    : t.rename
    ? "rename"
    : (t = await Editor.Dialog.warn(
        Editor.I18n.t("asset-db.operation.overwrite"),
        {
          title: Editor.I18n.t("asset-db.operate.dialogQuestion"),
          detail: e,
          buttons: [
            Editor.I18n.t("asset-db.operate.overwrite"),
            Editor.I18n.t("asset-db.operate.rename"),
            Editor.I18n.t("asset-db.operate.cancel"),
          ],
          default: 0,
          cancel: 2,
        }
      )).response === 0
    ? "overwrite"
    : t.response === 1
    ? "rename"
    : "cancel";
}
