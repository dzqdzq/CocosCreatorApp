Object.defineProperty(exports, "__esModule", { value: true });
exports.NullGameViewService = undefined;
exports.webviewToolbarAdapter = webviewToolbarAdapter;
exports.nativeToolbarAdapter = nativeToolbarAdapter;

const { getDefaultGameViewData } = require("./data");

const warnNullService = () => {
  console.warn(
    "NullGameViewService should almost never be used. Check your reference or initialization"
  );
};

function webviewToolbarAdapter(n) {
  return {
    getGameViewData: async () => n.getGameViewData(),
    setGameViewVisible: async (e) => {
      n.setGameViewVisible(e);
    },
    async showGameView() {
      return n.showGameView;
    },
    onCloseScene(e) {
      n.onCloseScene(e);
    },
    onUpdateScene(e) {
      n.onUpdateScene(e);
    },
    onSceneFocus(e) {
      n.onSceneFocus(e);
    },
    onUpdateSceneDirty(e, a) {
      n.onUpdateSceneDirty(e, a);
    },
  };
}
function nativeToolbarAdapter() {
  return {
    getGameViewData: async () =>
      Editor.Message.request("scene", "query-preview-game-view-data"),
    setGameViewVisible: async (e) => {},
    async showGameView() {
      return true;
    },
    onCloseScene(e) {},
    onUpdateScene() {},
    onSceneFocus() {},
    onUpdateSceneDirty(e, a) {},
  };
}
exports.NullGameViewService = {
  async setGameViewVisible() {
    warnNullService();
  },
  async getGameViewData() {
    warnNullService();
    return getDefaultGameViewData();
  },
  async showGameView() {
    warnNullService();
    return false;
  },
  onCloseScene(e) {},
  onUpdateScene() {},
  onSceneFocus() {},
  onUpdateSceneDirty(e, a) {},
};
