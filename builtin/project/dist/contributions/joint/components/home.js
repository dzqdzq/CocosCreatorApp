Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectJointHomeVM = undefined;
const fs_1 = require("fs");

const { join } = require("path");

const Vue = require("vue/dist/vue.js");

Vue.config.productionTip = false;

const template = ((Vue.config.devtools = false), fs_1.readFileSync)(
  join(__dirname, "../../../../static/contributions/joint/index.html"),
  "utf8"
);

exports.ProjectJointHomeVM = Vue.extend({
  name: "ProjectJointHomeVM",
  components: { layout: require("./layout") },
  data() {
    return {
      joint: null,
      layouts: [],
      timeId: null,
      info: "Valid on all devices",
      blocks: [],
      renameIndex: -1,
      animation: 0,
      size: 0,
      pixels: 0,
      doc: Editor.Utils.Url.getDocUrl("animation/joint-texture-layout.html"),
    };
  },
  watch: {
    layouts: {
      deep: true,
      handler() {
        this.save();
      },
    },
    blocks() {
      const t = this;
      t.animation = 0;
      t.size = 0;
      t.pixels = 0;

      t.blocks.forEach((e) => {
        t.pixels += e.pixels;
      });

      t.size = 12 * Math.ceil(Math.sqrt(t.pixels) / 12);
    },
    size(e) {
      var t = this;

      if (t.joint) {
        t.joint.textureLength = e;

        t.info =
          e < 1024
            ? "Valid on all devices"
            : e < 2048
            ? "May exceeds max texture size limit on devices with no float texture support"
            : "May exceeds max texture size limit on many mobile devices";
      }
    },
  },
  async mounted() {
    var e = this;

    e.layouts =
      (await Editor.Profile.getProject(
        "project",
        "custom_joint_texture_layouts"
      )) || [];

    e.joint = e.layouts[0];
  },
  methods: {
    getName(e) {
      return this.layouts[e].name || "Texture - " + e;
    },
    async removeLayout(t) {
      var o = this;
      var i = o.layouts[t];
      if (i) {
        let e = Editor.I18n.t("project.joint.removeTextureWarn");
        e = e.replace("${name}", o.getName(t));

        if (
          (
            await Editor.Dialog.warn(e, {
              buttons: [
                Editor.I18n.t("project.confirm"),
                Editor.I18n.t("project.cancel"),
              ],
              default: 0,
              cancel: 1,
              title: Editor.I18n.t("project.remove"),
            })
          ).response !== 1
        ) {
          i === o.joint && (o.joint = null);
          o.layouts.splice(t, 1);
        }
      }
    },
    renameStart(t) {
      const o = this;

      if (o.renameIndex !== t) {
        o.renameIndex = t;

        o.$nextTick(() => {
          var e = o.$refs.renameInput;

          if (e && (e = e[t])) {
            e.value = o.getName(t);
            e.focus();
          }
        });
      }
    },
    renameConfirm(e) {
      var t = this;
      var e = e.target.value;
      var o = t.layouts[t.renameIndex];
      t.renameIndex = -1;

      if (e && o.name !== e) {
        o.name = e;
      }
    },
    removeContent(e) {
      if (this.joint) {
        this.joint.contents.splice(e, 1);
      }
    },
    addLayout() {
      var e = "Texture - " + this.layouts.length;
      this.layouts.push({ name: e, textureLength: 0, contents: [] });
    },
    addContent() {
      if (this.joint) {
        this.joint.contents.push({ skeleton: "", clips: [] });
      }
    },
    save() {
      const e = this;

      if (e.timeId === null) {
        e.timeId = setTimeout(() => {
          e.timeId = null;

          Editor.Profile.setProject(
            "project",
            "custom_joint_texture_layouts",
            JSON.parse(JSON.stringify(e.layouts))
          );
        }, 400);
      }
    },
  },
  template,
});
