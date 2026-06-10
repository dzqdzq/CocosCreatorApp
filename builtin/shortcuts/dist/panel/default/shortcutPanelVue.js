Object.defineProperty(exports, "__esModule", { value: true });

const { join } = require("path");

const { readFileSync } = require("fs-extra");

const { sortShortcutMap, handleEventKey } = require("../../utils");

const Vue = require("vue/dist/vue.js");
Vue.config.productionTip = false;
Vue.config.devtools = false;

exports.default = Vue.extend({
  props: { qwertyKeys: { type: Object, required: true } },
  data() {
    return {
      map: {},
      shortcutList: {},
      active: "",
      msg: null,
      left: [],
      right: [],
      editInfo: null,
      checkEditInfoTimer: null,
      dirty: true,
      editFlag: { hasHandle: false },
    };
  },
  async mounted() {
    this.left = this.qwertyKeys.left;
    this.right = this.qwertyKeys.right;
    await this.updateShortcutMap();

    if (!this.active) {
      this.active = Object.keys(this.map)[0];
    }
  },
  methods: {
    t(t) {
      return Editor.I18n.t("shortcuts." + t);
    },
    scrollIntoView(t) {
      t = t.currentTarget;

      if (t) {
        t.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    },
    async updateShortcutMap() {
      var t = await Editor.Message.request(
        "shortcuts",
        "query-packages-shortcut-list"
      );
      this.map = sortShortcutMap(t);
    },
    onSelect(t, i) {
      this.active = i;
      this.scrollIntoView(t);
      this.msg = null;
      this.editInfo = null;
    },
    async handlerMissing(t) {
      return (
        !!t.missing &&
        (1 === (await this.checkShouldRemove()) &&
          (await this.removeCustomShortcut(t.key)),
        true)
      );
    },
    async checkShouldRemove() {
      return (
        await Editor.Dialog.info(this.t("invalid_shortcut.message"), {
          title: this.t("invalid_shortcut.title"),
          buttons: [
            this.t("invalid_shortcut.cancel"),
            this.t("invalid_shortcut.remove"),
          ],
          default: 1,
          cancel: 0,
        })
      ).response;
    },
    async changeShortcuts() {
      if (!this.editFlag.hasHandle) {
        this.checkEditInfoTimer = setTimeout(() => {
          this._changeShortcuts();
        }, 300);
      }
    },
    async _changeShortcuts() {
      var t;

      if (this.checkEditShortcutChanged()) {
        if (this.editInfo) {
          if (
            !(t = this.map[this.active][this.editInfo.key]) ||
            (this.editInfo.searches &&
              ((this.editInfo.searches = []), this.editInfo.conflict))
          ) {
            this.editInfo = null;
          } else {
            (await Editor.Message.request(
              "shortcuts",
              "change-shortcut",
              t,
              this.editInfo.shortcut
            )) &&
              ((t.rawShortcut = t.rawShortcut || t.shortcut),
              (t.shortcut = this.editInfo.shortcut));

            this.editInfo = null;
            this.dirty = true;
          }
        }
      } else {
        this.editInfo = null;
      }
    },
    checkEditShortcutChanged() {
      var t;
      return !!(
        this.editInfo &&
        this.editInfo.key &&
        this.editInfo.shortcut &&
        ((t = this.editInfo.key), (t = this.map[this.active][t])) &&
        t.shortcut !== this.editInfo.shortcut
      );
    },
    async removeCustomShortcut(t) {
      this.editFlag.hasHandle = true;
      var i = this.map[this.active][t];

      if (
        await Editor.Message.request("shortcuts", "remove-custom-shortcut", i)
      ) {
        await this.updateShortcutMap();
        this.msg = this.map[this.active][t];
        this.editInfo = null;
        this.dirty = true;
      }

      this.editFlag.hasHandle = false;
    },
    async checkApplyShortcut() {
      if (
        this.checkEditShortcutChanged() &&
        (
          await Editor.Dialog.info(this.t("tips.is_apply"), {
            buttons: ["cancel", "save"],
            default: 0,
          })
        ).response
      ) {
        await this.changeShortcuts();
      }
    },
    async onItemClick(t, i) {
      this.msg = this.map[this.active][i];
      this.scrollIntoView(t);

      if (this.editInfo && this.editInfo.key !== i) {
        await this.checkApplyShortcut();
      }
    },
    async updateShortcutList() {
      if (this.dirty) {
        this.shortcutList = await Editor.Message.request(
          "shortcuts",
          "query-shortcut-map"
        );

        this.dirty = false;
      }
    },
    async startEditShortcuts(t, i) {
      if (this.checkEditInfoTimer) {
        clearTimeout(this.checkEditInfoTimer);
      }

      await this._changeShortcuts();

      if (!(await this.handlerMissing(i))) {
        (t = t.currentTarget) && t.focus();

        this.editInfo = {
          key: i.key,
          shortcut: "",
          searches: [],
          conflict: false,
          when: i.when,
          showSearches: false,
        };
      }
    },
    async onEditKeyDown(t) {
      if (this.checkEditInfoTimer) {
        clearTimeout(this.checkEditInfoTimer);
      }

      t.preventDefault();
      t.stopImmediatePropagation();
      t.stopPropagation();

      if (this.editInfo) {
        this.editFlag.hasHandle = false;
        this.editInfo.shortcut = handleEventKey(t);
        await this.updateShortcutList();
        t = this.shortcutList[this.editInfo.shortcut] || [];

        this.editInfo.searches = t.filter(
          (t) => this.editInfo && t.key !== this.editInfo.key
        );

        this.editInfo.conflict = this.editInfo.searches.some(
          (t) => this.editInfo && t.when === this.editInfo.when
        );
      }
    },
    async jumpToItem(t) {
      if (this.checkEditInfoTimer) {
        clearTimeout(this.checkEditInfoTimer);
      }

      await this._changeShortcuts();
      this.editFlag.hasHandle = true;
      this.active = t.pkgName;

      if (this.map[this.active][t.key]) {
        this.msg = this.map[this.active][t.key];
      }
    },
    getEditInfoState() {
      return this.editInfo &&
        this.editInfo.searches &&
        this.editInfo.searches.length
        ? this.editInfo.conflict
          ? "error"
          : "warn"
        : "";
    },
    async clearShortcuts(t) {
      var i = this.map[this.active][t];

      if (!(await this.handlerMissing(i))) {
        this.editFlag.hasHandle = true;

        (await Editor.Message.request("shortcuts", "change-shortcut", i, "")) &&
          (await this.updateShortcutMap(),
          (this.msg = this.map[this.active][t]),
          (this.editInfo = null),
          (this.dirty = true));

        this.editFlag.hasHandle = false;
      }
    },
    async resetShortcuts(t) {
      if (this.checkEditInfoTimer) {
        clearTimeout(this.checkEditInfoTimer);
      }

      this.editFlag.hasHandle = true;
      var t = this.map[this.active][t];
      var i = await Editor.Message.request("shortcuts", "reset-shortcut", t);
      t.shortcut = i || t.rawShortcut;
      this.dirty = true;
      this.editInfo = null;
      this.msg = t;
      this.editFlag.hasHandle = false;
    },
  },
  template: readFileSync(
    join(__dirname, "../../../static", "./default/index.html"),
    "utf8"
  ),
});
