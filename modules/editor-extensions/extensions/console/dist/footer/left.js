Object.defineProperty(exports, "__esModule", { value: true });

const { readFileSync } = require("fs-extra");

const { join } = require("path");

const { transformText } = require("../utils/index");

module.exports = Editor.Panel.define({
  template: `<div class="console-footer-left">
                <div class="console-error"></div>
             </div>`,
  style: readFileSync(join(__dirname, "../../dist/left.css"), "utf8"),
  $: { message: ".console-error" },
  methods: {
    record(e) {
      if (e.type === "error" && this.$.message) {
        this.$.message.innerHTML = transformText(e.message);

        this.$.message.setAttribute("title", transformText(e.message));
      }
    },
    clear() {
      if (this.$.message) {
        this.$.message.innerHTML = "";
      }

      this.$.message?.setAttribute("title", "");
    },
  },
  async ready() {
    this.record = this.record.bind(this);
    this.clear = this.clear.bind(this);
    Editor.Logger.__protected__.on("record", this.record);
    Editor.Logger.__protected__.on("clear", this.clear);
  },
  async close() {
    Editor.Logger.__protected__.removeListener("record", this.record);
    Editor.Logger.__protected__.removeListener("clear", this.clear);
  },
});
