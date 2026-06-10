Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = undefined;
exports.style = undefined;
exports.update = update;
exports.ready = ready;
const lodash = require("lodash");
let panel;
async function update(e, t) {
  panel = this;

  if (!t || t.startsWith("packages." + panel.pkgName)) {
    panel.options = e;
    panel.vm.init();
  }
}
function ready(e, t, a, p) {
  panel = this;
  var BuildPanel_Vue = BuildPanel.Vue;
  panel.options = e;
  panel.pkgName = a;
  panel.errorMap = p;

  panel.vm = new BuildPanel_Vue({
    el: panel.$.root,
    data() {
      return { pkgName: a, pkgOptions: {}, verifyRes: {} };
    },
    mounted() {
      this.init();
    },
  });
}

exports.style = `
.new-certificate { margin-left: 4px; }
`;

exports.$ = { root: ".migu-mini-game" };
