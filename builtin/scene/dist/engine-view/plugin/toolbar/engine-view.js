Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineViewToolbar = undefined;
const Vue = require("vue/dist/vue.js");
const default_1 = require("./default");
const game_view_1 = require("./game-view");
const scene_tabs_1 = require("./scene-tabs");
exports.EngineViewToolbar = Vue.extend({
  name: "EngineViewToolbar",
  components: {
    ToolbarSceneTabs: scene_tabs_1.ToolbarSceneTabs,
    ToolbarDefault: default_1.ToolbarDefault,
    ToolbarGameView: game_view_1.ToolbarGameView,
  },
  data() {
    return {
      left: [],
      right: [],
      showGameView: false,
      enabledMultiSceneEdit: false,
    };
  },
  async mounted() {
    this.enabledMultiSceneEdit = await Editor.Profile.getConfig(
      "scene",
      "scene.multi"
    );
  },
  destroyed() {},
  methods: {
    getGameViewData() {
      var e = this.$refs.gameViewToolbar;
      if (e) {
        return { ...e.gameViewData };
      }
      throw new Error('template "gameViewToolbar" not found. please check it');
    },
    setGameViewVisible(e) {
      this.showGameView = typeof e == "boolean" ? e : !this.showGameView;
    },
    queryDevices() {
      return this.$refs.gameViewToolbar.queryDevices();
    },
    onCloseScene(e) {
      var a = this.$refs.sceneTabsToolbar;

      if (a) {
        a.onCloseScene(e);
      }
    },
    onUpdateSceneDirty(e, a) {
      var o = this.$refs.sceneTabsToolbar;

      if (o) {
        o.onUpdateSceneDirty();
      }
    },
    onUpdateScene(e) {
      var a = this.$refs.sceneTabsToolbar;

      if (a) {
        a.onUpdateScene(e);
      }
    },
    onSceneFocus(e) {
      var a = this.$refs.sceneTabsToolbar;

      if (a) {
        a.onSceneFocus(e);
      }
    },
  },
});
