Object.defineProperty(exports, "__esModule", { value: true });
exports.zip = zip;
exports.generateAvailableURL = generateAvailableURL;
exports.importAsset = importAsset;
exports.copyAsset = copyAsset;
exports.renameAsset = renameAsset;
exports.moveAsset = moveAsset;
exports.deleteAsset = deleteAsset;
exports.reimportAsset = reimportAsset;
exports.queryAllImporter = queryAllImporter;
exports.queryAllAssetTypes = queryAllAssetTypes;
exports.refreshAsset = refreshAsset;
exports.refreshAllEffect = refreshAllEffect;
exports.initAsset = initAsset;

const {
  createWriteStream,
  createReadStream,
  copy,
  existsSync,
} = require("fs-extra");

const { parse, dirname, join } = require("path");

const {
  handleAssetOption,
  isLegalMetaFile,
  changeMetaUuid,
} = require("../share/utils");

const { forwarding } = require("./worker/index");

function zip(e, r) {
  var t = require("archiver");
  var e = createWriteStream(e);
  const a = t("zip");

  a.on("error", (e) => {
    throw e;
  });

  a.pipe(e);

  r.forEach((e) => {
    var r = parse(e);
    a.append(createReadStream(e), { name: r.ext.substr(1) });
  });

  a.finalize();
}
async function generateAvailableURL(e) {
  if (!e || typeof e != "string") {
    throw new Error(Editor.I18n.t("asset-db.operation.invalid_url"));
  }
  var r = await forwarding("asset-worker:generate-available-url", e);
  if (r) {
    return r;
  }
  throw new Error(
    Editor.I18n.t("asset-db.operation.exists_url") +
      `
  url: ` +
      e
  );
}
function checkURL(e) {
  if (!e || typeof e != "string" || !e.startsWith("db://")) {
    throw new Error(
      Editor.I18n.t("asset-db.operation.invalid_url") +
        ` 
  url: ` +
        e
    );
  }
}
async function checkReadonly(e) {
  if (await isReadonly(e)) {
    throw new Error(
      Editor.I18n.t("asset-db.operation.readonly") +
        ` 
  url: ` +
        e
    );
  }
}
async function isReadonly(e) {
  return (
    !(e = e.startsWith("db://")
      ? e
      : await forwarding("asset-worker:query-url", e)) ||
    ((e = await forwarding("asset-worker:query-db-info", e)) && e.readonly) ||
    false
  );
}
async function generateURL(r) {
  try {
    return await generateAvailableURL(r);
  } catch (e) {
    throw new Error(
      Editor.I18n.t("asset-db.operation.exists_url") +
        ` 
  url: ` +
        r
    );
  }
}
async function queryUUID(e) {
  if (!e.startsWith("db://")) {
    return e;
  }
  let r;
  try {
    r = await forwarding("asset-worker:query-uuid", e || "");
  } catch (e) {}
  return r || null;
}
async function importAsset(r, t, e) {
  checkURL(t);
  await checkReadonly(dirname(t));
  var a = await generateURL(t);
  if (t !== a) {
    e = await handleAssetOption(t, e);
    if (e === "rename") {
      t = a;
    } else if (e === "cancel") {
      return null;
    }
  }
  try {
    var s = await forwarding("asset-worker:query-path", t);
    await copy(r, s, { overwrite: true });

    if (s.endsWith(".meta")) {
      const r = s.replace(".meta", "");
      if (await forwarding("asset-worker:query-path", r)) {
        await refreshAsset(s);
        const u = await queryUUID(t);
        return u ? await forwarding("asset-worker:query-asset-info", u) : null;
      }
      return null;
    }

    var i;
    var n = r + ".meta";
    var o = s + ".meta";

    if (
      existsSync(n) &&
      (false ===
        (i = await Editor.Profile.getConfig("asset-db", "autoOverwriteMeta")) &&
        existsSync(o) &&
        console.log(
          Editor.I18n.t("asset-db.importAsset.metaExists", { name: r })
        ),
      await isLegalMetaFile(n))
    ) {
      await copy(n, o, { overwrite: i });
    }

    await refreshAsset(s);
  } catch (e) {
    console.error(`Import asset form ${r} -> ${t} failed!`);
    console.error(e);
    return null;
  }
  const u = await queryUUID(t);
  return u ? await forwarding("asset-worker:query-asset-info", u) : null;
}
async function copyAsset(e, r, t) {
  checkURL(e);
  checkURL(r);
  await checkReadonly(dirname(r));
  var a = {
    source: await forwarding("asset-worker:query-path", e),
    target: await forwarding("asset-worker:query-path", r),
  };
  if (!a.source || !existsSync(a.source)) {
    throw new Error(
      Editor.I18n.t("asset-db.copyAsset.fail.source") +
        ` 
source: ` +
        e
    );
  }
  if (Editor.Utils.Path.contains(a.target, a.source)) {
    throw new Error(
      Editor.I18n.t("asset-db.copyAsset.fail.include") +
        ` 
source: ${e}
target: ` +
        r
    );
  }
  let s = await generateURL(r);
  if (r !== s) {
    e = await handleAssetOption(r, t);
    if (e === "rename") {
      a.target = await forwarding("asset-worker:query-path", s);
    } else {
      if (e === "cancel") {
        return null;
      }
      s = r;
    }
  }
  t = a.source + ".meta";
  e = a.target + ".meta";

  if (existsSync(t) && (await isLegalMetaFile(t))) {
    await copy(t, e);
    await changeMetaUuid(e);
  }

  await copy(a.source, a.target);
  await changeMetaUuid(a.target);
  await refreshAsset(a.target);
  t = await queryUUID(s);
  return t
    ? forwarding("asset-worker:query-asset-info", t)
    : (console.warn(
        "" + Editor.I18n.t("asset-db.createAsset.fail.uuid", { target: r })
      ),
      null);
}
async function renameAsset(e, r, t) {
  checkURL(e);
  checkURL(r);
  await checkReadonly(dirname(e));
  await checkReadonly(dirname(r));
  var a = {
    source: await forwarding("asset-worker:query-path", e),
    target: await forwarding("asset-worker:query-path", r),
  };
  if (!a.source || !existsSync(a.source)) {
    throw new Error(
      Editor.I18n.t("asset-db.renameAsset.fail.source") +
        ` 
source: ` +
        e
    );
  }
  var s = await generateURL(r);
  if (e.toLowerCase() === r.toLowerCase() && r !== s) {
    return forwarding("asset-worker:rename-asset", a.source, a.target, t);
  }
  if (a.target.startsWith(join(a.source, "/"))) {
    throw new Error(
      Editor.I18n.t("asset-db.renameAsset.fail.parent") +
        ` 
source: ${e}
target: ` +
        r
    );
  }
  if (r !== s) {
    e = await handleAssetOption(r, t);
    if (e === "rename") {
      a.target = await forwarding("asset-worker:query-path", s);
    } else if (e === "cancel") {
      return null;
    }
  }
  t = t || {};
  t.overwrite = true;

  return dirname(a.target) !== dirname(a.source)
    ? forwarding("asset-worker:move-asset", a.source, a.target, t)
    : forwarding("asset-worker:rename-asset", a.source, a.target, t);
}
async function moveAsset(e, r, t) {
  checkURL(e);
  checkURL(r);
  await checkReadonly(dirname(e));
  await checkReadonly(dirname(r));
  var a = {
    source: await forwarding("asset-worker:query-path", e),
    target: await forwarding("asset-worker:query-path", r),
  };
  if (!a.source || !existsSync(a.source)) {
    throw new Error(
      Editor.I18n.t("asset-db.moveAsset.fail.source") +
        ` 
source: ` +
        e
    );
  }
  var s = await generateURL(r);
  if (e.toLowerCase() === r.toLowerCase() && r !== s) {
    return forwarding("asset-worker:rename-asset", a.source, a.target);
  }
  if (a.target.startsWith(join(a.source, "/"))) {
    throw new Error(
      Editor.I18n.t("asset-db.moveAsset.fail.parent") +
        ` 
source: ${e}
target: ` +
        r
    );
  }
  if (r !== s) {
    e = await handleAssetOption(r, t);
    if (e === "rename") {
      a.target = await forwarding("asset-worker:query-path", s);
    } else if (e === "cancel") {
      return null;
    }
  }
  t = t || {};
  t.overwrite = true;
  return forwarding("asset-worker:move-asset", a.source, a.target, t);
}
async function deleteAsset(e) {
  e = await forwarding("asset-worker:remove-asset", e);

  if (e) {
    Editor.Selection.unselect("asset", e.uuid);
  }

  return e;
}
async function reimportAsset(e) {
  return forwarding("asset-worker:reimport-asset", e);
}
async function queryAllImporter() {
  return forwarding("asset-worker:query-all-importer");
}
async function queryAllAssetTypes() {
  return forwarding("asset-worker:query-all-asset-types");
}
async function refreshAsset(e) {
  return forwarding("asset-worker:refresh-asset", e);
}
async function refreshAllEffect() {
  return forwarding("asset-worker:refresh-all-effect");
}
async function initAsset(e, r) {
  const t = await forwarding("asset-worker:query-asset-info", e);
  if (!t) {
    console.warn(
      Editor.I18n.t("asset-db.saveAsset.fail.uuid") +
        ` 
{asset(${e})}`
    );

    return null;
  }
  if (!r || typeof r != "string" || !r.startsWith("db://")) {
    console.warn(
      Editor.I18n.t("asset-db.copyAsset.fail.url") +
        ` 
target: {asset(${r})}`
    );

    return null;
  }
  var r = await forwarding("asset-worker:query-path", r);
  var a = parse(t.name);

  var s = Object.keys(t.library).map((e) => t.library[e]);

  if (!s || s.length === 0) {
    console.warn(
      `Unable to instantiate resource 
uuid: ` + e
    );

    return null;
  }
  try {
    var i = join(r, a.name + t.instantiation);
    zip(i, s);
    await refreshAsset(i);

    if (!existsSync(i)) {
      throw new Error(
        "" + Editor.I18n.t("asset-db.createAsset.fail.drop", { target: i })
      );
    }

    const e = await queryUUID(i);
    return e ? await forwarding("asset-worker:query-asset-info", e) : null;
  } catch (e) {
    console.error(e);
    return null;
  }
}
