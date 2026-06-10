Object.defineProperty(exports, "__esModule", { value: true });
exports.init = init;
exports.apply = apply;
let $scene;
let $loading = null;
let panel;
function init(e) {
  panel = e;
  $scene = e.$.scene;
  $loading = e.$.loading;
  panel = e;
}
function showLoading() {
  $loading.removeAttribute("disabled");
}
function hideLoading() {
  document.body.setAttribute("style", "");
  $loading.setAttribute("disabled", "");
}
function apply(e) {
  let c = "";

  e["i18n:change"] = () => {
    panel.updateIcon();
  };

  e["scene:ready"] = () => {
    if (window.__InitializationTimeEnd__) {
      Editor.Metrics.trackTimeEnd("main-window:ready");

      console.debug(
        `main-window:ready: ${(
          (Date.now() - window.__InitializationTimeEnd__) /
          1000
        ) /* 1e3 */
          .toFixed(2)} s`
      );
    }

    hideLoading();
  };

  e["scene:close"] = () => {
    showLoading();
  };

  e["scene:show-loading"] = () => {
    showLoading();
  };

  e["scene:hide-loading"] = () => {
    hideLoading();
  };

  e["asset-db:ready"] = () => {
    if ($scene) {
      $scene.depend.finish("asset-db-ready");
    }

    if ("xxx" in window) {
      window.xxx._refreshScenes();
    }
  };

  e["asset-db:close"] = () => {
    if ($scene) {
      $scene.depend.reset("asset-db-ready");
    }
  };

  e["selection:select"] = async (e, n) => {
    if (e === "node") {
      $scene.callSceneMethod("selectNode", [n]);

      panel.uiToolsVM &&
        ((e = await $scene.callSceneMethod("querySelection")),
        (panel.uiToolsVM.selection = e));

      c = n;
    }
  };

  e["selection:unselect"] = async (e, n) => {
    if (
      e === "node" &&
      ($scene.callSceneMethod("unselectNode", [n]),
      panel.uiToolsVM &&
        ((e = await $scene.callSceneMethod("querySelection")),
        (panel.uiToolsVM.selection = e)),
      c === n)
    ) {
      c = "";
    }
  };

  e["asset-db:asset-add"] = async (e, n, c) => {
    if ($scene?.managerReady) {
      switch (n && n.importer) {
        case "typescript":
        case "javascript": {
          $scene.callSceneMethod("loadScript", [e], true);
          break;
        }
        case "effect": {
          $scene.callSceneMethod("registerEffects", [[e]], true);
        }
        default: {
          $scene.callSceneMethod("assetChange", [e, n, c], true);
        }
      }
    }
  };

  e["asset-db:asset-change"] = async (e, n, c) => {
    if ($scene?.managerReady && n.imported && !n.invalid) {
      $scene.callSceneMethod("releaseAsset", [e], true);

      switch (n && n.importer) {
        case "render-pipeline": {
          break;
        }
        case "typescript":
        case "javascript": {
          $scene.callSceneMethod("scriptChange", [n], true);
          break;
        }
        case "effect": {
          $scene.callSceneMethod("updateEffect", [e], true);
        }
      }

      $scene.callSceneMethod("assetChange", [e, n, c], true);
    }
  };

  e["asset-db:asset-delete"] = (e, n, c) => {
    if ($scene?.managerReady) {
      switch (n && n.importer) {
        case "typescript":
        case "javascript": {
          $scene.callSceneMethod("removeScript", [n], true);
          break;
        }
        case "effect": {
          $scene.callSceneMethod("removeEffects", [[e]], true);
          break;
        }
        case "terrain": {
          $scene.callSceneMethod("onRemoveTerrain", [e, n], true);
        }
      }
      $scene.callSceneMethod("assetDelete", [e, n], true);
    }
  };

  e["programming:pack-build-end"] = (e) => {
    if (
      e === "editor" &&
      $scene &&
      ($scene.depend.finish("packer-driver-ready"), $scene.isSceneManagerReady)
    ) {
      $scene.callSceneMethod("investigatePackerDriver");
    }
  };

  e["project:change-design-resolution"] = (e) => {
    $scene.ipc.send("call-method", {
      module: "Startup",
      handler: "changeDesignResolution",
      params: [e.width, e.height],
      queue: true,
      timeout: false,
    });
  };

  e["project:change-custom-layer"] = (e) => {
    $scene.ipc.send("call-method", {
      module: "Startup",
      handler: "initCustomLayer",
      params: [e],
      queue: true,
      timeout: false,
    });
  };

  e["project:change-sorting-layer"] = (e) => {
    $scene.ipc.send("call-method", {
      module: "Startup",
      handler: "initSortingLayer",
      params: [e],
      queue: true,
      timeout: false,
    });
  };

  e["shortcuts:change"] = (e) => {
    if (e === "scene") {
      $scene.ipc.send("call-method", {
        module: "Shortcut",
        handler: "onShortcutsChange",
        params: [e],
        queue: true,
        timeout: false,
      });
    }
  };

  e["project:update-physics-group"] = () => {
    $scene.callSceneMethod("updatePhysicsGroup", [], true);
  };

  e["project:change-high-quality"] = (e) => {
    $scene.callSceneMethod("changeHighQuality", [e], true);
  };

  e["engine:engine-modules-global-config-changed"] = (e) => {
    $scene.callSceneMethod(
      "changeProjectMode",
      [e.includes("3d") ? "3d" : "2d"],
      true
    );
  };

  e["window:zoom-level-change"] = () => {
    $scene.$scene.updateZoomFactor();
  };

  e["window:focus-zoom-level-change"] = () => {
    $scene.$scene.updateZoomFactor();
  };
}
