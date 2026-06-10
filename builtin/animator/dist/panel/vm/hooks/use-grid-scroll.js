Object.defineProperty(exports, "__esModule", { value: true });
exports.useScrollVm = useScrollVm;
exports.useGridScrollSync = useGridScrollSync;

const { ref } = require("vue/dist/vue.js");

const grid_ctrl_1 = require("../../share/grid-ctrl");

const { syncAxisX } = grid_ctrl_1;

function useScrollVm() {
  const l = ref(1);
  const r = ref(0);
  return {
    scale: l,
    offset: r,
    onChange: (e) => {
      e = e.detail;
      l.value = e.scale;
      r.value = e.offset;
    },
    onConfirm: (e) => {
      e = e.detail;
      l.value = e.scale;
      r.value = e.offset;
    },
    reset: () => {
      l.value = 1;
      r.value = 0;
    },
  };
}
function useGridScrollSync(e) {
  const { curveElement, emitGlobalTransform } = e;

  const a = () => curveElement.value?.curveCtrl;

  const { offset, scale, onChange } = useScrollVm();
  const {
    offset: offset_1,
    scale: scale_1,
    onChange: onChange_1,
  } = useScrollVm();

  const n = () => {
    var e = a();

    if (grid_ctrl_1.gridCtrl.grid && e) {
      syncAxisX(e.grid, grid_ctrl_1.gridCtrl.grid);
    }
  };

  const v = () => {
    var e = a();

    if (e) {
      e = e.getScroll();
      scale.value = e.xScale;
      offset.value = e.xOffset;
      scale_1.value = e.yScale;
      offset_1.value = e.yOffset;
    }
  };

  return {
    xOffset: offset,
    xScale: scale,
    yOffset: offset_1,
    yScale: scale_1,
    onTransform: () => {
      n();
      v();
      emitGlobalTransform();
    },
    onXChange: (e) => {
      onChange(e);
      e = a();

      if (e) {
        e.setScroll({
          xOffset: offset.value,
          xScale: scale.value,
          yOffset: offset_1.value,
          yScale: scale_1.value,
        });

        n();
        emitGlobalTransform();
      }
    },
    onYChange: (e) => {
      onChange_1(e);
      e = a();

      if (e) {
        e.setScroll({
          yOffset: offset_1.value,
          yScale: scale_1.value,
          xScale: scale.value,
          xOffset: offset.value,
        });

        n();
        emitGlobalTransform();
      }
    },
    updateScrollFromCurve: v,
    updateGlobalGrid: n,
  };
}
