var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });

const { setElementReadonly } = require("../utils");

const object_class_1 = __importDefault(require("./object-class"));
class ObjectOptionalTypes extends object_class_1.default {
  type = ["objectOptionalTypes"];
  $select = null;
  _listeners = ["change"];
  change(e, t) {
    if (e.target) {
      const l = e.target.value;
      t.type = l;

      if (t.values) {
        t.values.forEach((e) => {
          e.type = l;
        });
      }
    }
  }
  template = `
        <ui-section no-border expand>
            <div slot="header" class="prop-name">
                <ui-label style="flex: 1;"></ui-label>
                <ui-link style="display: none;" tooltip="i18n:scene.menu.help_url">
                    <ui-icon value="help"><ui-icon>
                </ui-link>
            </div>
            <ui-select slot="header" class="prop-content"></ui-select>
        </ui-section>`;
  style = ":host { margin-left: 0; }";
  mounted(e) {
    super.mounted(e);
    this.$label = e.querySelector("ui-label");
    this.$select = e.querySelector("ui-select");
  }
  ready() {
    super.ready();
  }
  update(s) {
    super.update(s);

    if (this.$select) {
      let t = false;
      let l = "";

      if (Array.isArray(s.optionalTypes)) {
        s.optionalTypes.forEach((e) => {
          if (e === s.type) {
            t = true;
          }

          l += `<option value="${e}">${e}</option>`;
        });
      }

      this.$select.innerHTML = l;
      this.$select.value = s.type || "";
      setElementReadonly(s, this.$select);

      if (!t) {
        Object.keys(s.value).forEach((e, t) => {
          e = s.value[e];

          if (e.visible) {
            e.readonly = true;
          }
        });
      }
    }
  }
  close() {
    super.close();
  }
}
exports.default = ObjectOptionalTypes;
