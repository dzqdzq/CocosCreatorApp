Object.defineProperty(exports, "__esModule", { value: true });

const {
  operation,
  addBroadcastListener,
  query,
  removeBroadcastListener,
} = require("../shared/scene-message");

let isReadyUpdate = false;
const panelDataMap = new WeakMap();
module.exports = Editor.Panel.define({
  ready() {
    isReadyUpdate = true;
    const t = this.$.bake;
    this.$.bake.addEventListener("confirm", () => {
      var e = panelDataMap.get(this).dump;
      var e = e.value.uuid.values ?? [e.value.uuid.value];
      operation("start-bake", e);

      Editor.Metrics._trackEventWithTimer({
        category: "bakingSystem",
        id: "A100014",
        value: 1,
      });
    });
    var e = (e) => {
      var a = panelDataMap.get(this).dump;

      if (
        (a.value.uuid.values ?? [a.value.uuid.value]).some(
          (a) =>
            e.currentInfo?.uuid === a || e.remaining.some((e) => e.uuid === a)
        ) ||
        a.value.enabled.value === false
      ) {
        t.setAttribute("disabled", "disabled");
      } else {
        t.removeAttribute("disabled");
      }
    };
    panelDataMap.set(this, { onUpdateInfo: e });

    addBroadcastListener("reflection-probe:update-bake-info", e);
  },
  update(e) {
    if (e) {
      const s = panelDataMap.get(this);
      s.dump = e;
      var a = this.$.bake;
      var t = e.value.probeType.values ?? [e.value.probeType.value];
      const i = e.value.probeType.enumList.findIndex((e) => e.name === "CUBE");

      a.hidden = t.some((e) => e !== i);

      if (isReadyUpdate) {
        if (a.hidden) {
          Editor.Metrics._trackEventWithTimer({
            category: "bakingSystem",
            id: "A100015",
            value: 1,
          });
        }
      } else {
        isReadyUpdate = true;
      }

      query("query-bake-info").then((e) => {
        if (e) {
          s?.onUpdateInfo(e);
        }
      });
    }
  },
  $: { bake: ".bake" },
  style: `
        .reflection-probe-footer {
            display: flex;
            flex-wrap: wrap;
            margin-top: 6px;
        }

        ui-button[hidden] {
            display: none;
        }

        .bake {
            flex: 1;
        }
    `,
  template: `
        <div class="reflection-probe-footer">
            <ui-button class="bake blue">Bake</ui-button>
        </div>
    `,
  close() {
    var e = panelDataMap.get(this);
    removeBroadcastListener(
      "reflection-probe:update-bake-info",
      e.onUpdateInfo
    );
  },
});
