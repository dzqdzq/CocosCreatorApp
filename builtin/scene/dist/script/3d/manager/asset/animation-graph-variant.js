var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, i, r = i) => {
        var n = Object.getOwnPropertyDescriptor(t, i);

        if (
          !n ||
          (!("get" in n) ? !n.writable && !n.configurable : t.__esModule)
        ) {
          n = {
            enumerable: true,
            get() {
              return t[i];
            },
          };
        }

        Object.defineProperty(e, r, n);
      }
    : (e, t, i, r) => {
        e[(r = r === undefined ? i : r)] = t[i];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, t) => {
        Object.defineProperty(e, "default", { enumerable: true, value: t });
      }
    : (e, t) => {
        e.default = t;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var n = (e) =>
      (n =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var i = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              i[i.length] = t;
            }
          }
          return i;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var i = n(e), r = 0; r < i.length; r++) {
          if (i[r] !== "default") {
            __createBinding(t, e, i[r]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });

const edit_component_asset_1 = __importDefault(
  require("./edit-component-asset")
);

const animationApi = __importStar(require("cc/editor/new-gen-anim"));

const { loadAssetUncached } = require("../../../utils/asset");

class EditAnimationGraphVariant extends edit_component_asset_1.default {
  overrides = {};
  invalidEntries = {};
  resetOverrides() {
    this.overrides = {};
    this.invalidEntries = {};

    if (this.component.original) {
      for (const t of animationApi.visitAnimationClips(
        this.component.original
      )) {
        if (t) {
          this.overrides[t._uuid] = "";
        }
      }
    }

    var e = this.entryOverrides();
    for (const i in e) {
      if (this.overrides[i] === undefined) {
        this.invalidEntries[i] = e[i];
      } else {
        this.overrides[i] = e[i];
      }
    }
  }
  entryOverrides() {
    const t = {};

    [...this.component.clipOverrides].forEach((e) => {
      t[e.original._uuid] = e.substitution._uuid;
    });

    return t;
  }
  cacheComponent(e) {
    super.cacheComponent(e);
    this.resetOverrides();
  }
  encodeComponent() {
    return {
      graphUuid: this.component.original?._uuid,
      clips: this.overrides,
      invalids: this.invalidEntries,
    };
  }
  async updateComponent(e) {
    var t = this.component.original?._uuid;
    if (e.graphUuid !== t) {
      if (e.graphUuid) {
        this.component.original = await loadAssetUncached(e.graphUuid);
      } else {
        this.component.original = null;
      }

      this.resetOverrides();
    } else {
      for (const i in e.clips) {
        this.overrides[i] = e.clips[i];
      }
    }
    return this.encodeComponent();
  }
  async applyComponent() {
    this.component.clipOverrides.clear();
    try {
      for (const i in this.overrides) {
        var e;
        var t;

        if (this.overrides[i]) {
          e = await loadAssetUncached(i);
          t = await loadAssetUncached(this.overrides[i]);
          this.component.clipOverrides.set(e, t);
        }
      }
    } catch (e) {
      return void console.error(e);
    }
    return this.getComponent();
  }
}
exports.default = new EditAnimationGraphVariant();
