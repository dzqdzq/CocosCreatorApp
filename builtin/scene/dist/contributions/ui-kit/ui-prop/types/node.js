Object.defineProperty(exports, "__esModule", { value: true });

const { setElementReadonly } = require("../utils");

const dum_element_base_1 = require("../dum-element-base");
class Node extends dum_element_base_1.DumpElementBase {
  type = ["cc.Node"];
  $node = null;
  _listeners = ["change"];
  parseAndSetData(t, e) {
    e.value.uuid = t.uuid;

    if (Reflect.has(e, "values")) {
      e.values.forEach((e) => {
        e.uuid = t;
      });
    }

    return true;
  }
  change(e, t) {
    if (e.target && undefined !== (e = e.target.value)) {
      this.parseAndSetData({ uuid: e }, t);
    }
  }
  template = `
        <ui-label slot="label"></ui-label>
        <ui-node slot="content"></ui-node>
    `;
  style = "";
  mounted(e) {
    this.$node = e.querySelector("ui-node");
  }
  ready() {
    super.ready();
  }
  update(e) {
    super.update(e);

    if (this.$parentElement && this.$node) {
      var t = this.$parentElement.getAttribute("array-type") || e.type || "";

      if (t) {
        this.$node.setAttribute("droppable", t);
      }

      const e_value = e.value;
      this.$node.value = e_value.uuid;

      if (e.values && e.values.some((e) => e.uuid !== e_value.uuid)) {
        this.$node.invalid = true;
      } else {
        this.$node.invalid = false;
      }

      setElementReadonly(e, this.$node);
    }
  }
}
exports.default = Node;
