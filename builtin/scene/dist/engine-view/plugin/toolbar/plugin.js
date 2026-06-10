Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolbarPlugin = undefined;
const Vue = require("vue/dist/vue.js");
exports.ToolbarPlugin = Vue.extend({
  name: "ToolbarPlugin",
  props: { option: { type: Object, required: true } },
  mounted() {
    const e = { $: {} };
    this.option.__vm__ = e;

    if (this.option.$) {
      Object.keys(this.option.$).forEach((t) => {
        var o = this.option.$[t];
        e.$[t] = this.$el.querySelector(o);
      });
    }

    if (this.option.methods) {
      Object.keys(this.option.methods).forEach((t) => {
        e[t] = this.option.methods[t];
      });
    }

    if (this.option.ready) {
      this.option.ready.call(e, this.$root.$el);
    }
  },
  template: '<div v-html="option.template"></div>',
});
