var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });

exports.sameScriptList = undefined;
exports.isRefresh = undefined;
exports.STATE = undefined;
exports.PATH_REGEXP = undefined;
exports.importOverrideTipMarker = undefined;

exports.beforeClose = beforeClose;
exports.close = close;
exports.initTemplate = initTemplate;
exports.readWriteFileByLineWithProcess = readWriteFileByLineWithProcess;
exports.getDependScriptUuid = getDependScriptUuid;
exports.getImportAssets = getImportAssets;
exports.initScript = initScript;
exports.analyticalContent = analyticalContent;
exports.checkMetaUUid = checkMetaUUid;
exports.writeAssets = writeAssets;
exports.doImportAssets = doImportAssets;
exports.trimDependUuid = trimDependUuid;
exports.isPath = isPath;
exports.findUUIDs = findUUIDs;

const { join, dirname, basename, extname } = require("path");

const {
  readFileSync,
  createReadStream,
  existsSync,
  statSync,
  createWriteStream,
  writeFileSync,
} = require("fs");

module.paths.push(join(Editor.App.path, "node_modules"));
const resolve_1 = __importDefault(require("resolve"));

const { ensureDirSync } = require("fs-extra");

const { createInterface } = require("readline");

const { v4 } = require("node-uuid");

const { createHash } = require("crypto");

const JSZip = require("../../lib/jszip.min");
const JSZipUtils = require("../../lib/jszip-utils.min");
function onRefresh(e) {
  exports.isRefresh = (e.metaKey || e.ctrlKey) && e.key === "r";
}
function beforeClose() {
  return !exports.isRefresh || (exports.isRefresh = false);
}
function close() {
  window.removeEventListener("keydown", onRefresh);
}
function initTemplate(t) {
  window.addEventListener("keydown", onRefresh);
  const e = join(__dirname, "../../icon/new.png");

  t.$.tree.css = readFileSync(join(__dirname, "../../css/tree.css"), "utf8");

  t.$.tree.$content.style.overflowX = "auto";

  t.$.tree.setTemplate(
    "text",
    `
      <ui-checkbox></ui-checkbox>
      <ui-asset-image size="small"></ui-asset-image>
      <span class="name"></span>
      <image class="new" ></image>
      <ui-icon color class="conflict" value="warn-triangle"
          tooltip="i18n:package-asset.import.conflict_text"
      ></ui-icon>
      <ui-icon color class="select" value="select"></ui-icon>
      
  `
  );

  t.$.tree.setTemplateInit("text", (s) => {
    s.$checkbox = s.querySelector("ui-checkbox");
    s.$assetImage = s.querySelector("ui-asset-image");
    s.$name = s.querySelector(".name");
    s.$new = s.querySelector(".new");
    s.$new.style.display = "none";
    s.$new.src = e.replace("#", "%23");
    s.$conflict = s.querySelector(".conflict");
    s.$conflict.style.display = "none";
    s.$select = s.querySelector(".select");
    s.$select.style.display = "none";

    s.$select.addEventListener("click", async () => {
      var e = s.data.detail;
      let t = e.asset.uuid;

      if (!t) {
        e = "db://" + join("assets", e.url);
        t = await Editor.Message.request("asset-db", "query-uuid", e);
      }

      Editor.Message.request("assets", "twinkle", t);
    });

    s.$checkbox.addEventListener("confirm", () => {
      var s_data = s.data;
      s_data.detail.checked = !s_data.detail.checked;

      (function t(e, s) {
        e.detail.checked = s;

        if (e.children) {
          e.children.forEach((e) => {
            t(e, s);
          });
        }
      })(s_data, s_data.detail.checked);

      (function e(t) {
        var s;

        if (
          t &&
          (s = t.children.some((e) => e.detail.checked)) !== t.detail.checked
        ) {
          t.detail.checked = s;
          e(t.parent);
        }
      })(s_data.parent);

      t.$.tree.render(true);
      t.updateTotal();
    });
  });

  t.$.tree.setRender("text", (e, t) => {
    t = t.detail;
    e.$checkbox.value = t.checked;
    e.$name.innerHTML = t.value;

    e.$assetImage.setAttribute("importer", t.asset.importer || t.meta.importer);

    e.$assetImage.setAttribute("value", t.asset.uuid || t.meta.uuid);
    e.$new.style.display = t.isNew ? "" : "none";
    e.$conflict.style.display = t.isConflict ? "" : "none";
    e.$select.style.display = !t.isNew || t.isConflict ? "" : "none";
  });

  t.$.tree.setRender("item", (e) => {
    if (e.data.detail.legal) {
      e.removeAttribute("disabled");
    } else {
      e.setAttribute("disabled", "");
    }
  });
}
async function readWriteFileByLineWithProcess(s, a) {
  await new Promise((e) => {
    var t = createReadStream(s);
    var t = createInterface({ input: t });

    t.on("line", (e) => {
      a(e);
    });

    t.on("close", () => {
      e();
    });
  });
}
async function getDependScriptUuid(t) {
  let s = "";
  await readWriteFileByLineWithProcess(t.file, (e) => {
    if (!e.startsWith("import") || e.includes("./") || e.includes("../")) {
      s += e + "\n";
    } else {
      s += "//" + e + "\n";
    }
  });
  var e = require("@babel/core");

  var a = await e.parseAsync(s, {
    parserOpts: {
      plugins: [
        "typescript",
        "classProperties",
        "decorators-legacy",
        "dynamicImport",
        "importMeta",
        "logicalAssignment",
        "nullishCoalescingOperator",
        "optionalChaining",
      ],
    },
  });

  const i = [];

  e.traverse(a, {
    ImportDeclaration: ({ node }) => {
      i.push(node.source.value);
    },
  });

  const r = [];

  await Promise.all(
    i.map(
      (e) =>
        new Promise((s, a) => {
          (0, resolve_1.default)(
            e,
            {
              basedir: dirname(t.file),
              extensions: [".ts", ".js", ".mjs", ".cjs"],
            },
            async (e, t) => {
              if (e) {
                a(e);
              } else {
                t &&
                  (e = await Editor.Message.request(
                    "asset-db",
                    "query-uuid",
                    t
                  )) &&
                  r.push(e);

                s();
              }
            }
          );
        })
    )
  );

  return r;
}
async function getImportAssets(e) {
  return new Promise((s, a) => {
    JSZipUtils.getBinaryContent(e, (e, t) => {
      if (e) {
        a(e);
      } else {
        JSZip.loadAsync(t)
          .then(async (e) => {
            await initScript(e.files);
            s(e.files);
          })
          .catch((e) => {
            a(e);
          });
      }
    });
  });
}
async function initScript(t) {
  exports.sameScriptList.length = 0;
  var e = Object.keys(t)
    .map((e) => {
      if (t[e].name.includes(".ts") && !t[e].name.endsWith(".meta")) {
        return t[e];
      }
    })
    .filter(Boolean);
  if (e.length > 0) {
    var s = [];
    for (const r of await Editor.Message.request("asset-db", "query-assets", {
      ccType: "cc.Script",
    })) {
      var a = readFileSync(r.file, "utf8").match(/@ccclass\(['|"](.*)['|"]\)/);
      let e;

      e = a ? a && a[1] : basename(r.file, extname(r.file));

      if (!s.includes(e)) {
        s.push(e);
      }
    }
    for (const n of e) {
      if (n.name.includes(".ts")) {
        var i = (await getContentByFile(n)).match(/@ccclass\(['|"](.*)['|"]\)/);
        let e;

        if (
          (e = i ? i && i[1] : basename(n.name, extname(n.name))) &&
          s.includes(e)
        ) {
          if (!exports.sameScriptList.includes(n.name)) {
            exports.sameScriptList.push(n.name);
          }
        }
      }
    }
  }
}
function checkIsNew(e) {
  try {
    return !existsSync(e);
  } catch (e) {
    return true;
  }
}
function checkIsConflict(e, t) {
  try {
    var s;
    var a;
    return statSync(e).isFile()
      ? ((s = readFileSync(e, "utf8")),
        (a =
          createHash("md5").update(s).digest("hex") !==
          createHash("md5").update(t).digest("hex")) &&
          exports.importOverrideTipMarker.push(e),
        a)
      : false;
  } catch (e) {
    return false;
  }
}
function patchAssetInfoFromMeta(e, t) {
  try {
    var s = _metas.get(e + ".meta");
    t.importer = s && s.importer;
    t.uuid = s && s.uuid;
  } catch (e) {
    t.importer = "unknow";
  }
  return t;
}
async function createItem(e, t) {
  let s = t || e.name;
  s = s.endsWith("/") ? s.substring(e.name.length - 1, 0) : s;
  var t = !exports.sameScriptList.includes(s);
  var a = join(Editor.Project.path, "assets", s);
  return {
    detail: {
      value: basename(s),
      url: s,
      file: s,
      checked: true,
      extname: extname(s),
      isDirectory: e.dir,
      legal: t,
      asset: patchAssetInfoFromMeta(s, e),
      isConflict: checkIsConflict(a, await getContentByFile(e)),
      isNew: checkIsNew(a) && t,
      meta: _metas.get(s + ".meta"),
    },
    showArrow: e.dir,
    children: [],
  };
}
exports.importOverrideTipMarker = [];
exports.PATH_REGEXP =
  /([`~!#$%^&*+=<>?"{}|,;'·~！#￥%……&*（）+={}|《》？：“”【】、；‘'，。、])/im;
exports.STATE = { WAIT: 0, IDLE: 1, LOADING: 2, COMPLETED: 3 };
exports.isRefresh = false;
exports.sameScriptList = [];
const _tree = [];
const _flattenedTree = [];
const _metas = new Map();
async function addAssetToTree(t) {
  var s;
  var a = t.name.split("/").filter(Boolean);
  let i = "";
  for (let e = 0; e < a.length; ++e) {
    if (e > 0) {
      i += "/";
    }

    i += a[e];

    if (!_flattenedTree.find((e) => e.detail.url === i)) {
      s = await createItem(t, i);
      const n = dirname(i);
      var r = _flattenedTree.find((e) => e.detail.url === n);
      (r ? r.children : _tree).push(s);
      _flattenedTree.push(s);
    }
  }
}
async function analyticalContent(e) {
  exports.importOverrideTipMarker.length = 0;
  _tree.length = 0;
  _flattenedTree.length = 0;
  _metas.clear();
  var t = [];
  for (const i in e) {
    var s;
    var a = e[i];

    if (a.name.endsWith(".meta")) {
      s = await getContentByFile(a);
      s = JSON.parse(s);
      _metas.set(a.name, s);
    } else {
      t.push(a);
    }
  }
  for (let e = 0; e < t.length; e++) {
    await addAssetToTree(t[e]);
  }

  if (exports.sameScriptList.length > 0) {
    await Editor.Dialog.warn(Editor.I18n.t("package-asset.script.message"), {
      title: Editor.I18n.t("package-asset.script.title"),
      buttons: [Editor.I18n.t("package-asset.script.confirm")],
      default: 0,
    });
  }

  return _tree;
}
const uuidsMap = new Map();
async function checkMetaUUid(e) {
  let t = _metas.get(e.name);
  t = t || JSON.parse(await getContentByFile(e));
  var s = await Editor.Message.request("asset-db", "query-path", t.uuid);

  if (
    s &&
    join(Editor.Project.path, "assets", basename(e.name, extname(e.name))) !== s
  ) {
    uuidsMap.set(t.uuid, v4());
  }
}
async function getContentByFile(e) {
  return new Promise((t) => {
    e.async("string")
      .then((e) => {
        t(e);
      })
      .catch(() => {
        t("");
      });
  });
}
async function writeAssets(t, s) {
  return new Promise((e) => {
    s.nodeStream()
      .pipe(createWriteStream(t))
      .on("finish", () => {
        e();
      });
  });
}

const skipExtname = [
  ".jpg",
  ".png",
  ".jpeg",
  ".webp",
  ".tga",
  ".effect",
  ".dbbin",
  ".bin",
  ".atlas",
  ".glb",
  ".terrain",
  ".mp3",
  ".wav",
  ".ogg",
  ".aac",
  ".pcm",
  "m4a",
  ".mp4",
  ".labelatlas",
  ".js",
  ".ts",
  ".tmx",
  ".tsx",
  ".fbx",
];

const assetList = [];
async function doImportAssets(t, s) {
  uuidsMap.clear();
  assetList.length = 0;
  for (const c of t) {
    var c_name = c.name;
    var a = join(Editor.Project.path, "assets", c_name);

    if (!existsSync(a)) {
      if (c_name.endsWith(".meta")) {
        await checkMetaUUid(c);
      }
    }
  }
  let i = 1;
  for (let c_name = 0; c_name < t.length; ++c_name) {
    var r = t[c_name];
    var r_name = r.name;
    var o = join(Editor.Project.path, "assets", r_name);

    if (c_name % 2 == 0) {
      s(basename(r_name), i++);
    }

    if (r.dir) {
      if (!existsSync(o)) {
        ensureDirSync(o);
      }
    } else {
      if (!skipExtname.includes(extname(r.name))) {
        let s = false;
        let a = await getContentByFile(r);
        if (!checkIsNew(o) && !checkIsConflict(o, a)) {
          continue;
        }

        uuidsMap.forEach((e, t) => {
          t = new RegExp(t, "g");

          if (a.match(t)) {
            a = a.replace(t, e);
            s = true;
          }
        });

        if (s) {
          writeFileSync(o, a);
          continue;
        }
      }
      await writeAssets(o, r);
    }
  }
}
function trimDependUuid(e) {
  return e.split("@")[0];
}
function isPath(t, s = false) {
  let a;
  if (t) {
    t = t.match(exports.PATH_REGEXP);
    if (t) {
      let e;

      e = s
        ? "package-asset.export.message.name_contains_symbol"
        : "package-asset.import.message.path_contains_symbol";

      a = Editor.I18n.t(e, { symbol: t[1] });
    }
  } else {
    a = Editor.I18n.t("package-asset.path_empty");
  }
  return (
    !a ||
    (Editor.Dialog.error(a, {
      buttons: [Editor.I18n.t("package-asset.script.confirm")],
    }),
    false)
  );
}
function isUUID(e) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(@[\w-]+)?$/i.test(
    e
  );
}
function findUUIDs(e) {
  return (JSON.stringify(e).match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?:@[\w-]+)?/gi
  ) || []);
}
