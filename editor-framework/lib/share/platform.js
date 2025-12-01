"use strict";
let e = {};
module.exports = e;

e.isNode = !(
    "undefined" == typeof process ||
    !process.versions ||
    !process.versions.node
  );

e.isElectron = !!(e.isNode && "electron" in process.versions);
e.isNative = e.isElectron;
e.isPureWeb = !e.isNode && !e.isNative;

if (e.isElectron) {
  e.isRendererProcess = "undefined" != typeof process && "renderer" === process.type;
} else {
  e.isRendererProcess = "undefined" == typeof __dirname || null === __dirname;
}

e.isMainProcess = "undefined" != typeof process && "browser" === process.type;
if (e.isNode) {
  e.isDarwin = "darwin" === process.platform;
  e.isWin32 = "win32" === process.platform;
} else {
  let s = window.navigator.platform;
  e.isDarwin = "Mac" === s.substring(0, 3);
  e.isWin32 = "Win" === s.substring(0, 3);
}
Object.defineProperty(e, "isRetina", {
  enumerable: true,
  get: () =>
    e.isRendererProcess &&
    window.devicePixelRatio &&
    window.devicePixelRatio > 1,
});
