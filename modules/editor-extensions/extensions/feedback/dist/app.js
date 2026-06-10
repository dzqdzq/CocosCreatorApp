Object.defineProperty(exports, "__esModule", { value: true });

const { readFileSync } = require("fs-extra");

const { join } = require("path");

const { compressImage, blobToUint8Array } = require("./util-image");

const render_1 = require("@editor/sentry/render");
const Vue = require("vue/dist/vue.js");
Vue.config.productionTip = false;
Vue.config.devtools = false;

exports.default = Vue.extend({
  name: "FeedbackPanel",
  data() {
    return {
      imageList: [],
      maxImageLength: 3,
      uploading: false,
      text: "",
      maxTextLength: 8192,
      isPosting: false,
      isPostSuccess: false,
      needShowTip: false,
    };
  },
  computed: {
    disableSubmit() {
      return this.isPosting || this.text.length < 20;
    },
  },
  methods: {
    onChange(e) {
      this.text = e;
      this.text = this.text.slice(0, this.maxTextLength);
    },
    onConfirm(e) {
      this.text = e;
      this.text = this.text.slice(0, this.maxTextLength);
    },
    async onFileChange(e) {
      const e_target = e.target;
      e = Array.from(e_target.files || []);

      if (!this.uploading) {
        this.uploading = true;
        await this.addImages(e);

        this.$nextTick(() => {
          e_target.value = "";
          this.uploading = false;
        });
      }
    },
    async addImages(e) {
      for (const t of e) {
        if (this.imageList.length === this.maxImageLength) {
          return void console.log("Image limit reached");
        }
        await compressImage(t, 2097152)
          .then((e) => {
            this.imageList.push({ url: URL.createObjectURL(e), file: t });
          })
          .catch(console.error);
      }
    },
    deleteImage(e) {
      var t = this.imageList[e];

      if (t) {
        URL.revokeObjectURL(t.url);
        this.imageList.splice(e, 1);
      }
    },
    async onPaste(e) {
      var t = e.clipboardData?.files;

      if (t?.length) {
        e.preventDefault();

        this.uploading ||
          ((this.uploading = true),
          (e = Array.from(t).filter((e) => e.type.startsWith("image/"))),
          await this.addImages(e),
          (this.uploading = false));
      }
    },
    async submit() {
      this.isPosting = true;
      var e = await Promise.all(
        this.imageList.map(async (e) => {
          var t = await blobToUint8Array(e.file);
          return { filename: e.file.name, data: t };
        })
      );
      let t = { nickname: "", email: "" };
      try {
        t = await Editor.User.getData();
      } catch (e) {
        console.error(e);
      }
      e = render_1.sentry.captureFeedback(
        { name: t?.nickname, email: t?.email, message: this.text },
        { attachments: e }
      );
      this.isPostSuccess = Boolean(e);
      this.showTip();

      this.$nextTick(() => {
        if (this.isPostSuccess) {
          this.clear();
        }
      });

      this.isPosting = false;
    },
    showTip() {
      this.needShowTip = true;

      setTimeout(() => {
        this.needShowTip = false;
      }, 2000 /* 2e3 */);
    },
    clear() {
      this.text = "";

      this.imageList.forEach((e) => {
        URL.revokeObjectURL(e.url);
      });

      this.imageList = [];
    },
  },
  template: readFileSync(join(__dirname, "../static/panel.html"), "utf8"),
});
