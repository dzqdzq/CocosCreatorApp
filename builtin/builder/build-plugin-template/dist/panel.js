var __awaiter =
  (this && this.__awaiter) ||
  ((e, a, p, u) =>
    new (p = p || Promise)((n, i) => {
      function t(e) {
        try {
          l(u.next(e));
        } catch (e) {
          i(e);
        }
      }
      function o(e) {
        try {
          l(u.throw(e));
        } catch (e) {
          i(e);
        }
      }
      function l(e) {
        var i;

        if (e.done) {
          n(e.value);
        } else {
          ((i = e.value) instanceof p
            ? i
            : new p((e) => {
                e(i);
              })
          ).then(t, o);
        }
      }
      l((u = u.apply(e, a || [])).next());
    }));
Object.defineProperty(exports, "__esModule", { value: true });

exports.close = undefined;
exports.ready = undefined;
exports.update = undefined;
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;

const global_1 = require("./global");
let panel;
async function update(e, i) {
  if (!i) {
    init();
  }
}
function ready(e) {
  panel = this;
  panel.options = e;
  init();
}
function close() {
  panel.$.hideLink.removeEventListener("change", onHideLinkChange);
}
function init() {
  panel.$.hideLink.value = panel.options.hideLink;
  updateLink();
  panel.$.hideLink.addEventListener("change", onHideLinkChange);
}
function onHideLinkChange(e) {
  panel.options.hideLink = e.target.value;

  panel.dispatch(
    "update",
    `packages.${global_1.PACKAGE_NAME}.hideLink`,
    panel.options.hideLink
  );

  updateLink();
}
function updateLink() {
  if (panel.options.hideLink) {
    panel.$.link.style.display = "none";
  } else {
    panel.$.link.style.display = "block";
  }
}
exports.style = "";

exports.template = `
<div class="build-plugin">
    <ui-prop>
        <ui-label slot="label" value="Hide Link"></ui-label>
        <ui-checkbox slot="content"></ui-checkbox>
    </ui-prop>
    <ui-prop id="link">
        <ui-label slot="label" value="Docs"></ui-label>
        <ui-link slot="content" value=${Editor.Utils.Url.getDocUrl(
          "editor/publish/custom-build-plugin.html"
        )}></ui-link>
    </ui-prop>
</div>
`;

exports.$ = {
  root: ".build-plugin",
  hideLink: "ui-checkbox",
  link: "#link",
};

exports.update = update;
exports.ready = ready;
exports.close = close;
