Object.defineProperty(exports, "__esModule", { value: true });
exports.beforePreStart = beforePreStart;
exports.afterPreStart = afterPreStart;
exports.afterRefresh = afterRefresh;
exports.afterStartDB = afterStartDB;
exports.afterStopDB = afterStopDB;
exports.effectDataProcessing = effectDataProcessing;
const effect_1 = require("../handler/assets/effect");

const { afterImport } = effect_1;

function beforePreStart(t) {
  Object.values(t).forEach((t) => {
    t.preImportExtList = t.preImportExtList || [];
    t.preImportExtList.push(".chunk", ".effect");
  });
}
async function afterPreStart() {
  await effectDataProcessing();
  effect_1.autoGenEffectBinInfo.autoGenEffectBin = true;
}
async function afterRefresh() {
  await effectDataProcessing();
}
async function afterStartDB(t) {
  await effectDataProcessing(true);
}
async function afterStopDB(t) {
  await effectDataProcessing(true);
}
async function effectDataProcessing(t) {
  Editor.Metrics.trackTimeStart("asset-db:worker-effect-data-processing");
  try {
    await afterImport(t);
  } catch (t) {
    console.error(t);
  }
  Editor.Metrics.trackTimeEnd("asset-db:worker-effect-data-processing", {
    output: true,
  });
}
