Object.defineProperty(exports, "__esModule", { value: true });
exports.MissingObjectReporter = undefined;
const missing_reporter_1 = require("./missing-reporter");
const _ = require("lodash");
const ps = require("path");
const ObjectWalker = require("./object-walker");
class MissingObjectReporter extends missing_reporter_1.MissingReporter {
  async doReport(e, e_name, t, i, r) {
    let n;
    let o = "";

    if (
      (n =
        e instanceof cc.Component || e instanceof cc.Asset
          ? e
          : _.findLast(
              t,
              (e) => e instanceof cc.Component || e instanceof cc.Asset
            )) instanceof cc.Component
    ) {
      e = missing_reporter_1.MissingReporter.getObjectType(n);
      o = ` by ${e} "${cc.js.getClassName(n)}"`;
    } else if ((n = _.findLast(t, (e) => e instanceof cc.Node))) {
      o = ` by node "${n.name}"`;
    }

    let a;
    if (typeof e_name == "string") {
      a = `Asset "${e_name}" used${o}${r} is missing.`;
    } else {
      let e = cc.js.getClassName(e_name);

      if (e.startsWith("cc.")) {
        e = e.slice(3);
      }

      a =
        e_name instanceof cc.Asset
          ? `The ${e} used${o}${r} is missing.`
          : `The ${e} referenced${o}${r} is invalid.`;
    }
    a += missing_reporter_1.MissingReporter.INFO_DETAILED;

    if (n instanceof cc.Component) {
      n = n.node;
    }

    try {
      if (n instanceof cc.Node) {
        let e = n;
        let e_name = e.name;

        while (e.parent && !(e.parent instanceof cc.Scene)) {
          e = e.parent;
          e_name = e.name + "/" + e_name;
        }

        a += `Node path: "${e_name}"
`;
      }
    } catch (e) {}

    if (i) {
      a += `Asset url: "${i}"
  `;
    }

    if (e_name instanceof cc.Asset && e_name._uuid) {
      try {
        var c = await Editor.Message.request(
          "asset-db",
          "query-missing-asset-info",
          e_name._uuid.match(/[^@]*/)[0]
        );

        if (c) {
          a =
            (a += `Asset file: "${c.path}"
`) +
            `Asset deleted time: "${new Date(c.removeTime).toLocaleString()}"
`;
        }
      } catch (e) {}
      a += `Missing uuid: "${e_name._uuid}"
`;
    }

    a.slice(0, -1);

    if (console[this.outputLevel]) {
      console[this.outputLevel](a);
    } else {
      console.warn(a);
    }
  }
  report() {
    let n;
    let s;
    if (this.root instanceof cc.Asset) {
      try {
        var globalThis_Manager = globalThis.Manager;

        if (globalThis_Manager && globalThis_Manager.assetManager) {
          s = globalThis_Manager.assetManager.queryAssetInfo(this.root._uuid);
        }
      } catch (e) {
        console.error(e);
        s = null;
      }
      n = s ? s.path : null;
    }
    globalThis_Manager = missing_reporter_1.MissingReporter.getObjectType(
      this.root
    );
    const o = n ? ` in ${globalThis_Manager} "${ps.basename(n)}"` : "";
    ObjectWalker.walk(this.root, (e, s, t, i, r) => {
      if (this.missingObjects.has(t)) {
        this.doReport(e, t, i, n, o);
      }
    });
  }
  reportByOwner() {
    let n;
    let s;
    if (this.root instanceof cc.Asset) {
      try {
        var globalThis_Manager = globalThis.Manager;

        if (globalThis_Manager && globalThis_Manager.assetDBManager.ready) {
          s = globalThis_Manager.assetManager.queryAssetInfo(this.root._uuid);
        }
      } catch (e) {
        console.error(e);
        s = null;
      }
      n = s ? s.path : null;
    }
    globalThis_Manager = missing_reporter_1.MissingReporter.getObjectType(
      this.root
    );
    const o = n ? ` in ${globalThis_Manager} "${ps.basename(n)}"` : "";
    ObjectWalker.walkProperties(
      this.root,
      (e, s, t, i) => {
        var r = this.missingOwners.get(e);

        if (r && s in r) {
          r = r[s];
          this.doReport(e, r || t, i, n, o);
        }
      },
      { dontSkipNull: true }
    );
  }
}
exports.MissingObjectReporter = MissingObjectReporter;
