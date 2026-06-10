Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.ready = ready;
exports.close = close;

const { readFileSync } = require("fs");

const { join } = require("path");

const Vue = require("vue/dist/vue.js");
let vm = null;
function ready() {
  vm = new Vue({ el: this.$.assetDB });
}
function close() {
  if (vm) {
    vm.$destroy();
    vm = null;
  }
}

exports.style = readFileSync(join(__dirname, "./../../dist/preferences.css"));

exports.template = `
<div class="assetDB">
    <div class="default-meta">
        <ui-icon value="setting" type='local' class="setting"></ui-icon>
        <ui-label value="i18n:asset-db.preferences.defaultMeta"></ui-label>
        <ui-icon value="help" tooltip="i18n:asset-db.preferences.defaultMetaTip"></ui-icon>
    </div>
</div>
`;

exports.$ = { assetDB: ".assetDB" };
