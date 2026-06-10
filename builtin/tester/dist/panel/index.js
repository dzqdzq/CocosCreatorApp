const Vue = require("vue/dist/vue.js");

const tester = ((Vue.config.productionTip = false),
(Vue.config.devtools = false),
require("./../tester")).tester;

const join = require("path").join;
const readFileSync = require("fs").readFileSync;
module.exports = {
  template: readFileSync(join(__dirname, "../../static/index.html"), "utf8"),
  style: readFileSync(join(__dirname, "../../static/index.css"), "utf8"),
  $: { tester: ".tester" },
  listeners: {},
  methods: {
    "*"(e, ...t) {
      tester.Ipc._receive(e, ...t);
    },
  },
  ready() {
    var e = require("./components/home");
    this.vm?.$destroy();

    this.vm = new Vue({
      el: this.$.tester,
      data: e.data(),
      watch: e.watch,
      mounted: e.mounted,
      methods: e.methods,
    });
  },
  close() {
    this.vm?.$destroy();
    delete this.vm;
  },
};
