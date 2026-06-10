var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, i, r = i) => {
        var o = Object.getOwnPropertyDescriptor(t, i);

        if (
          !o ||
          (!("get" in o) ? !o.writable && !o.configurable : t.__esModule)
        ) {
          o = {
            enumerable: true,
            get() {
              return t[i];
            },
          };
        }

        Object.defineProperty(e, r, o);
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
    var o = (e) =>
      (o =
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
        for (var i = o(e), r = 0; r < i.length; r++) {
          if (i[r] !== "default") {
            __createBinding(t, e, i[r]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.data = undefined;
exports.components = undefined;
exports.computed = undefined;
exports.props = undefined;
exports.template = undefined;

exports.created = created;
exports.beforeDestroy = beforeDestroy;

const { readFileSync } = require("fs-extra");

const { join } = require("path");

const configGroup = __importStar(require("./config-group"));
const event_bus_1 = require("../event-bus");

exports.template = readFileSync(
  join(
    __dirname,
    "../../../../static/contributions/texture-compress-config.html"
  ),
  "utf8"
);

exports.props = [
  "compressConfig",
  "config",
  "readonly",
  "name",
  "id",
  "overwriteFormats",
];

exports.computed = {
  initialized() {
    return this.compressConfig && this.config;
  },
};

exports.components = { "config-group": configGroup };

const data = () => ({
  inEdit: false,
});

function created() {
  event_bus_1.EventBus.$on(
    "blank-click",
    (this.onBlankClickBind = this.onBlankClick.bind(this))
  );
}
function beforeDestroy() {
  event_bus_1.EventBus.$off("blank-click", this.onBlankClickBind);
}
exports.data = data;

exports.methods = {
  onChangeFormatName(e) {
    this.$emit("change", this.id, e);
  },
  updateFormatQuality(e, t, i, r) {
    this.$emit("update", this.id, e, t, i, r);
  },
  showEditMenu(e) {
    Editor.Menu.popup({
      x: e.pageX,
      y: e.pageY,
      menu: [
        {
          label: "i18n:builder.project.texture_compress.editConfigName",
          enabled: !this.readonly,
          click: () => {
            this.inEdit = true;
          },
        },
        {
          label: "i18n:builder.copyConfig",
          click: () => {
            this.$emit("add-config", this.id);
          },
        },
        {
          label: "i18n:builder.project.texture_compress.copyId",
          click: () => {
            Editor.Clipboard.write("text", this.id);
          },
        },
        { type: "separator" },
        {
          label: "i18n:builder.delete",
          enabled: !this.readonly,
          click: () => {
            this.onRemoveFormat();
          },
        },
      ],
    });
  },
  onRemoveFormat(e, t, i) {
    this.$emit("remove", this.id, e, t, i);
  },
  onAddFormat(e, t, i) {
    this.$emit("add", this.id, e, t, i);
  },
  onAddOverwritePlatform(e, t) {
    this.$emit("add-platform", this.id, e, t);
  },
  onBlankClick() {
    this.inEdit = false;
  },
};
