var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, n = r) => {
        Object.defineProperty(e, n, {
          enumerable: true,
          get() {
            return t[r];
          },
        });
      }
    : (e, t, r, n) => {
        e[(n = n === undefined ? r : n)] = t[r];
      });

var __exportStar =
  (this && this.__exportStar) ||
  ((e, t) => {
    for (var r in e) {
      if (r !== "default" && !Object.prototype.hasOwnProperty.call(t, r)) {
        __createBinding(t, e, r);
      }
    }
  });

Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./dragonbones"), exports);
__exportStar(require("./dragonbones-atlas"), exports);
