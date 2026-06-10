const { join, extname, basename } = require("path");
module.paths.push(join(Editor.App.path, "node_modules"));
const i18nHandler = require("@base/electron-i18n");

const {
  existsSync,
  outputFileSync,
  readJsonSync,
  readFileSync,
  removeSync,
} = require("fs-extra");

const parse = require("url").parse;
const Profile = require("@base/electron-profile");
const profile = Profile.load("global://editor/ui-kit.json");

const {
  registerTranslator,
  updateTranslate,
  register,
} = require("@editor/creator-ui-kit/dist/renderer");

const AssetImage = require("./../../dist/contributions/asset-image").AssetImage;

const previewImageManager =
  require("./../../dist/contributions/preview-image-manager").previewImageManager;

function updateNumInputConfig() {
  if (typeof Editor.UI.NumInput.changeConfig == "function") {
    Editor.UI.NumInput.changeConfig({
      step: profile.get("num-input.step") ?? 0.1,
      wheelEnable: profile.get("num-input.wheel_enable") ?? true,
    });
  } else {
    console.warn(
      "Editor.UI.NumInput.changeConfig is not defined, need to update creator-ui-kit"
    );
  }
}
function attach(e, i) {
  i = require(i);
  Editor.UI.register("ui-" + e, i.element);
}

exports.load = async () => {
  registerTranslator(Editor.I18n.t);
  updateTranslate();

  i18nHandler.on("switch", () => {
    updateTranslate();
  });

  var e = Editor.Package.getPackages({ enable: true });
  const s = [];
  function i(e) {
    if (e.info.contributions && e.info.contributions["ui-kit"]) {
      if (e.info.contributions["ui-kit"].element) {
        for (const a in e.info.contributions["ui-kit"].element) {
          var i;
          var t;

          if (e.info.contributions["ui-kit"].element[a]) {
            i = join(e.path, e.info.contributions["ui-kit"].element[a]);
            (i = require(i)).load && i.load();
            t = "ui-" + a;
            s.includes(t) || (Editor.UI.register(t, i.element), s.push(t));
          }
        }
      }
      if (e.info.contributions["ui-kit"]["ui-prop"]) {
        var r = e.info.contributions["ui-kit"]["ui-prop"];
        for (const o in r.render) {
          if (r.render[o]) {
            try {
              var n = require(join(e.path, r.render[o]));
              Editor.UI.Prop.registerRender(o, n);
            } catch (e) {
              console.error(e);
            }
          }
        }
      }
    }
  }
  e.forEach(i);
  Editor.Package.on("enable", i);
  updateNumInputConfig();

  Editor.UI.Link.setLinkHandle(async (i, e) => {
    if (!e) {
      return false;
    }
    i = i.trim();

    switch (e) {
      case "assetUrl": {
        i = await Editor.Message.request("asset-db", "query-uuid", i);

        if (Editor.Utils.UUID.isUUID(i)) {
          Editor.Message.send("assets", "twinkle", i);
        }

        return true;
      }
      case "assetUuid": {
        if (Editor.Utils.UUID.isUUID(i)) {
          Editor.Message.send("assets", "twinkle", i);
        }

        return true;
      }
      case "nodeUuid": {
        if (Editor.Utils.UUID.isUUID(i)) {
          Editor.Message.send("hierarchy", "twinkle", i);
        }

        return true;
      }
      case "message": {
        try {
          var t;
          var r = JSON.parse(i);

          if (!r || r.length < 3 || !["send", "broadcast"].includes(r[0])) {
            console.warn("Invalid link value: " + i);
          } else {
            t = r.shift();
            Editor.Message[t](...r);
          }
        } catch (e) {
          console.warn(e);
          console.warn("Invalid link value: " + i);
        }
      }
    }
  });

  Editor.UI.Curve.registerOpenHandle(async (e) => {
    const i = e?.target;
    Editor.Panel.__protected__.openKit("ui-kit.curve-editor", {
      elem: i,
      params: [
        {
          value: i.value || {
            keys: [],
            keyFrames: [],
            multiplier: 1,
            postWrapMode: 1,
            preWrapMode: 1,
          },
          config: i.config,
          label: i.getAttribute("label"),
        },
      ],
      listeners: {
        confirm: (e) => {
          if (e) {
            i.value = e.value;
            i.dispatch("confirm", e.value);
          }
        },
        change: (e) => {
          if (e) {
            i.value = e.value;
            i.dispatch("change", e.value);
          }
        },
        cancel: (e) => {
          if (e) {
            i.value = e.value;
            i.dispatch("cancel", e.value);
          }
        },
      },
    });
  });

  Editor.UI.CurveEditor.registerClipboardHandle(Editor.Clipboard);

  Editor.UI.Color.registerPanelHandle(async function (e) {
    const i = this;
    Editor.Panel.__protected__.openKit("ui-kit.color-picker", {
      elem: i,
      params: [{ value: i.value ?? "[0,0,0,1]" }],
      listeners: {
        confirm: (e) => {
          if (e) {
            i.value = e.value;
            i.dispatch("confirm", e.value);
          }
        },
        change: (e) => {
          if (e) {
            i.value = e.value;
            i.dispatch("change", e.value);
          }
        },
        cancel: (e) => {
          if (e) {
            i.value = e.value;
            i.dispatch("cancel", e.value);
          }
        },
      },
    });
  });

  Editor.UI.ColorPicker.registerSetColorStorageHandle((e = []) => {
    profile.set("color-picker.staging-colors", e);
    profile.save();
  });

  Editor.UI.ColorPicker.registerGetColorStorageHandle(
    () => profile.get("color-picker.staging-colors") ?? []
  );

  Editor.UI.Gradient.registerPanelHandle(async (e) => {
    const i = e?.target;
    Editor.Panel.__protected__.openKit("ui-kit.gradient-picker", {
      elem: i,
      params: [{ value: i.value }],
      listeners: {
        confirm: (e) => {
          if (e) {
            i.value = e.value;
            i.dispatch("confirm", e.value);
          }
        },
        change: (e) => {
          if (e) {
            i.value = e.value;
            i.dispatch("change", e.value);
          }
        },
        cancel: (e) => {
          if (e) {
            i.value = e.value;
            i.dispatch("cancel", e.value);
          }
        },
      },
    });
  });

  Editor.UI.Setting.setProfile(Editor.Profile);

  Profile.on("change", (e, i, t, r) => {
    if (
      e === "global" &&
      i === "editor/ui-kit.json" &&
      (t === "num-input.step" || t === "num-input.wheel_enable")
    ) {
      updateNumInputConfig();
    }
  });

  Editor.UI.register("ui-asset-image", AssetImage);
  await (Editor.UI.AssetImage = AssetImage).init();

  Editor.UI.Image.setSrcTranslator(async (e) => {
    var i;
    return e && (e.startsWith("db://") || Editor.Utils.UUID.isUUID(e))
      ? (i = await previewImageManager.get(e, "origin")).type === "image"
        ? i.value + ("?" + i.timestamp)
        : ""
      : e;
  });

  Editor.UI.Image.prototype._onConnectedCallback = function () {
    this.__onClick__ = () => {
      Editor.Message.send("assets", "twinkle", this.value.trim());
    };

    this.addEventListener("click", this.__onClick__);
  };

  Editor.UI.Image.prototype._onDisconnectedCallback = function () {
    this.removeEventListener("click", this.__onClick__);
  };
};

exports.unload = () => {
  Editor.UI.AssetImage.previewImageManager.destroyed();
};
