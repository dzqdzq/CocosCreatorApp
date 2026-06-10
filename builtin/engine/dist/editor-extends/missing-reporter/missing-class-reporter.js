Object.defineProperty(exports, "__esModule", { value: true });
exports.MissingClass = undefined;
exports.MissingClassReporter = undefined;
const _ = require("lodash");
const ps = require("path");
const ObjectWalker = require("./object-walker");
const missing_reporter_1 = require("./missing-reporter");
async function report(s, n, a, c) {
  var l = missing_reporter_1.MissingReporter.getObjectType(a);
  var p = c && ps.basename(c);
  if (a instanceof cc.SceneAsset || a instanceof cc.Prefab) {
    let r;
    let s_name;
    let t;

    if (s instanceof cc.Component) {
      s_name = s;
      t = s_name.node;
    } else if (cc.Node.isNode(s)) {
      t = s;
    }

    a = p ? ` in ${l} "${p}"` : "";
    let i = n;
    let o = false;
    if (s_name) {
      let s = cc.js.getClassName(s_name);

      if (s_name instanceof cc._MissingScript) {
        o = true;
        i = s = s_name._$erialized.__type__;
      }

      r = `Class "${n}" used by component "${s}"${a} is missing or invalid.`;
    } else {
      if (!t) {
        return;
      }
      o = true;
      r = `Script "${n}" attached to "${t.name}"${a} is missing or invalid.`;
    }
    r += missing_reporter_1.MissingReporter.INFO_DETAILED;
    try {
      let s = t;
      let s_name = s.name;

      while (s.parent && !(s.parent instanceof cc.Scene)) {
        s = s.parent;
        s_name = s.name + "/" + s_name;
      }

      r += `Node path: "${s_name}"
`;
    } catch (s) {}

    if (c) {
      r += `Asset url: "${c}"
  `;
    }

    if (o && Editor.Utils.UUID.isUUID(i)) {
      s = Editor.Utils.UUID.decompressUUID(i);
      try {
        var g = await Editor.Message.request(
          "asset-db",
          "query-missing-asset-info",
          s.match(/[^@]*/)[0]
        );

        if (g) {
          r =
            (r += `Script file: "${g.path}"
`) +
            `Script deleted time: "${new Date(g.removeTime).toLocaleString()}"
`;
        }
      } catch (s) {}
      r =
        (r += `Script UUID: "${s}"
`) +
        `Class ID: "${i}"
`;
    }

    r.slice(0, -1);
    console.error(r);
  }
}
async function reportByWalker(s, e, r, t, i, o) {
  o = o || (s._$erialized && s._$erialized.__type__);
  let n;
  await report(
    (n =
      e instanceof cc.Component || cc.Node.isNode(e)
        ? e
        : _.findLast(r, (s) => s instanceof cc.Component || cc.Node.isNode(s))),
    o,
    t,
    i
  );
}
class MissingClassReporter extends missing_reporter_1.MissingReporter {
  report() {
    ObjectWalker.walk(this.root, (s, e, r, t) => {
      if (this.missingObjects.has(r)) {
        reportByWalker(r, s, t, this.root);
      }
    });
  }
  reportByOwner() {
    let o;
    let e;
    if (this.root instanceof cc.Asset) {
      try {
        var globalThis_Manager = globalThis.Manager;

        if (globalThis_Manager && globalThis_Manager.assetManager) {
          e = globalThis_Manager.assetManager.queryAssetInfo(this.root._uuid);
        }
      } catch (s) {
        console.error(s);
        e = null;
      }
      o = e ? e.path : null;
    }
    ObjectWalker.walkProperties(
      this.root,
      (s, e, r, t) => {
        var i = this.missingOwners.get(s);

        if (i && e in i) {
          i = i[e];
          reportByWalker(r, s, t, this.root, o, i);
        }
      },
      { dontSkipNull: true }
    );
  }
}
exports.MissingClassReporter = MissingClassReporter;

exports.MissingClass = {
  reporter: new MissingClassReporter(),
  classFinder(s, e, r, t) {
    var i = cc.js.getClassById(s);
    return (
      i ||
      (s &&
        (console.warn("Missing class: " + s),
        (exports.MissingClass.hasMissingClass = true),
        exports.MissingClass.reporter.stashByOwner(r, t, s)),
      null)
    );
  },
  hasMissingClass: false,
  reportMissingClass(s) {
    if (s._uuid && exports.MissingClass.hasMissingClass) {
      exports.MissingClass.reporter.root = s;
      exports.MissingClass.reporter.reportByOwner();
      exports.MissingClass.hasMissingClass = false;
    }
  },
  reset() {
    exports.MissingClass.reporter.reset();
  },
};

exports.MissingClass.classFinder.onDereferenced = (s, e, r, t) => {
  s = exports.MissingClass.reporter.removeStashedByOwner(s, e);

  if (s) {
    exports.MissingClass.reporter.stashByOwner(r, t, s);
  }
};
