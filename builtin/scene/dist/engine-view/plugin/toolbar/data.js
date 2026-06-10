Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultGameViewData = undefined;
const getDefaultGameViewData = () => ({
  devicesInfo: {
    name: "i18n:scene.game_view.design_resolution",
    width: 0,
    height: 0,
    type: "design",
  },

  scaleValue: 100,
  sliderValue: 50,
  scaleMin: 10,
  scaleMax: 400,
  rotate: false,
  fullScreen: false,
  fps: 60,
  stats: false,
});
exports.getDefaultGameViewData = getDefaultGameViewData;
