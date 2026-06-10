Object.defineProperty(exports, "__esModule", { value: true });

const { preload } = require("../main");

preload({ isSceneNative: false, isPreviewProcess: true });

window.addEventListener(
  "unhandledrejection",
  (e) => {
    console.error(e);

    if (e && e.reason) {
      console.error(e.reason);
    }
  },
  true
);
