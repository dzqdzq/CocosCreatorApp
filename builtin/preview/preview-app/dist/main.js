System.register([], (e, s) => {
  if (s) {
    s.id;
  }

  function o(n) {
    return new Promise((e, s) => {
      const t = new XMLHttpRequest();
      t.responseType = "text";

      t.addEventListener("load", () => {
        if (t.status === 200) {
          e(JSON.parse(t.response));
        }
      });

      t.open("GET", n, true);
      t.send();
    });
  }

  e("main", async (t, e) => {
    const a = await System.import("cc");
    var s = {
      debugMode: a.DebugMode[t.debugMode] ?? a.DebugMode.INFO,
      overrideSettings: {},
    };
    let n = e.settings.launch.launchScene;
    Object.assign(s.overrideSettings, e.settings);
    s.overrideSettings.profiling = s.overrideSettings.profiling || {};
    s.overrideSettings.profiling.showFPS = t.showFps;
    s.overrideSettings.screen = s.overrideSettings.screen || {};
    s.overrideSettings.screen.frameRate = t.frameRate;
    s.overrideSettings.screen.exactFitScreen = !!t.isFullscreen();
    s.overrideSettings.assets = s.overrideSettings.assets || {};
    s.overrideSettings.assets.importBase = "assets/general/import";
    s.overrideSettings.assets.nativeBase = "assets/general/native";
    s.overrideSettings.assets.remoteBundles = [];
    s.overrideSettings.assets.subpackages = [];
    s.overrideSettings.launch = s.overrideSettings.launch || {};
    s.overrideSettings.launch.launchScene = "";
    await a.game.init(s);

    a.assetManager.onAssetMissing(async (e, s, t, n) => {
      let r = `The asset ${n} used by ${e.name}{${a.js.getClassName(e)}(${
        e.uuid
      })} is missing! 
`;
      try {
        var i = await o("/missing-asset/" + n);

        if (i) {
          r = `The asset ${i.path} used by ${e.name}{${a.js.getClassName(e)}(${
            e.uuid
          })} is missing! 
  `;
        }

        i.path;

        if (i) {
          r += `asset ${i.path}(${n}) has been deleted at ${new Date(
            i.removeTime
          ).toLocaleString()}. 
  `;
        }
      } catch (e) {
        console.debug(`query missing asset ${n} failed`);
      }

      if (s && s.node instanceof a.Node) {
        r += `Node path: ${s.node.getPathInHierarchy()}
  `;
      }

      if (t) {
        r += "PropName: " + t;
      }

      console.error(r);
    });

    await a.game.run(async () => {
      a.director.once(a.Director.EVENT_AFTER_SCENE_LAUNCH, () => {
        var e;
        var s;
        t.hideSplash();
        e = a;

        if (
          (s = e.director.getScene()) &&
          s.children.length !== 0 &&
          (s.children.length > 1 ||
            (s = s.children[0]).children.length > 0 ||
            s._components.length > 1 ||
            (s._components.length > 0 &&
              !(s._components[0] instanceof e.Canvas)))
            ? undefined
            : 1
        ) {
          t.hintEmptyScene();
        }
      });

      t.showLoading();
      a.game.pause();
      var e = await o(`scene/${n}.json`);
      try {
        n = e[1]._id;
      } catch (e) {
        console.debug(e);
      }
      a.assetManager.loadWithJson(
        e,
        { assetId: n },
        (e, s) => {
          t.reportLoadProgress(((100 * e) / s) * 0.6);
        },
        (e, s) => {
          if (e) {
            t.showError(e);
            a.error(e);
          } else {
            e = s.scene;
            e._name = s._name;

            a.director.runSceneImmediate(e, () => {
              a.game.resume();
            });
          }
        }
      );
    });

    await new Promise((e) => {
      setTimeout(e, 100);
    });
  });

  return { setters: [], execute() {} };
});
