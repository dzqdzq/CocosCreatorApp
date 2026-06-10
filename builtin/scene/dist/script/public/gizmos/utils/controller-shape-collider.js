var __decorate =
  (this && this.__decorate) ||
  function (e, r, o, t) {
    var l;
    var arguments_length = arguments.length;

    var p =
      arguments_length < 3
        ? r
        : t === null
        ? (t = Object.getOwnPropertyDescriptor(r, o))
        : t;

    if (typeof Reflect == "object" && typeof Reflect.decorate == "function") {
      p = Reflect.decorate(e, r, o, t);
    } else {
      for (var d = e.length - 1; d >= 0; d--) {
        if ((l = e[d])) {
          p =
            (arguments_length < 3
              ? l(p)
              : arguments_length > 3
              ? l(r, o, p)
              : l(r, o)) || p;
        }
      }
    }

    if (arguments_length > 3 && p) {
      Object.defineProperty(r, o, p);
    }

    return p;
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControllerShapeCollider = undefined;
const cc_1 = require("cc");
const { ccclass, property } = cc_1._decorator;
let ControllerShapeCollider = class extends cc_1.Component {
  isDetectMesh = true;
  isRender = true;
  onLoad() {}
};
exports.ControllerShapeCollider = ControllerShapeCollider;

__decorate(
  [property],
  ControllerShapeCollider.prototype,
  "isDetectMesh",
  undefined
);

__decorate(
  [property],
  ControllerShapeCollider.prototype,
  "isRender",
  undefined
);

exports.ControllerShapeCollider = ControllerShapeCollider = __decorate(
  [ccclass("ControllerShapeCollider")],
  ControllerShapeCollider
);
