var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolbarSceneTabs = undefined;

const { basename, extname } = require("path");

const scene_tab_item_1 = __importDefault(require("./scene-tab-item"));
const scene_tab_drag_1 = require("./scene-tab-drag");
const Vue = require("vue/dist/vue.js");

const template = `
  <div class="tabs-container" @mouseenter="scrollbarVisible = true" @mouseleave="scrollbarVisible = false">
      <div 
          ref='scrollTrack' 
          :class="['tabs-scrollbar-track', scrollbarVisible || isThumbDragging? 'tabs-scrollbar-show' : '']"
      >
          <div 
              class="tabs-scrollbar-thumb" 
              ref='scrollThumb'
              @mousedown="onThumbMouseDown"
              :style="{width: this.scrollbarStyle.width, left: this.scrollbarStyle.left}"
          ></div>
      </div> 
      <div class="tabs-content" ref="tabContent">
          <div class="tabs-toolbar" ref="tabToolbar" >
              <template v-for="(tab, index) in tabs"> 
                  <scene-tab-item 
                      :key="tab.uuid" 
                      :id="index" 
                      :data="tab"
                      :icon="tab.type"
                      :active="currentTabIndex === index" 
                      :title="getName(tab)"
                      :closeable="tabs.length > 1"
                      @select="onChangeTab"
                      @contextmenu="onContextmenuEvent"
                      @close="onClose"
                  >
                  </scene-tab-item>
              </template>
          </div>
      </div>
  </div>
`;

exports.ToolbarSceneTabs = Vue.extend({
  name: "ToolbarSceneTabs",
  components: { SceneTabItem: scene_tab_item_1.default },
  props: {},
  data() {
    return {
      processingUuids: new Set(),
      currentTabIndex: -1,
      canChangeTab: true,
      tabs: [],
      leftEnabled: false,
      rightEnabled: false,
      scrollbarVisible: false,
      scrollbarStyle: { width: "0px", left: "0px" },
      resizeHandle: null,
      isThumbDragging: false,
      thumbStartX: 0,
      startDragX: 0,
    };
  },
  watch: {
    currentTabIndex() {
      this.scrollToCurrentTab();
    },
  },
  async mounted() {
    var e = await Editor.Profile.getConfig("scene", "scene.multi");
    const t = async () => {
      this.tabs = (await this.querySceneInfo()) || [];
      this.currentTabIndex = this.tabs.length - 1;
      console.debug("ToolbarSceneTabs mounted started");
      Editor.Message.__protected__.removeBroadcastListener("scene:ready", t);

      this.$nextTick(() => this.calculateScroll());
    };

    if (e) {
      Editor.Message.__protected__.addBroadcastListener("scene:ready", t);
    }

    e = this.$refs.tabContent;

    if (e) {
      e.addEventListener("wheel", this.onMouseWheel, { passive: false });
      e.addEventListener("scroll", this.onScrollEvent);

      this.resizeHandle = new window.ResizeObserver(() =>
        this.calculateScroll()
      ).observe(e);
    }

    if (this.$refs.tabToolbar) {
      new scene_tab_drag_1.SceneTagDrag(this.$refs.tabToolbar, {
        draggable: ".tab-container",
        animate: 100,
        easing: "ease-in",
        onEnd: ({ newIndex, oldIndex }) => {
          if (
            newIndex !== oldIndex &&
            ((oldIndex = this.tabs[oldIndex]),
            (newIndex =
              newIndex >= this.tabs.length - 1 ? "end" : this.tabs[newIndex]),
            oldIndex) &&
            newIndex
          ) {
            this.moveTabsTo(
              oldIndex.uuid,
              newIndex === "end" ? "end" : newIndex.uuid
            );
          }
        },
      });
    }
  },
  beforeDestroy() {
    var e = this.$refs.tabContent;

    if (
      e &&
      (e.removeEventListener("wheel", this.onMouseWheel),
      e.removeEventListener("scroll", this.onScrollEvent),
      this.resizeHandle)
    ) {
      this.resizeHandle.disconnect();
      this.resizeHandle = null;
    }
  },
  methods: {
    getName(e) {
      var t = basename(e.name, extname(e.name));
      return e.dirty ? t + "*" : t;
    },
    async isDirty() {
      var e = (await Editor.Windows.__protected__.queryMainTitle()).split(
        " - "
      );
      return !!e[0] && e[0].includes(".scene*");
    },
    addTab(e, t) {
      this.tabs.push({
        uuid: e,
        name: t?.displayName || t?.name || "Untitled",
        type: t?.type,
        dirty: false,
      });

      return this.tabs.length - 1;
    },
    async onCloseScene(e) {
      await this._updateTabs();
    },
    async _updateTabs() {
      this.tabs = (await this.querySceneInfo()) || [];
      this.currentTabIndex = await this.querySceneFocus();
    },
    async closeOthers(e) {
      return Editor.Message.request("scene", "multi-close-others", e);
    },
    async closeToTheRight(e) {
      return Editor.Message.request("scene", "multi-close-to-the-right", e);
    },
    async moveTabsTo(e, t) {
      return Editor.Message.request("scene", "multi-move-tabs-to", e, t);
    },
    async onUpdateSceneDirty() {
      await this._updateTabs();
      Editor.EditMode.getMode();
    },
    async querySceneInfo() {
      return Editor.Message.request("scene", "multi-scene-query");
    },
    async querySceneFocus() {
      const t = await Editor.Message.request(
        "scene",
        "multi-scene-focus-query"
      );
      return this.tabs.findIndex((e) => e.uuid === t);
    },
    onSceneFocus(t) {
      this.currentTabIndex = this.tabs.findIndex((e) => e.uuid === t);
    },
    async closeScene(e) {
      return Editor.Message.send("scene", "multi-close-scene", e);
    },
    async onUpdateScene(e) {
      try {
        await this._updateTabs();

        if (this.currentTabIndex >= this.tabs.length) {
          this.currentTabIndex = this.tabs.length - 1;
        }
      } catch (e) {
        console.error(e);
      }
    },
    setCurrentTabIndex(e) {
      if (e < 0) {
        e = 0;
      } else if (e >= this.tabs.length) {
        e = this.tabs.length - 1;
      }

      var t = this.tabs[e];

      if (t && this.currentTabIndex !== e) {
        this.currentTabIndex = e;
        Editor.Message.send("scene", "multi-scene-focus", t.uuid);
      }
    },
    removeTab(e) {
      if (-1 !== e) {
        this.tabs.splice(e, 1);
        this.onChangeTab(e);
      }
    },
    onChangeTab(e) {
      if (!this.isThumbDragging) {
        if (this.canChangeTab) {
          this.setCurrentTabIndex(e);
        }
      }
    },
    async locateResource(e) {
      Editor.Message.send("assets", "twinkle", e.uuid, "shrink");
    },
    onContextmenuEvent(e, t, s) {
      Editor.Menu.popup({
        menu: [
          {
            label: "i18n:scene.multi_tab_contextmenu.close",
            enabled: this.tabs.length > 1,
            click: () => {
              this.onClose(t);
            },
          },
          {
            label: "i18n:scene.multi_tab_contextmenu.close_others",
            enabled: this.tabs.length > 1,
            click: () => {
              this.closeOthers(s.uuid);
            },
          },
          {
            label: "i18n:scene.multi_tab_contextmenu.close_to_right",
            enabled: t < this.tabs.length - 1,
            click: () => {
              this.closeToTheRight(s.uuid);
            },
          },
          { type: "separator" },
          {
            label: "i18n:scene.multi_tab_contextmenu.locate_resource",
            click: () => {
              this.locateResource(s);
            },
          },
        ],
      });
    },
    onClose(e) {
      if (
        this.canChangeTab &&
        (console.debug("close-scene " + e), (e = this.tabs[e].uuid))
      ) {
        this.closeScene(e);
      }
    },
    calculateScroll() {
      var e;
      var t;
      var s;
      var a = this.$refs.tabContent;
      var n = this.$refs.scrollTrack;
      if (a && n) {
        e = this.$refs.tabToolbar.scrollWidth;

        s =
          1 <= (s = (t = a.clientWidth) / e)
            ? 0
            : Math.max(30, n.clientWidth * s);

        a = a.scrollLeft / (e - t);
        n = n.clientWidth - s;
        this.scrollbarStyle = { width: s + "px", left: a * n + "px" };
        return { contentWidth: e, visibleWidth: t, thumbWidth: s };
      }
    },
    onMouseWheel(t) {
      var s = this.$refs.tabContent;
      if (s && (t.preventDefault(), t.deltaY !== 0 || t.deltaX !== 0)) {
        var a = t.deltaX !== 0 && Math.abs(t.deltaY) < Math.abs(t.deltaX);
        var n = t.wheelDelta && t.wheelDelta % 120 != 0 ? 5 : 25;
        let e;

        e = a
          ? s.scrollLeft + (t.deltaX > 0 ? n : -n)
          : s.scrollLeft + (t.deltaY > 0 ? n : -n);

        s.scrollTo({ left: e, behavior: "auto" });
      }
    },
    onScrollEvent(e) {
      requestAnimationFrame(() => this.calculateScroll());
    },
    onThumbMouseDown(e) {
      if (this.$refs.scrollThumb) {
        e.preventDefault();
        this.isThumbDragging = true;
        this.thumbStartX = parseFloat(this.scrollbarStyle.left || "0");
        this.startDragX = e.clientX;
        document.addEventListener("mousemove", this.onThumbMouseMove);
        document.addEventListener("mouseup", this.onThumbMouseUp);
      }
    },
    onThumbMouseMove(e) {
      var t;
      var s;
      var a;

      if (this.isThumbDragging && (t = this.calculateScroll())) {
        ({ contentWidth: t, visibleWidth: s, thumbWidth: a } = t);
        e = e.clientX - this.startDragX;
        a = this.$refs.scrollTrack.clientWidth - a;
        e = this.thumbStartX + e;
        e = Math.max(0, Math.min(e, a));
        this.scrollbarStyle.left = e + "px";
        this.$refs.tabContent.scrollLeft = (e / a) * (t - s);
      }
    },
    onThumbMouseUp() {
      this.isThumbDragging = false;
      document.removeEventListener("mousemove", this.onThumbMouseMove);
      document.removeEventListener("mouseup", this.onThumbMouseUp);
    },
    scrollToCurrentTab() {
      var e = this.$refs.tabContent;
      var t = this.$refs.tabToolbar;

      if (e && t && this.currentTabIndex >= 0) {
        if (
          (t = t.children[this.currentTabIndex]) &&
          (t.offsetLeft < e.scrollLeft ||
            t.offsetLeft + t.offsetWidth > e.scrollLeft + e.offsetWidth)
        ) {
          e.scrollTo({ left: t.offsetLeft, behavior: "smooth" });
        }
      }
    },
  },
  template,
});
