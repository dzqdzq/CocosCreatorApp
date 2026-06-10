Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.ready = ready;
exports.exportConfig = exportConfig;
exports.importConfig = importConfig;
exports.close = close;
const fs_1 = require("fs");

const { join } = require("path");

const Vue = require("vue/dist/vue.js");

Vue.config.productionTip = false;

const vueTemplate = ((Vue.config.devtools = false), fs_1.readFileSync)(
  join(__dirname, "../../static/contributions/project-sorting-layer.html"),
  "utf8"
);

const ProjectSortingLayerVM = Vue.extend({
  name: "ProjectSortingLayerVM",
  data() {
    return { layers: [], increaseId: 0, dragging: false };
  },
  mounted() {
    this.refresh();
  },
  methods: {
    async refresh() {
      var e = await Editor.Profile.getProject("project", "sorting-layer");

      if (e && Array.isArray(e.layers)) {
        this.increaseId = e.increaseId;
        this.layers = e.layers;
      } else {
        e = await Editor.Message.request(
          "scene",
          "query-sorting-layer-builtin"
        );

        this.layers = e;
        this.increaseId = 0;
      }

      this.layers.sort((e, r) => e.value - r.value);

      this.layers.forEach((e) => {
        if (e.id > this.increaseId) {
          this.increaseId = Math.floor(e.id) + 1;
        }
      });
    },
    add() {
      let r = 1;

      this.layers.forEach((e) => {
        var e = e.name.match(/Sorting Layer (\d+)$/);

        if (Array.isArray(e) && ((e = Number(e[1])), r <= e)) {
          r = e + 1;
        }
      });

      this.increaseId++;

      this.layers.push({
        id: this.increaseId,
        name: "Sorting Layer " + r,
        value: this.layers.length,
      });

      this.save();
    },
    remove(e) {
      var r = this.layers[e];

      if (r && r.value !== 0) {
        this.layers.splice(e, 1);
        this.save();
      }
    },
    rename(e, r) {
      e = e.target.value.trim();

      if (e) {
        this.layers[r].name = e;
        this.save();
      }
    },
    async save() {
      let r = this.layers.findIndex((e) => e.value === 0);
      var e;

      if (-1 === r) {
        console.error(
          "Sorting Layers configuration data is lack of Default layer."
        );
      } else {
        r = 0 - r;

        e = this.layers.map((e) => {
          e = { id: e.id, name: e.name, value: r };
          r++;
          return e;
        });

        await Editor.Profile.setProject("project", "sorting-layer", {
          layers: e,
          increaseId: this.increaseId,
        });

        Editor.Message.broadcast("project:setting-change", "sorting-layer");
        this.refresh();
      }
    },
    dragReset() {
      if (this.dragging) {
        this.dragging = false;
      }
    },
    dragStart(e, r) {
      e.stopPropagation();
      this.dragging = true;
      e.dataTransfer.setData("_sorting_layer_drag_data_", r);
    },
    dragOver(e) {
      var r;
      var t;
      var a;
      e.preventDefault();

      if (this.dragging) {
        a = (t = (r = e.currentTarget).getBoundingClientRect()).height / 2;

        e.clientY - t.top <= a
          ? r.setAttribute("drag-over", "top")
          : t.bottom - e.clientY <= a && r.setAttribute("drag-over", "bottom");
      }
    },
    dragLeave(e) {
      e.currentTarget.removeAttribute("drag-over");
    },
    drop(e, r) {
      var t;
      var a;

      if (
        e.dataTransfer &&
        (t = e.dataTransfer.getData("_sorting_layer_drag_data_")) &&
        this.dragging &&
        ((this.dragging = false),
        (t = Number(t)),
        (a = (e = e.currentTarget).getAttribute("drag-over")),
        e.removeAttribute("drag-over"),
        0 != r - t)
      ) {
        a !== "top" && a === "bottom" && (r += 1);
        e = this.layers[t];

        t < r
          ? (this.layers.splice(t, 1), this.layers.splice(r - 1, 0, e))
          : r < t && (this.layers.splice(t, 1), this.layers.splice(r, 0, e));

        this.save();
      }
    },
  },
  template: vueTemplate,
});

function ready() {
  var e = this;
  e.vm?.$destroy();
  e.vm = new ProjectSortingLayerVM();
  e.vm.$mount(e.$.container);
}
async function exportConfig() {
  var e = {};

  e["sorting-layer"] =
    (await Editor.Message.request(
      "project",
      "query-config",
      "project",
      "sorting-layer"
    )) || {};

  return e;
}
async function importConfig(e) {
  if (e["sorting-layer"]) {
    await Editor.Message.request(
      "project",
      "set-config",
      "project",
      "sorting-layer",
      {
        layers: e["sorting-layer"].layers,
        increaseId: e["sorting-layer"].increaseId,
      }
    );
  }
}
function close() {
  this.vm?.$destroy();
  this.vm = null;
}

exports.style = `
.main { 
    height: 100%;
    display: flex;
    flex-direction: column;
}
.main > .header { 
    margin-bottom: 16px;
}
.main > .footer { 
    padding-left: 30px;

}
.main > .footer .add { 
    max-width: 200px; 
    margin-top: 16px;
}
.main > .footer .add > .icon { 
    margin-right: 8px;
}
.main > .list { 
    padding-left: 24px;
    flex:1;
    overflow: auto;
}
.main > .list .per {
    position: relative;
    display: flex;
    padding: 4px 0;
}
.main > .list .per[drag-over]::before {
    content: '';
    position: absolute;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: var(--color-info-fill-weakest);
}
.main > .list .per[drag-over='top']::before {
    top: -1px;
}
.main > .list .per[drag-over='bottom']::before {
    bottom: -1px;
}
.main > .list .per > .drag {
    width: 6px;
    margin: 2px 6px 2px 0;
    cursor: move;
    background: linear-gradient(45deg, var(--color-active-fill-normal) 25%, var(--color-normal-fill) 0, var(--color-normal-fill) 50%, var(--color-active-fill-normal) 0, var(--color-active-fill-normal) 75%, var(--color-normal-fill) 0);
    background-size: 6px 6px;
}
.main > .list .per > .drag:hover {
    background: linear-gradient(45deg, var(--color-info-fill-weakest) 25%, var(--color-normal-fill) 0, var(--color-normal-fill) 50%, var(--color-info-fill-weakest) 0, var(--color-info-fill-weakest) 75%, var(--color-normal-fill) 0);
    background-size: 6px 6px;
}
.main > .list .per > .layer {
    flex: 1;
}
.main > .list .per > .layer > .icon {
    flex: none;
    margin-left: 4px;
}
.main > .list .per > .layer[readonly] .name {
    opacity: 0.55;
}
`;

exports.template = '<div class="container"></div>';
exports.$ = { container: ".container" };
