Object.defineProperty(exports, "__esModule", { value: true });
exports.extension = undefined;
exports.config = undefined;

const { join } = require("path");

exports.config = {
  vm: null,
  panel: null,
  extend: {
    async attach(e) {
      var a;
      var t = exports.config.vm;
      var o = e.info.contributions["node-library"];
      try {
        for (const r of o) {
          const n = {
            name: r.name,
            data: r.data,
            refresh: r.refresh,
            packageName: e.name,
            packageBroadcast: {},
          };

          if (
            typeof r.module == "string" &&
            ((a = join(e.path, r.module)),
            delete require.cache[a],
            (n.packageModule = require(a)),
            n.packageModule.load && (await n.packageModule.load()),
            typeof r.data == "string")
          ) {
            n.data = n.packageModule.methods[r.data]();
          }

          n.data.forEach((e) => {
            this.legalItems(e.items);
          });

          if (n.refresh) {
            n.packageBroadcast[n.refresh] = () => {
              if (typeof r.data == "string") {
                n.data = n.packageModule.methods[r.data]();

                n.data.forEach((e) => {
                  this.legalItems(e.items);
                });
              }
            };

            Editor.Message.__protected__.addBroadcastListener(
              n.refresh,
              n.packageBroadcast[n.refresh]
            );
          }

          t.extensions.push(n);
        }
      } catch (e) {
        console.error(e);
      }
    },
    async detach(a) {
      var t = exports.config.vm;
      for (let e = 0; e < t.extensions.length; e++) {
        var o = t.extensions[e];

        if (o.packageName === a.name) {
          o.packageModule.unload && (await o.packageModule.unload());
          t.extensions.splice(e, 1);

          Editor.Message.__protected__.removeBroadcastListener(
            o.update,
            o.packageBroadcast[o.update]
          );

          e--;
        }
      }
    },
    legalItems(e) {
      e.forEach((e) => {
        if (!e.icon) {
          e.icon = "ui-kit://icon/images/ui-prefab/default.png";
        }

        if (e.unlinkPrefab === undefined) {
          e.unlinkPrefab = true;
        }
      });
    },
  },
};

exports.extension = {
  attach(e) {
    if (
      !e.invalid &&
      e.info.contributions &&
      e.info.contributions["node-library"]
    ) {
      try {
        exports.config.extend.attach(e);
      } catch (e) {
        console.error(e);
      }
    }
  },
  detach(e) {
    if (
      !e.invalid &&
      e.info.contributions &&
      e.info.contributions["node-library"]
    ) {
      try {
        exports.config.extend.detach(e);
      } catch (e) {
        console.error(e);
      }
    }
  },
};
