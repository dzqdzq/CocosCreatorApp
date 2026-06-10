Object.defineProperty(exports, "__esModule", { value: true });
const { defineComponent, computed } = require("vue/dist/vue.js");

const template = `
<div :class="['tab-container', active ? 'active' : '']" @mouseup="mouseupEvent">
  <div class="tab-content">
    <div class="tab-icon">
      <ui-icon :color="active" :value="icon"></ui-icon>
    </div>
    <div class='tab-title'>
      <ui-label :value='pureTitle' :class="{'label-unsave': unsave}"></ui-label>
      <div v-if="unsave" class='unsave-sign'>*</div>
    </div>
    <div class="tab-close">
      <div v-show="closeable" class="tab-close-wrap" @click="closeEvent" @mouseup="event => event.stopPropagation()">
          <ui-icon value="close"></ui-icon>
      </div>
    </div>
  </div>
</div>
`;

exports.default = defineComponent({
  name: "SceneTabItem",
  props: {
    id: { type: [String, Number], required: true },
    title: { type: String, required: true },
    data: { type: Object, required: true },
    icon: { type: String, default: "" },
    active: { type: Boolean, default: false },
    closeable: { type: Boolean, default: true },
  },
  emits: ["close", "select", "contextmenu"],
  setup(a, l) {
    return {
      unsave: computed(() => -1 < a.title.lastIndexOf("*")),
      pureTitle: computed(() => a.title.replace(/\*/g, "")),
      closeEvent: (e) => {
        e.stopPropagation();
        var { id: e, data } = a;
        l.emit("close", e, data);
      },
      mouseupEvent: (e) => {
        e.preventDefault();
        var { id, data } = a;

        if (e.button === 0) {
          l.emit("select", id, data);
        } else if (e.button === 2) {
          l.emit("contextmenu", e, id, data);
        }
      },
    };
  },
  template,
});
