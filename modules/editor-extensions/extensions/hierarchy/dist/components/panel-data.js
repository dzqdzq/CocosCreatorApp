Object.defineProperty(exports, "__esModule", { value: true });
exports.extension = undefined;
exports.config = undefined;
exports.act = undefined;
exports.$ = undefined;
exports.ready = ready;

const { join } = require("path");

const Profile = require("@base/electron-profile");
async function queryMessageProtocolScene() {
  try {
    var e = await Editor.Profile.getConfig("hierarchy", "message-protocol");

    if (e) {
      Object.assign(exports.act.messageProtocol, e);
    }
  } catch (e) {
    console.error(e);
    exports.act.messageProtocol.scene = "scene";
  }
}
async function onMessageProtocolChange(e, t, o) {
  if (
    e === "defaultPreferences" &&
    t === "packages/hierarchy.json" &&
    o === "message-protocol"
  ) {
    await queryMessageProtocolScene();

    exports.$.panel.$el.isConnected
      ? await exports.$.panel.refresh()
      : Profile.removeListener("change", onMessageProtocolChange);
  }
}
async function ready(e) {
  Profile.removeListener("change", onMessageProtocolChange);
  Profile.on("change", onMessageProtocolChange);
  queryMessageProtocolScene();
  await exports.config.update();
  exports.act.assetUuid = e.assetUuid;
  exports.act.expandLevels = e.expandLevels;

  if (e.animationUuid) {
    if (
      "animation" ===
      (await Editor.Message.request(
        exports.act.messageProtocol.scene,
        "query-scene-mode"
      ))
    ) {
      return void (exports.act.animationUuid = e.animationUuid);
    }
    exports.act.animationUuid = "";
  }

  exports.act.assetInfo = await Editor.Message.request(
    "asset-db",
    "query-asset-info",
    exports.act.assetUuid
  );

  exports.act.selects.length = 0;
  exports.$.tree.clear();
}

exports.$ = {
  panel: null,
  searchInput: null,
  toggleExpandIcon: null,
  viewBox: null,
  tree: null,
};

exports.act = {
  assetUuid: "",
  assetInfo: {},
  messageProtocol: { scene: "scene" },
  animationUuid: "",
  expandLevels: [],
  selects: [],
  twinkleQueues: [],
};

exports.config = {
  nodeHeight: 20,
  iconWidth: 16,
  padding: 4,
  creatableTypes: [],
  extendMenu: {
    packages: {},
    async show(e, t) {
      var o;
      var a;
      var s;
      var r;
      var n;
      var c;
      var i;
      var p;
      var l;
      var d = [];
      var u = this.packages;
      let h = undefined;

      if (t) {
        ({
          active: t,
          isScene: o,
          name: a,
          parent: s,
          type: r,
          uuid: n,
          components: c,
          isPrefabRoot: i,
          readonly: p,
          prefab: l,
        } = t);

        h = {
          active: t,
          isScene: o,
          name: a,
          parent: s,
          type: r,
          uuid: n,
          components: c,
          isPrefabRoot: i,
          readonly: p,
          prefab: l,
        };
      }

      for (const y in u) {
        var g;
        var x = u[y];

        if (
          x &&
          (g = x[e]) &&
          x.methods[g] &&
          ((x = await x.methods[g](h)), Array.isArray(x)) &&
          x.length
        ) {
          d.push({ type: "separator" });
          d.push(...x);
        }
      }
      return d;
    },
    attach(e, t) {
      exports.config.extendMenu.packages[e] = t;
    },
    detach(e) {
      delete exports.config.extendMenu.packages[e];
    },
  },
  extendDrop: {
    types: [],
    callbacks: {},
    attach(a, e) {
      e.forEach((o) => {
        var o_type = o.type;

        if (o_type && !this.types.includes(o_type)) {
          this.types.push(o_type);
          this.callbacks[o_type] || (this.callbacks[o_type] = {});

          this.callbacks[o_type][a] = (e, t) => {
            Editor.Message.send(a, o.message, e, t);
          };
        }
      });
    },
    detach(o, e) {
      e.forEach((e) => {
        const e_type = e.type;

        if (
          e_type &&
          this.types.includes(e_type) &&
          ((this.types = this.types.filter((e) => e !== e_type)),
          this.callbacks[e_type])
        ) {
          delete this.callbacks[e_type][o];
        }
      });
    },
  },
  async update() {
    this.creatableTypes = await Editor.Message.request(
      exports.act.messageProtocol.scene,
      "query-creatable-asset-types"
    );
  },
};

exports.extension = {
  attach(e) {
    if (!e.invalid && e.info.contributions && e.info.contributions.hierarchy) {
      try {
        var t;
        var o;
        var a = e.info.contributions.hierarchy;

        if (Array.isArray(a.drop)) {
          exports.config.extendDrop.attach(e.name, a.drop);
        }

        if (a.menu && typeof a.menu.methods == "string") {
          t = join(e.path, a.menu.methods);
          Editor.Module.__protected__.removeCache(t);
          o = t.replace(/^\w:/, (e) => e.toLocaleUpperCase());
          Editor.Module.__protected__.removeCache(o);
          a.menu.methods = Editor.Module.__protected__.requireFile(t);
          exports.config.extendMenu.attach(e.name, a.menu);
        }

        exports.$.tree.update();
      } catch (e) {
        console.error(e);
      }
    }
  },
  detach(e) {
    if (!e.invalid && e.info.contributions && e.info.contributions.hierarchy) {
      try {
        var t = e.info.contributions.hierarchy;

        if (Array.isArray(t.drop)) {
          exports.config.extendDrop.detach(e.name, t.drop);
        }

        if (t.menu) {
          exports.config.extendMenu.detach(e.name);
        }

        exports.$.tree.update();
      } catch (e) {
        console.error(e);
      }
    }
  },
};
