var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const package_json_1 = __importDefault(require("../../package.json"));

const { join, basename, extname, dirname } = require("path");

const { readFileSync } = require("fs");

const { I18n, Message, Dialog, Profile } = Editor;
let currentImageData;
const shortcutsMoveDistance = 2;
let onPositionChangeFunc;
let onScaleChangeFunc;
let onOpacityChangeFunc;
let onAddImageFunc;
let onDelImageFunc;
let onSwitchImagesFunc;
module.exports = Editor.Panel.define({
  style: readFileSync(join(__dirname, "../../dist/index.css"), "utf8"),
  template: readFileSync(join(__dirname, "../../statics/index.html"), "utf8"),
  $: {
    ui_images: ".images",
    btnAdd: ".add-image",
    btnAddLabel: "#add-btn-label",
    btnDel: ".del-image",
    x: ".x",
    y: ".y",
    sx: ".sx",
    sy: ".sy",
    opacity: ".opacity",
  },
  methods: {
    set$(e, t) {
      if (e) {
        e.value = t;
      }
    },
    getCurrent() {
      return currentImageData;
    },
    async renderUI(t, e) {
      for (var a; null != (a = this.$.ui_images) && a.firstChild; ) {
        if (null != (a = this.$.ui_images)) {
          a.removeChild(
            null == (a = this.$.ui_images) ? undefined : a.firstChild
          );
        }
      }
      for (let e = 0; e < t.length; ++e) {
        if (
          e === 0 &&
          ((n = document.createElement("option")).setAttribute("value", ""),
          (n.text = I18n.t("reference-image.none")),
          null != (i = this.$.ui_images))
        ) {
          i.appendChild(n);
        }

        var n;
        var i = document.createElement("option");

        i.setAttribute("value", t[e].path);

        if (null != (n = this.$.ui_images)) {
          n.appendChild(i);
        }

        var s = t[e].path;

        i.text = basename(s, extname(s));

        if (t[e].missing) {
          i.text += I18n.t("reference-image.missing");
        }
      }

      if (null != (x = this.$.ui_images)) {
        x.removeAttribute("placeholder");
      }

      if (t.length === 0) {
        null != (x = this.$.ui_images) &&
          x.setAttribute("style", "display: none");

        null != (x = this.$.ui_images) && x.setAttribute("value", "");

        null != (x = this.$.btnDel) && x.setAttribute("style", "display: none");

        null != (x = this.$.btnAdd) && x.setAttribute("style", "width: 100%");

        null != (x = this.$.btnAddLabel) &&
          x.setAttribute("value", I18n.t("reference-image.none_tips"));

        null != (x = this.$.x) && x.setAttribute("disabled", "");
        null != (x = this.$.y) && x.setAttribute("disabled", "");
        null != (x = this.$.sx) && x.setAttribute("disabled", "");
        null != (x = this.$.sy) && x.setAttribute("disabled", "");
        null != (x = this.$.opacity) && x.setAttribute("disabled", "");
      } else {
        null != (x = this.$.ui_images) && x.removeAttribute("style");
        null != (x = this.$.ui_images) && x.setAttribute("value", e.path);

        null != (x = this.$.btnDel) && x.setAttribute("style", "width: 100px");

        null != (x = this.$.btnAdd) && x.setAttribute("style", "width: 100px");

        null != (x = this.$.btnAddLabel) &&
          x.setAttribute("value", I18n.t("reference-image.add_image"));

        null != (x = this.$.x) && x.removeAttribute("disabled");
        null != (x = this.$.y) && x.removeAttribute("disabled");
        null != (x = this.$.sx) && x.removeAttribute("disabled");
        null != (x = this.$.sy) && x.removeAttribute("disabled");
        null != (x = this.$.opacity) && x.removeAttribute("disabled");
      }

      if (e.missing) {
        if (null != (x = this.$.ui_images)) {
          x.setAttribute("missing", "true");
        }
      } else if (null != (e = this.$.ui_images)) {
        e.removeAttribute("missing");
      }

      var { x, y: e, sx, sy, opacity } = this.getCurrent();
      this.set$(this.$.x, x);
      this.set$(this.$.y, e);
      this.set$(this.$.sx, sx);
      this.set$(this.$.sy, sy);
      this.set$(this.$.opacity, opacity);
    },
    async onAddImage() {
      var e = await Dialog.select({
        title: I18n.t("reference-image.dialog.add-image-title"),
        path: (await Profile.getConfig("reference-image", "root-path")) || "",
        filters: [{ name: "image", extensions: ["png", "jpg"] }],
      });

      if (e && e.filePaths[0]) {
        await Editor.Message.request(
          package_json_1.default.name,
          "add-image",
          e.filePaths
        );

        e = dirname(e.filePaths[0]);
        await Profile.setConfig("reference-image", "root-path", e);
      }
    },
    async onDelImage() {
      var e = this.getCurrent().path;

      if (
        (
          await Dialog.info(
            I18n.t("reference-image.dialog.del_image_message", { path: e }),
            {
              buttons: [
                I18n.t("reference-image.dialog.yes"),
                I18n.t("reference-image.dialog.cancel"),
              ],
              default: 0,
              cancel: 1,
            }
          )
        ).response === 0
      ) {
        await Editor.Message.request(
          package_json_1.default.name,
          "remove-image"
        );
      }
    },
    async onSwitchImages(e) {
      await Editor.Message.request(
        package_json_1.default.name,
        "switch-image",
        e.target.value
      );
    },
    async onOpacityChange(e) {
      await Editor.Message.request(
        package_json_1.default.name,
        "set-image-data",
        "opacity",
        e.target.value
      );
    },
    async onPositionChange(e) {
      if (e.currentTarget === this.$.x) {
        await Editor.Message.request(
          package_json_1.default.name,
          "set-image-data",
          "x",
          e.target.value
        );
      } else {
        await Editor.Message.request(
          package_json_1.default.name,
          "set-image-data",
          "y",
          e.target.value
        );
      }
    },
    async onScaleChange(e) {
      if (e.currentTarget === this.$.sx) {
        await Editor.Message.request(
          package_json_1.default.name,
          "set-image-data",
          "sx",
          e.target.value
        );
      } else {
        await Editor.Message.request(
          package_json_1.default.name,
          "set-image-data",
          "sy",
          e.target.value
        );
      }
    },
    async shortcutsMoveRight() {
      var e = this.getCurrent();
      e.x += shortcutsMoveDistance;

      await Editor.Message.request(
        package_json_1.default.name,
        "set-image-data",
        "x",
        e.x
      );
    },
    async shortcutsMoveLeft() {
      var e = this.getCurrent();
      e.x -= shortcutsMoveDistance;

      await Editor.Message.request(
        package_json_1.default.name,
        "set-image-data",
        "x",
        e.x
      );
    },
    async shortcutsMoveUp() {
      var e = this.getCurrent();
      e.y += shortcutsMoveDistance;

      await Editor.Message.request(
        package_json_1.default.name,
        "set-image-data",
        "y",
        e.y
      );
    },
    async shortcutsMoveDown() {
      var e = this.getCurrent();
      e.y -= shortcutsMoveDistance;

      await Editor.Message.request(
        package_json_1.default.name,
        "set-image-data",
        "y",
        e.y
      );
    },
    registerEventListeners() {
      var e;
      onPositionChangeFunc = this.onPositionChange.bind(this);
      onOpacityChangeFunc = this.onOpacityChange.bind(this);
      onScaleChangeFunc = this.onScaleChange.bind(this);
      onSwitchImagesFunc = this.onSwitchImages.bind(this);
      onAddImageFunc = this.onAddImage.bind(this);
      onDelImageFunc = this.onDelImage.bind(this);

      if (null != (e = this.$.x)) {
        e.addEventListener("change", onPositionChangeFunc);
      }

      if (null != (e = this.$.y)) {
        e.addEventListener("change", onPositionChangeFunc);
      }

      if (null != (e = this.$.sx)) {
        e.addEventListener("change", onScaleChangeFunc);
      }

      if (null != (e = this.$.sy)) {
        e.addEventListener("change", onScaleChangeFunc);
      }

      if (null != (e = this.$.opacity)) {
        e.addEventListener("change", onOpacityChangeFunc);
      }

      if (null != (e = this.$.ui_images)) {
        e.addEventListener("confirm", onSwitchImagesFunc);
      }

      if (null != (e = this.$.btnAdd)) {
        e.addEventListener("click", onAddImageFunc);
      }

      if (null != (e = this.$.btnDel)) {
        e.addEventListener("click", onDelImageFunc);
      }
    },
    unregisterEventListeners() {
      var e;

      if (null != (e = this.$.x)) {
        e.removeEventListener("change", onPositionChangeFunc);
      }

      if (null != (e = this.$.y)) {
        e.removeEventListener("change", onPositionChangeFunc);
      }

      if (null != (e = this.$.sx)) {
        e.removeEventListener("change", onScaleChangeFunc);
      }

      if (null != (e = this.$.sy)) {
        e.removeEventListener("change", onScaleChangeFunc);
      }

      if (null != (e = this.$.opacity)) {
        e.removeEventListener("change", onOpacityChangeFunc);
      }

      if (null != (e = this.$.ui_images)) {
        e.removeEventListener("confirm", onSwitchImagesFunc);
      }

      if (null != (e = this.$.btnAdd)) {
        e.removeEventListener("click", onAddImageFunc);
      }

      if (null != (e = this.$.btnDel)) {
        e.removeEventListener("click", onDelImageFunc);
      }
    },
    async onDataChangeByRefresh(e, t) {
      currentImageData = t;
      await this.renderUI(e.images, t);
    },
  },
  async ready() {
    this.registerEventListeners();
    Editor.Message.send(package_json_1.default.name, "refresh");
  },
  async close() {
    this.unregisterEventListeners();
  },
});
