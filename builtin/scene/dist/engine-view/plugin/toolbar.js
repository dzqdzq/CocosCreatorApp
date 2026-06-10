var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, o = r) => {
        var i = Object.getOwnPropertyDescriptor(t, r);

        if (
          !i ||
          (!("get" in i) ? !i.writable && !i.configurable : t.__esModule)
        ) {
          i = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, o, i);
      }
    : (e, t, r, o) => {
        e[(o = o === undefined ? r : o)] = t[r];
      });

var __exportStar =
  (this && this.__exportStar) ||
  ((e, t) => {
    for (var r in e) {
      if (r !== "default" && !Object.prototype.hasOwnProperty.call(t, r)) {
        __createBinding(t, e, r);
      }
    }
  });

Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolbarGameView = undefined;
exports.ToolbarSceneTabs = undefined;
exports.init = init;
exports.register = register;
exports.unregister = unregister;
exports.update = update;
exports.close = close;
const engine_view_1 = require("./toolbar/engine-view");
let vm = null;
function init(e) {
  return (vm = new engine_view_1.EngineViewToolbar().$mount(e));
}
const map = {};
function register(e, t) {
  (map[e] = t).forEach((e) => {
    if (e.position === "left") {
      vm.left.push(e);
    } else if (e.position === "right") {
      vm.right.push(e);
    }
  });
}
function unregister(e) {
  var t = map[e];

  if (t) {
    t.forEach((e) => {
      var t = vm.left.indexOf(e);
      var r = vm.right.indexOf(e);

      if (-1 !== t) {
        vm.left.splice(t, 1);
      }

      if (-1 !== r) {
        vm.right.splice(r, 1);
      }

      e.close.call(e.__vm__);
    });

    delete map[e];
  }
}
async function update(t, r, o) {
  for (const e in map) {
    map[e].forEach((e) => {
      if (e.update) {
        e.update.call(e.__vm__, t, r, o);
      }
    });
  }
}
function close() {
  vm?.$destroy();
  vm = undefined;
}
__exportStar(require("./toolbar/data"), exports);
__exportStar(require("./toolbar/service"), exports);
var scene_tabs_1 = require("./toolbar/scene-tabs");

Object.defineProperty(exports, "ToolbarSceneTabs", {
  enumerable: true,
  get() {
    return scene_tabs_1.ToolbarSceneTabs;
  },
});

var game_view_1 = require("./toolbar/game-view");

Object.defineProperty(exports, "ToolbarGameView", {
  enumerable: true,
  get() {
    return game_view_1.ToolbarGameView;
  },
});
