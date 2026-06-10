var CameraShortcutUIType;

var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));

Object.defineProperty(exports, "__esModule", { value: true });
exports.CameraShortcutUIType = undefined;
exports.showCameraShortcutTip = showCameraShortcutTip;
exports.hideCameraShortcutTip = hideCameraShortcutTip;
const snap_shortcut_1 = __importDefault(require("./snap-shortcut"));
const wander_shortcut_1 = __importDefault(require("./wander-shortcut"));

!((t) => {
  t.Snap = "snap-shortcut";
  t.WanderShortcut = "wander-shortcut";
})(
  CameraShortcutUIType ||
    (exports.CameraShortcutUIType = CameraShortcutUIType = {})
);

const PANEL_CONFIG_MAP = {
  [CameraShortcutUIType.Snap]: snap_shortcut_1.default,
  [CameraShortcutUIType.WanderShortcut]: wander_shortcut_1.default,
};

const cachePanelMap = new Map();
function shouldAutoHide(t) {
  return t > 0;
}
function createUIPanel(t) {
  var e = PANEL_CONFIG_MAP[t];
  if (!e) {
    throw new Error("Unknown camera shortcut UI type: " + t);
  }
  try {
    var r = document.createElement("ui-panel");
    r.config = e;
    document.body.appendChild(r);
    return r;
  } catch (t) {
    throw new Error("Failed to create UI panel for config: " + e);
  }
}
function spawnTimeout(t, e) {
  return shouldAutoHide(e)
    ? setTimeout(() => hideCameraShortcutTip(t), e)
    : null;
}
function showCameraShortcutTip(t) {
  var t_duration = t.duration;
  var r = cachePanelMap.get(t.type);
  if (r && r.element) {
    return shouldAutoHide(t_duration)
      ? (r.timeoutID && clearTimeout(r.timeoutID),
        void (r.timeoutID = spawnTimeout(t.type, t.duration)))
      : undefined;
  }
  cachePanelMap.set(t.type, {
    element: createUIPanel(t.type),
    timeoutID: spawnTimeout(t.type, t.duration),
  });
}
function hideCameraShortcutTip(e) {
  var t = cachePanelMap.get(e);
  if (t) {
    try {
      t.element.remove();

      if (t.timeoutID) {
        clearTimeout(t.timeoutID);
      }
    } catch (t) {
      console.warn(`Error while hiding camera shortcut tip for type ${e}:`, t);
    } finally {
      cachePanelMap.delete(e);
    }
  }
}
