Object.defineProperty(exports, "__esModule", { value: true });
const dum_element_base_1 = require("../dum-element-base");
class Unknown extends dum_element_base_1.DumpElementBase {
  type = ["Unknown"];
  $button = null;
  _listeners = [];
  template = `
        <ui-label slot="label"></ui-label>
        <div slot="content" style="display: flex;">
            <span>Unknown Type</span>
            <ui-button class="blue" style="flex: 1;margin-left: 10px;">Reset</ui-button>
        </div>
    `;
  style = "";
  mounted(e) {
    this.$button = e.querySelector("ui-button");
  }
  ready() {
    super.ready();

    if (this.$button) {
      this.$button.addEventListener("change", (e) => e.stopPropagation());

      this.$button.addEventListener("confirm", (e) => {
        e.stopPropagation();

        if (this.$parentElement) {
          this.$parentElement.dispatch("reset");
        }
      });
    }
  }
  update(e) {
    super.update(e);

    if (this.$parentElement) {
      this.$parentElement.removeAttribute("no-label");
    }
  }
}
exports.default = Unknown;
