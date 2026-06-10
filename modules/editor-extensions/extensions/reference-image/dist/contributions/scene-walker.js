Object.defineProperty(exports, "__esModule", { value: true });

const { join } = require("path");

module.paths.push(join(Editor.App.path, "node_modules"));
const cc_1 = require("cc");

const { readFileSync } = require("fs");

const { HideInHierarchy, DontSave } = cc_1.CCObject.Flags;
const NAME = "Reference-Image";
exports.methods = {
  async getTargets() {
    var e;
    var a;
    let t = (0, cc_1.find)(`Editor Scene Background/${NAME}-Canvas`);

    if (!t) {
      (t = new cc_1.Node(NAME + "-Canvas")).addComponent(cc_1.Canvas);
      t.parent = (0, cc_1.find)("Editor Scene Background");
      t.hideFlags |= DontSave | HideInHierarchy;

      t.layer =
        cc_1.Layers.Enum.EDITOR |
        cc.Layers.Enum.IGNORE_RAYCAST |
        cc_1.Layers.Enum.UI_2D;
    }

    let c = t.getChildByName(NAME);

    if (!c) {
      c = new cc_1.Node(NAME);
      c.parent = t;
      c.hideFlags |= DontSave | HideInHierarchy;

      t.layer =
        cc_1.Layers.Enum.EDITOR |
        cc.Layers.Enum.IGNORE_RAYCAST |
        cc_1.Layers.Enum.UI_2D;
    }

    c.active = await Editor.Profile.getConfig("reference-image", "show");
    let n = c.getComponent(cc_1.Sprite);

    if (!n) {
      a = (n = c.addComponent(cc_1.Sprite)).color.clone();

      a.a =
        null !=
        (e = await Editor.Profile.getConfig("reference-image", "opacity"))
          ? e
          : 50;

      n.color = a;
    }

    cce.Engine.repaintInEditMode();
    return { node: c, sprite: n };
  },
  async syncData(e) {
    try {
      var { node, sprite } = await this.getTargets();
      var c = node.position.clone();

      e.sx;
      c.x = e.x;
      c.y = e.y;
      c.z = 0;
      node.position = c;
      var n = node.scale.clone();
      n.x = e.sx;
      n.y = e.sy;
      n.z = 1;
      node.scale = n;
      var r = sprite.color.clone();

      r.a = e.opacity;
      sprite.color = r;
      cce.Engine.repaintInEditMode();
    } catch (e) {
      console.log("sync data invalid. ", e);
    }
  },
  async switchImages(a) {
    let e = null;
    try {
      e = readFileSync(a);
    } catch (e) {
      console.error("switch image invalid. the path: " + a, e);
    }
    if (e) {
      const t = (await this.getTargets()).sprite;
      e = Buffer.from(e).toString("base64");
      const c = new ccwindow.Image();
      c.src = "data:png;base64," + e;

      c.onload = () => {
        t.spriteFrame = cc_1.SpriteFrame.createWithImage(c);
        cce.Engine.repaintInEditMode();
      };
    }
  },
  async resetImage() {
    var e = (await this.getTargets()).sprite;
    e.spriteFrame = null;
    cce.Engine.repaintInEditMode();
  },
  async setImageVisible(e) {
    var a = (await this.getTargets()).node;
    a.active = e;
    cce.Engine.repaintInEditMode();
  },
};
