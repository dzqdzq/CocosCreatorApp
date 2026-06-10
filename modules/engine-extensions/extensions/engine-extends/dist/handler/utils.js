var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrateStep = undefined;
exports.getDependUUIDList = getDependUUIDList;
exports.getDependList = getDependList;
exports.deserialize = deserialize;
exports.getDeserializeResult = getDeserializeResult;
exports.i18nTranslate = i18nTranslate;
exports.linkToAssetTarget = linkToAssetTarget;
exports.clamp = clamp;
exports.getPixiel = getPixiel;
exports.getTrimRect = getTrimRect;
exports.removeNull = removeNull;
exports.openCode = openCode;
const electron_i18n_1 = __importDefault(require("@base/electron-i18n"));
const electron_1 = require("electron");
function getDependUUIDList(t, r) {
  if (typeof t != "string") {
    return getDeserializeResult(t).uuids;
  }
  {
    let e = t.match(
      /[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}(@[a-z0-9]+){0,}/g
    );
    return (
      (e =
        e &&
        JSON.parse(
          JSON.stringify(Array.from(new Set(e)).filter((e) => e !== r))
        )) || []
    );
  }
}
function getDependList(e) {
  var t;
  var r;
  return typeof e == "string"
    ? ((r = getDependUUIDList(e)),
      (t =
        ((t = e.match(/"__type__":\s*"([0-9a-zA-Z+/]{22,23})"/g)) &&
          t.toString().match(/[0-9a-zA-Z+/]{22,23}/g)) ||
        []),
      {
        uuids: r,
        dependScriptUuids: Array.from(
          new Set(t.map((e) => Editor.Utils.UUID.decompressUUID(e)))
        ),
      })
    : {
        uuids: (r = getDeserializeResult(e)).uuids,
        dependScriptUuids: r.dependScriptUuids,
      };
}
function deserialize(e) {
  return getDeserializeResult(e).instance;
}
function getDeserializeResult(e) {
  var t = new cc.deserialize.Details();
  t.reset();
  const r = EditorExtends.MissingReporter.classInstance;
  r.reset();
  r.hasMissingClass = false;
  const i = new Set();
  e = cc.deserialize(e, t, {
    classFinder(e) {
      if (Editor.Utils.UUID.isUUID(e)) {
        i.add(Editor.Utils.UUID.decompressUUID(e));
      }

      return r.classFinder(e);
    },
  });

  t.assignAssetsBy((e, t) => EditorExtends.serialize.asAsset(e));

  return {
    instance: e,
    uuids: t.uuidList,
    dependScriptUuids: Array.from(i),
    classFinder: r.classFinder,
  };
}
function i18nTranslate(e, ...t) {
  let r = electron_i18n_1.default.translation(e);
  if (typeof t[0] == "object") {
    var [i] = t;
    var e = r.match(/{(\w+)}/g);
    if (e) {
      for (const n of e) {
        var s = n.substr(1, n.length - 2);
        r = r.replace(n, i[s]);
      }
    }
  }
  return r;
}
function linkToAssetTarget(e) {
  return `{asset(${e})}`;
}
function clamp(e, t, r) {
  return e < t ? t : r < e ? r : e;
}
function getPixiel(e, t, r, i) {
  t = 4 * t + r * i * 4;
  return { r: e[t], g: e[1 + t], b: e[2 + t], a: e[3 + t] };
}
function getTrimRect(e, t, r, i) {
  var s = i;
  let n = t;
  let o = r;
  let a = 0;
  let l = 0;
  let c;
  let u;
  for (u = 0; u < r; u++) {
    for (c = 0; c < t; c++) {
      if (getPixiel(e, c, u, t).a >= s) {
        o = u;
        u = r;
        break;
      }
    }
  }
  for (u = r - 1; u >= o; u--) {
    for (c = 0; c < t; c++) {
      if (getPixiel(e, c, u, t).a >= s) {
        l = u - o + 1;
        u = 0;
        break;
      }
    }
  }
  for (c = 0; c < t; c++) {
    for (u = o; u < o + l; u++) {
      if (getPixiel(e, c, u, t).a >= s) {
        n = c;
        c = t;
        break;
      }
    }
  }
  for (c = t - 1; c >= n; c--) {
    for (u = o; u < o + l; u++) {
      if (getPixiel(e, c, u, t).a >= s) {
        a = c - n + 1;
        c = 0;
        break;
      }
    }
  }
  return [n, o, a, l];
}
function removeNull(e, t) {
  let r = false;
  for (const n of e) {
    if (n._children && n._children.length) {
      for (let e = 0; e < n._children.length; e++) {
        var i = n._children[e];

        if (!i) {
          n._children.splice(e, 1);
          r = true;

          console.warn(
            Editor.I18n.t("engine-extends.importers.invalidNodeData", {
              assetUuid: t,
              type: Editor.I18n.t("engine-extends.importers.node"),
              value: String(i),
            })
          );

          e--;
        }
      }
    }
    if (n._components) {
      for (let e = 0; e < n._components.length; e++) {
        var s = n._components[e];

        if (!s) {
          n._components.splice(e, 1);

          console.warn(
            Editor.I18n.t("engine-extends.importers.invalidNodeData", {
              assetUuid: t,
              type: Editor.I18n.t("engine-extends.importers.component"),
              value: String(s),
            })
          );

          r = true;
          e--;
        }
      }
    }
  }
  return r;
}
async function openCode(e) {
  var t = await Editor.Message.request(
    "program",
    "open-program",
    "scriptEditor",
    [Editor.Project.path, e.source]
  );
  if (!t) {
    var r = await findVsCode();
    if (r) {
      await Editor.Message.request("program", "execute-program", r, [
        Editor.Project.path,
        e.source,
      ]);
    } else {
      try {
        await electron_1.shell.openPath(e.source);
        return true;
      } catch (e) {
        console.warn(e);
        return false;
      }
    }
  }
  return t;
}
async function findVsCode() {
  let e = "";
  try {
    console.warn(Editor.I18n.t("asset-db.openAsset.preferenceProgramWarning"));
    var t = await electron_1.app.getApplicationInfoForProtocol("vscode://");

    if (t.name === "Visual Studio Code") {
      e = t.path;
    }
  } catch (e) {}
  return e;
}
class MigrateStep {
  resolveQueue = [];
  hold() {
    return new Promise((e) => {
      this.resolveQueue.push(e);

      if (this.resolveQueue.length === 1) {
        e();
        e.hasResolve = true;
      }
    });
  }
  step() {
    var e = this.resolveQueue.shift();

    if (e) {
      e();
    }

    if (e && e.hasResolve) {
      this.step();
    }
  }
}
exports.MigrateStep = MigrateStep;
