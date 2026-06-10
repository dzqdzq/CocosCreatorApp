function limitZoomLevel(o) {
  return o >= 6 ? 6 : o < -2 ? -2 : o;
}
function updateZoomLevel(o) {
  o = limitZoomLevel(o);
  Editor.Windows.__protected__.setZoomLevel(o);
  Editor.Message.broadcast("window:focus-zoom-level-change");
}
async function load() {}
function unload() {}
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.load = load;
exports.unload = unload;

exports.methods = {
  async onFocusWindowZoomIn() {
    var o = await Editor.Windows.__protected__.getZoomLevel();
    updateZoomLevel(++o);
  },
  async onFocusWindowZoomOut() {
    var o = await Editor.Windows.__protected__.getZoomLevel();
    updateZoomLevel(--o);
  },
  onFocusWindowZoomToInitial() {
    updateZoomLevel(0);
  },
  onWindowZoomLevelChange(o) {
    updateZoomLevel(o);
    Editor.Windows.__protected__.setDefaultZoomLevel(o);
  },
};
