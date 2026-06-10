Object.defineProperty(exports, "__esModule", { value: true });
exports.PreviewRangeRow = undefined;

const { defineComponent } = require("vue/dist/vue.js");

const { join, basename } = require("path");

const { isPlainObject } = require("lodash");

const { readFileSync } = require("fs-extra");

const animation_ctrl_1 = require("../../share/animation-ctrl");
const animation_editor_1 = require("../../share/animation-editor");
const global_data_1 = require("../../share/global-data");
const pop_menu_1 = require("../../share/pop-menu");

const { getPopMenuMap } = pop_menu_1;

const utils_1 = require("../../utils");

const template = readFileSync(
  join(
    __dirname,
    "./../../../../static/template/components/preview-range-row.html"
  ),
  "utf-8"
);

function patchEmbeddedPlayer(e) {
  var t = utils_1.EmbeddedPlayerMenuMap[e.playable.type];
  var a = e.playable.path;
  return {
    ...e,
    icon: t.icon,
    label: t.label,
    displayName: e.displayName,
    defaultDisplayName: (a && basename(a)) || t.label,
  };
}
exports.PreviewRangeRow = defineComponent({
  name: "PreviewRangeRow",
  props: [
    "trackInfo",
    "selectPlayers",
    "lock",
    "index",
    "offset",
    "scroll",
    "updatePosition",
  ],
  data() {
    return {
      refreshTask: null,
      refreshTaskNumber: 0,
      tips: "",
      selectEmbeddedPlayerKeys: [],
      selectInfos: [],
    };
  },
  computed: {
    previewStyle() {
      return {
        transform: `translateY(${
          this.index * animation_editor_1.animationEditor.LINE_HEIGHT -
          this.scroll.top
        }px)`,
        "pointer-events": "auto",
      };
    },
    previewClass() {
      let e = "";
      return [
        "content-item",
        "preview-row",
        (e = this.index % 2 == 0 ? "dark" : "light"),
        this.lock ? "lock" : "",
      ];
    },
    displayEmbeddedPlayerInfo() {
      return this.trackInfo && this.trackInfo.embeddedPlayers
        ? this.trackInfo.embeddedPlayers.map((t) => {
            var e = this.selectInfos.find((e) => e.key === t.key);
            return patchEmbeddedPlayer(e || t);
          })
        : null;
    },
  },
  watch: {
    selectPlayers(e, t) {
      this.$set(this, "selectEmbeddedPlayerKeys", this.calcSelectKey(e));
    },
    updatePosition() {
      this.$set(
        this,
        "selectEmbeddedPlayerKeys",
        this.calcSelectKey(this.selectInfos)
      );
    },
  },
  mounted() {},
  methods: {
    t(e, t = "preview_row.") {
      return Editor.I18n.t("animator." + t + e);
    },
    queryKeyStyle(e) {
      return `transform: translateX(${e.x || 0}px); width: ${e.width || 20}px;`;
    },
    onRangeMouseDown(e, t) {
      if (e.button !== 2) {
        animation_editor_1.animationEditor.onStartDragSuregion(e, t);
      }
    },
    onDragOver(t) {
      var a = (
        JSON.parse(
          JSON.stringify(Editor.UI.__protected__.DragArea.currentDragInfo)
        ) || {}
      ).value;
      if (a && t.dataTransfer) {
        let e;
        try {
          e = JSON.parse(a);

          if (!isPlainObject(e) || typeof e.group != "string") {
            throw new Error(`unexpected embeddedPlayerInfo:"${a}"`);
          }
        } catch (e) {
          if (Editor.App.dev) {
            console.debug(e);
          }

          return void (t.dataTransfer.dropEffect = "none");
        }

        if (e.playable?.type !== this.trackInfo.type) {
          t.dataTransfer.dropEffect = "none";
        } else {
          t.dataTransfer.dropEffect = "move";
        }
      }
    },
    onDragStart(e, t) {
      var a = e.target.getAttribute("name");

      if (!["left", "right"].includes(a)) {
        global_data_1.Flags.startDragEmbeddedPlayerInfo.type = "drop";
        e.target.style.cursor = "grabbing";

        e.dataTransfer &&
          ((a = e.target.parentNode),
          e.dataTransfer.setDragImage(a, 0, 0),
          e.dataTransfer.setData("value", JSON.stringify(t)),
          (e.dataTransfer.effectAllowed = "move"));
      }
    },
    showRangePopMenu(e, t, a) {
      var r = getPopMenuMap(pop_menu_1.onEmbeddedPlayerMenus);

      r.removeEmbeddedPlayer.click = () => {
        if (a) {
          animation_editor_1.animationEditor.deleteSelecteEmbeddedPlayers();
        } else {
          animation_ctrl_1.animationCtrl.deleteEmbeddedPlayer(
            animation_editor_1.animationEditor.transEmbeddedPlayerInfoToDump(
              t,
              false
            )
          );
        }
      };

      r.copyEmbeddedPlayer.click = () => {
        animation_ctrl_1.animationCtrl.copyEmbeddedPlayerDump = [
          animation_editor_1.animationEditor.transEmbeddedPlayerInfoToDump(
            t,
            false
          ),
        ];
      };

      Editor.Menu.popup({ menu: Object.values(r) });
    },
    onDrop(e) {
      animation_editor_1.animationEditor.onEmbeddedPlayerDrop(
        e,
        this.trackInfo.key
      );
    },
    async showContextMenu(e) {
      global_data_1.Flags.mouseDownName = "";

      await animation_editor_1.animationEditor.onEmbeddedPlayerContextMenu(
        e,
        this.trackInfo
      );
    },
    calcSelectKey(e) {
      if (e && e.length) {
        this.selectInfos = e.filter((e) => e.group === this.trackInfo.key);
      } else {
        this.selectInfos = [];
      }

      return this.selectInfos.map((e) => e.key);
    },
  },
  template,
});
