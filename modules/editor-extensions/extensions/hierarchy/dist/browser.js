Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
const Profile = require("@base/electron-profile");
const sceneState = {};
const messageProtocol = { scene: "scene" };
async function queryMessageProtocolScene() {
  try {
    var e = await Editor.Profile.getConfig("hierarchy", "message-protocol");

    if (e) {
      Object.assign(messageProtocol, e);
    }
  } catch (e) {
    console.error(e);
    messageProtocol.scene = "scene";
  }
}

Profile.on("change", (e, r, t) => {
  if (
    e === "defaultPreferences" &&
    r === "packages/hierarchy.json" &&
    t === "message-protocol"
  ) {
    queryMessageProtocolScene();
  }
});

exports.methods = {
  open() {
    Editor.Panel.open("hierarchy");
  },
  async staging(e) {
    if (
      e &&
      e.assetUuid &&
      (sceneState[e.assetUuid] = e).expandLevels &&
      e.expandLevels.length
    ) {
      Editor.Profile.setTemp("hierarchy", e.assetUuid, e);
    }
  },
  async unstaging() {
    var e = await Editor.Message.request(
      messageProtocol.scene,
      "query-current-scene"
    );
    let r = sceneState[e];

    r = (r = !r && e ? await Editor.Profile.getTemp("hierarchy", e) : r) || {
      assetUuid: "",
      animationUuid: "",
      expandLevels: ["0"],
    };

    if (!Array.isArray(r.expandLevels)) {
      r.expandLevels = ["0"];
    }

    if (e) {
      r.assetUuid = e;
    }

    return r;
  },
  async "link-prefab"() {
    var e;
    var r = Editor.Selection.getLastSelected("node");
    var t = Editor.Selection.getLastSelected("asset");
    let a = "";

    if (r) {
      if (
        (await Editor.Message.request(messageProtocol.scene, "query-node", r))
          .isScene
      ) {
        a = Editor.I18n.t("hierarchy.menu.link_prefab_error_node_isScene");
      }
    } else {
      a = Editor.I18n.t("hierarchy.menu.link_prefab_error_node_empty");
    }

    if (t) {
      if (
        !(e = await Editor.Message.request(
          "asset-db",
          "query-asset-info",
          t
        )) ||
        e.type !== "cc.Prefab"
      ) {
        a = Editor.I18n.t("hierarchy.menu.link_prefab_error_asset_invalid");
      }
    } else {
      a = Editor.I18n.t("hierarchy.menu.link_prefab_error_asset_empty");
    }

    if (a) {
      await Editor.Dialog.warn(a, {
        title: Editor.I18n.t("hierarchy.operate.dialogWarning"),
      });
    } else if (
      (
        await Editor.Dialog.warn(
          Editor.I18n.t("hierarchy.menu.link_prefab_make_sure"),
          {
            buttons: [
              Editor.I18n.t("hierarchy.dialog.confirm"),
              Editor.I18n.t("hierarchy.dialog.cancel"),
            ],
            default: 0,
            cancel: 1,
            title: Editor.I18n.t("hierarchy.operate.dialogWarning"),
          }
        )
      ).response !== 1
    ) {
      e = await Editor.Message.request(
        messageProtocol.scene,
        "begin-recording",
        r
      );

      await Editor.Message.request(messageProtocol.scene, "link-prefab", r, t);

      await Editor.Message.request(messageProtocol.scene, "end-recording", e);
    }
  },
  async "unlink-prefab"(e) {
    let r = "";

    if ((e = e || Editor.Selection.getLastSelected("node"))) {
      if (
        !(await Editor.Message.request(messageProtocol.scene, "query-node", e))
          .__prefab__
      ) {
        r = Editor.I18n.t("hierarchy.menu.unlink_prefab_error_prefab_empty");
      }
    } else {
      r = Editor.I18n.t("hierarchy.menu.link_prefab_error_node_empty");
    }

    if (r) {
      await Editor.Dialog.warn(r, {
        title: Editor.I18n.t("hierarchy.operate.dialogWarning"),
      });
    } else {
      await Editor.Message.request(
        messageProtocol.scene,
        "unlink-prefab",
        e,
        false
      );
    }
  },
  async "unlink-prefab-recursively"() {
    var e = Editor.Selection.getLastSelected("node");
    let r = "";

    if (e) {
      if (
        !(await Editor.Message.request(messageProtocol.scene, "query-node", e))
          .__prefab__
      ) {
        r = Editor.I18n.t("hierarchy.menu.unlink_prefab_error_prefab_empty");
      }
    } else {
      r = Editor.I18n.t("hierarchy.menu.link_prefab_error_node_empty");
    }

    if (r) {
      await Editor.Dialog.warn(r, {
        title: Editor.I18n.t("hierarchy.operate.dialogWarning"),
      });
    } else {
      await Editor.Message.request(
        messageProtocol.scene,
        "unlink-prefab",
        e,
        true
      );
    }
  },
};
