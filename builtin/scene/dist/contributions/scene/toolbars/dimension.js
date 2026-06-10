var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, n, t, o = t) => {
        var a = Object.getOwnPropertyDescriptor(n, t);

        if (
          !a ||
          (!("get" in a) ? !a.writable && !a.configurable : n.__esModule)
        ) {
          a = {
            enumerable: true,
            get() {
              return n[t];
            },
          };
        }

        Object.defineProperty(e, o, a);
      }
    : (e, n, t, o) => {
        e[(o = o === undefined ? t : o)] = n[t];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, n) => {
        Object.defineProperty(e, "default", { enumerable: true, value: n });
      }
    : (e, n) => {
        e.default = n;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var a = (e) =>
      (a =
        Object.getOwnPropertyNames ||
        ((e) => {
          var n;
          var t = [];
          for (n in e) {
            if (Object.prototype.hasOwnProperty.call(e, n)) {
              t[t.length] = n;
            }
          }
          return t;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var n = {};
      if (e != null) {
        for (var t = a(e), o = 0; o < t.length; o++) {
          if (t[o] !== "default") {
            __createBinding(n, e, t[o]);
          }
        }
      }
      __setModuleDefault(n, e);
      return n;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });

exports.default = undefined;
exports.methods = undefined;
exports.$ = undefined;
exports.template = undefined;
exports.position = undefined;

exports.ready = ready;
exports.close = close;
let panel = undefined;
function ready() {
  if (panel) {
    close();
  }

  panel = this;

  Editor.Message.__protected__.addBroadcastListener(
    "scene:ready",
    panel.sceneReady
  );

  Editor.Message.__protected__.addBroadcastListener(
    "scene:dimension-changed",
    panel.dimensionChanged
  );

  panel.$.dimension.addEventListener("click", panel.eventChangeIs2D);
  document.body.addEventListener("keydown", panel.eventDocumentKeyDown);
  panel.sceneReady();
}
function close() {
  Editor.Message.__protected__.removeBroadcastListener(
    "scene:ready",
    panel.sceneReady
  );

  Editor.Message.__protected__.removeBroadcastListener(
    "scene:dimension-changed",
    panel.dimensionChanged
  );

  panel.$.dimension.removeEventListener("click", panel.eventChangeIs2D);
  document.body.removeEventListener("keydown", panel.eventDocumentKeyDown);
  panel = undefined;
}
exports.position = "left";

exports.template = `
<style>
    .camera-dimension {
        margin-right: 8px;
        background-color: var(--color-default-fill-emphasis);
        border-radius: calc(var(--size-normal-radius) * 2px);
        box-shadow: inset 0 0 0 calc(var(--size-normal-border) * 1px) var(--color-default-border-normal);
        overflow: hidden;
    }
</style>
<div class="camera-dimension">
    <ui-button type="icon" class="dimension transparent" tooltip="i18n:scene.tooltips.edit_mode">
        <ui-icon class="icon" value="3D"></ui-icon>
    </ui-button>
</div>
`;

exports.$ = { dimension: ".dimension", icon: ".icon" };

exports.methods = {
  dimensionChanged(e) {
    panel.is2D = e;
    panel.$.icon.value = panel.is2D ? "2D" : "3D";
  },
  async sceneReady() {
    var e = await Editor.Message.request("scene", "query-is2D");
    panel.dimensionChanged(e);
  },
  eventChangeIs2D() {
    Editor.Message.send("scene", "change-is2D", !panel.is2D);
  },
  eventDocumentKeyDown(e) {
    var n = (function e(n) {
      return n && n.shadowRoot ? e(n.shadowRoot.activeElement) : n;
    })(document.activeElement);

    if (
      (!n || (n.tagName !== "INPUT" && n.tagName !== "TEXTAREA")) &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey &&
      !e.shiftKey
    ) {
      if (e.key === "2") {
        panel.$.dimension.click();
      }
    }
  },
};

exports.default = __importStar(require("./dimension"));
