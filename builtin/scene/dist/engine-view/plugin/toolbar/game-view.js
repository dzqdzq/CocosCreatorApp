var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, i, t, a = t) => {
        var s = Object.getOwnPropertyDescriptor(i, t);

        if (
          !s ||
          (!("get" in s) ? !s.writable && !s.configurable : i.__esModule)
        ) {
          s = {
            enumerable: true,
            get() {
              return i[t];
            },
          };
        }

        Object.defineProperty(e, a, s);
      }
    : (e, i, t, a) => {
        e[(a = a === undefined ? t : a)] = i[t];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, i) => {
        Object.defineProperty(e, "default", { enumerable: true, value: i });
      }
    : (e, i) => {
        e.default = i;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var s = (e) =>
      (s =
        Object.getOwnPropertyNames ||
        ((e) => {
          var i;
          var t = [];
          for (i in e) {
            if (Object.prototype.hasOwnProperty.call(e, i)) {
              t[t.length] = i;
            }
          }
          return t;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var i = {};
      if (e != null) {
        for (var t = s(e), a = 0; a < t.length; a++) {
          if (t[a] !== "default") {
            __createBinding(i, e, t[a]);
          }
        }
      }
      __setModuleDefault(i, e);
      return i;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolbarGameView = undefined;
const Vue = require("vue/dist/vue.js");

const { getDefaultGameViewData } = require("./data");

const plugin_1 = require("./plugin");

const ViewSelect = __importStar(
  require("../../../contributions/ui-kit/view-select/index")
);

const template = `
  <div class="game-view-toolbar">
        <div class="left">
          <div class="item"> 
              <ui-button class="transparent" type="icon" @click="openDevTool" tooltip="DevTool">
                  <ui-icon value="dev-tools"></ui-icon>
              </ui-button>
          </div>
          <div class="item">
              <ui-button class="stats transparent" :selected="gameViewData.stats" @click="handleOnStats">
                  <ui-label value="Stats"></ui-label>
              </ui-button>
          </div>
          <div class="item fps">
              <ui-label value="FPS"></ui-label>
              <ui-num-input @change="handleOnFPS" step="1" min="1" :value="gameViewData.fps"></ui-num-input>
          </div>
      </div>
      <div class="right">
          <ui-prop class="item" tooltip="i18n:scene.camera_size.render_target_resolution">
              <view-select
                  :options="devicesList"
                  :value="gameViewData.devicesInfo.name"
                  @change="handleOnDevice"
              >
              </view-select>
          </ui-prop>
          <ui-prop class="item" :disabled="isNative" :tooltip="isNative ? 'i18n:scene.disable_in_native_tooltip': undefined">
              <ui-button class="rotate-wrap transparent" type="icon"
                  @click="handleOnRotate"
                  :selected="gameViewData.rotate"
                  :disabled="isNative"
              >
                  <ui-icon value="rotate"></ui-icon>
              </ui-button>
          </ui-prop>
          <ui-prop class="item scale" ref="scale" :disabled="isNative" :tooltip="isNative ? 'i18n:scene.disable_in_native_tooltip': undefined">
              <ui-button :disabled="isNative" class="transparent" type="icon"
                  @click="onReduceButtonClick"
              >
                  <ui-icon value="reduce"></ui-icon>
              </ui-button>
              <ui-slider :disabled="isNative" step="1" hide-num-input
                  :value="gameViewData.sliderValue"
                  @change="handleOnScale"
              ></ui-slider>
              <ui-button :disabled="isNative" class="add transparent" type="icon"
                  @click="onPlusButtonClick"
              >
                  <ui-icon value="add"></ui-icon>
              </ui-button>
              <ui-label :disabled="isNative"
                  :value="gameViewData.scaleValue"
              ></ui-label>
              <ui-label value="%"></ui-label>
          </ui-prop>
          <ui-prop class="item" :disabled="isNative" :tooltip="isNative ? 'i18n:scene.disable_in_native_tooltip' : undefined">
              <ui-button class="fullscreen-wrap transparent" type="icon" :tooltip="isNative ? undefined : 'i18n:scene.game_view.full_screen_tips'" 
                  :disabled="isNative"
                  @click="handleOnFullScreen"
                  :selected="gameViewData.fullScreen"
              >
                  <ui-icon value="fullscreen"></ui-icon>
              </ui-button>
          </ui-prop>
      </div>
  </div>
`;

exports.ToolbarGameView = Vue.extend({
  name: "ToolbarGameView",
  components: { plugin: plugin_1.ToolbarPlugin, "view-select": ViewSelect },
  props: {
    isNative: { type: Boolean, default: false },
    visible: { type: Boolean, default: false },
  },
  data() {
    return {
      devicesList: [],
      gameViewData: getDefaultGameViewData(),
    };
  },
  mounted() {
    this.queryDevices();
    this.initGameView();

    Editor.Profile.__protected__.on(
      "change",
      this.generalDesignResolutionChanged
    );

    Editor.Message.__protected__.addBroadcastListener(
      "device:devices-changed",
      this.onDevicesChanged
    );

    Editor.Message.__protected__.addBroadcastListener(
      "i18n:change",
      this.onI18nChange
    );
  },
  beforeDestroy() {
    Editor.Profile.__protected__.removeListener(
      "change",
      this.generalDesignResolutionChanged
    );

    Editor.Message.__protected__.removeBroadcastListener(
      "device:devices-changed",
      this.onDevicesChanged
    );

    Editor.Message.__protected__.removeBroadcastListener(
      "i18n:change",
      this.onI18nChange
    );
  },
  methods: {
    openDevTool() {
      Editor.Message.send("scene", "open-preview-devtools");
    },
    async requestStyleChange() {
      var e = this.isNative
        ? "editor-preview-change-style-native"
        : "editor-preview-change-style-web";

      var e = await Editor.Message.request("scene", e);
      if (e == null) {
        throw new Error(
          `Invalid style changed return value:${e}, please ensure GameView is activated`
        );
      }
      return e;
    },
    async initGameView() {
      var e = await Editor.Profile.getConfig("scene", "game-view");
      this.gameViewData = Object.assign({}, this.gameViewData, e);

      if (this.isNative) {
        this.gameViewData.scaleValue = 100;
        this.gameViewData.sliderValue = 50;
        this.gameViewData.fullScreen = false;
      }
    },
    async queryDevices() {
      var e = await Editor.Message.request("device", "query");
      var i = await Editor.Message.request(
        "project",
        "query-design-resolution"
      );
      this.devicesList = [];

      var e = e.map((e) => ({
        label: `${e.name} (${e.width}x${e.height})`,
        name: e.name,
        width: e.width,
        height: e.height,
      }));

      var t = [
        {
          label: "" + Editor.I18n.t("scene.game_view.free_aspect"),
          type: "free",
          name: "i18n:scene.game_view.free_aspect",
        },
        { label: "16:9", type: "ratio", width: 16, height: 9, name: "16:9" },
        {
          label: "16:10",
          type: "ratio",
          width: 16,
          height: 10,
          name: "16:10",
        },
      ];

      if (!this.isNative) {
        t.push(
          {
            label: `${Editor.I18n.t("scene.game_view.design_resolution")} (${
              i.width
            }x${i.height})`,
            type: "design",
            width: i?.width,
            height: i?.height,
            name: "i18n:scene.game_view.design_resolution",
          },
          { name: "__separator__" },
          ...e,
          { name: "__separator__" },
          {
            label: Editor.I18n.t("scene.game_view.edit"),
            type: "edit",
            name: "i18n:scene.game_view.edit",
          }
        );
      }

      this.devicesList = t;
    },
    async handleOnStats(e) {
      var i = !this.gameViewData.stats;
      this.gameViewData.stats = i;
      await Editor.Profile.setConfig("scene", "game-view.stats", i);
      Editor.Message.send("scene", "editor-preview-change-config");
    },
    async handleOnFPS(e) {
      var i = e.target.value;
      this.gameViewData.fps = e.target.value;
      await Editor.Profile.setConfig("scene", "game-view.fps", i);
      Editor.Message.send("scene", "editor-preview-change-config");
    },
    async handleOnRotate(e) {
      var i = !this.gameViewData.rotate;
      this.gameViewData.rotate = i;
      await Editor.Profile.setConfig("scene", "game-view.rotate", i);
      this.requestStyleChange();
    },
    async handleOnFullScreen(e) {
      var i = !this.gameViewData.fullScreen;

      this.gameViewData.fullScreen = i;

      await Editor.Profile.setConfig(
        "scene",
        "game-view.fullScreen",
        Boolean(i)
      );

      var t = await this.requestStyleChange();

      if (i) {
        this.scaleToSlider(t.scale);
      }
    },
    async handleOnScale(e) {
      e = e.target;

      if (this.isSliderValueSave(e.value)) {
        this.solveScale(e.value);

        this.gameViewData.fullScreen &&
          ((this.gameViewData.fullScreen = false),
          await Editor.Profile.setConfig(
            "scene",
            "game-view.fullScreen",
            false
          ));

        this.requestStyleChange();
      }
    },
    scaleToSlider(e) {
      let i = 0;

      if (e >= 100) {
        i = 50 + (50 * (e - 100)) / 300;
      } else if (e > 10) {
        i = (50 * (e - 10)) / 90;
      }

      var t = parseInt(String(i), 10);
      var e = parseInt(String(e), 10);
      this.$set(this.gameViewData, "scaleValue", e);
      this.$set(this.gameViewData, "sliderValue", t);
      Editor.Profile.setConfig("scene", "game-view.scaleValue", e);
      Editor.Profile.setConfig("scene", "game-view.sliderValue", t);
    },
    solveScale(e) {
      let i;

      if (e < 50) {
        i = 10 + (e / 50) * 90;
      }

      if (e === 50) {
        i = 100;
      }

      if (e > 50) {
        i = 100 + ((e - 50) / 50) * 300;
      }

      this.gameViewData.sliderValue = e;
      this.gameViewData.scaleValue = parseInt(String(i), 10);

      Editor.Profile.setConfig(
        "scene",
        "game-view.scaleValue",
        parseInt(String(i), 10)
      );

      Editor.Profile.setConfig("scene", "game-view.sliderValue", e);
    },
    onReduceButtonClick(e) {
      var i = this.gameViewData.sliderValue - 1;

      if (this.isSliderValueSave(i)) {
        this.gameViewData.sliderValue = i;
        this.gameViewData.fullScreen = false;
        this.solveScale(i);
        this.requestStyleChange();
      }
    },
    onPlusButtonClick(e) {
      var i = this.gameViewData.sliderValue + 1;

      if (this.isSliderValueSave(i)) {
        this.gameViewData.sliderValue = i;
        this.gameViewData.fullScreen = false;
        this.solveScale(i);
        this.requestStyleChange();
      }
    },
    isSliderValueSave(e) {
      return e >= 0 && e <= 100;
    },
    async handleOnDevice(i) {
      var e;

      if (i === "i18n:scene.game_view.edit") {
        Editor.Message.request("preferences", "open-settings", "device");
      } else {
        e = this.devicesList.filter((e) => e.name === i)[0];

        e = {
          name: i,
          type: e?.type || "device",
          width: e?.width || 0,
          height: e?.height || 0,
        };

        this.gameViewData.devicesInfo = e;
        await Editor.Profile.setConfig("scene", "game-view.devicesInfo", e);

        this.visible &&
          ((e = await this.requestStyleChange()),
          this.gameViewData.fullScreen) &&
          this.scaleToSlider(e.scale);
      }
    },
    async onDevicesChanged() {
      this.queryDevices();
      var e = await Editor.Message.request("device", "query");

      if (
        this.gameViewData.devicesInfo.name !==
          "i18n:scene.game_view.design_resolution" &&
        !e.find((e) => e.name === this.gameViewData.devicesInfo.name)
      ) {
        this.handleOnDevice("i18n:scene.game_view.design_resolution");
      }
    },
    generalDesignResolutionChanged(e, i, t, a) {
      if (
        e === "project" &&
        i.includes("project") &&
        t.includes("general.designResolution")
      ) {
        this.onDevicesChanged();
      }
    },
    onI18nChange() {
      this.queryDevices();
    },
  },
  template,
});
