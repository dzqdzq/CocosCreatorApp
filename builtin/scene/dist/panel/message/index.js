Object.defineProperty(exports, "__esModule", { value: true });
exports.init = init;
exports.apply = apply;

const { init: init_6, apply: apply_6 } = require("./broadcast");

const { init: init_1, apply: apply_1 } = require("./operation");

const { init: init_2, apply: apply_2 } = require("./query");

const { init: init_3, apply: apply_3 } = require("./prefab");

const { init: init_4, apply: apply_4 } = require("./multi-scene");

function init(e) {
  init_6(e);
  init_1(e);
  init_2(e);
  init_3(e);
  init_4(e);
}
function apply() {
  var e = {};

  if (process.type === "renderer") {
    apply_6(e);
  }

  apply_1(e);
  apply_2(e);
  apply_3(e);
  apply_4(e);
  return e;
}
