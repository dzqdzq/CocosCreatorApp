Object.defineProperty(exports, "__esModule", { value: true });

const { getMessageProtocolScene } = require("../../utils");

const dum_element_base_1 = require("../dum-element-base");
class AnimationSocket extends dum_element_base_1.DumpElementBase {
  type = [
    "cc.SkeletalAnimation.Socket",
    "sp.Skeleton.SpineSocket",
    "dragonBones.ArmatureDisplay.DragonBoneSocket",
  ];
  $pathSelect = null;
  $node = null;
  selectClickEventBind = this.selectClickEvent.bind(this);
  _listeners = ["change"];
  parseAndSetData(t, e) {
    e.value.path.value = t.path.value;
    e.value.target.value = { uuid: t.target.value.uuid };

    if ("values" in e) {
      e.values.forEach((e) => {
        e.path.value = t.path.value;
      });

      e.values.forEach((e) => {
        e.target.value = { uuid: t.target.value.uuid };
      });
    }

    return true;
  }
  change(e, t) {
    if (e.target) {
      var a = e.target.getAttribute("local");
      const l = e.target.value;
      switch (a) {
        case "path": {
          t.value.path.value = l;

          if ("values" in t) {
            t.values.forEach((e) => {
              e.path.value = l;
            });
          }

          break;
        }
        case "target": {
          t.value.target.value = { uuid: l };

          if ("values" in t) {
            t.values.forEach((e) => {
              e.target.value = { uuid: l };
            });
          }
        }
      }
    }
  }
  template = `
        <!--<ui-label slot="label"></ui-label> -->
        <ui-prop>
            <ui-label slot="label">Path</ui-label>
            <ui-input readonly class="select-path" slot="content" local="path"></ui-input>
        </ui-prop>
        <ui-prop dump="cc.Asset" style="margin-top: 4px;">
            <ui-label slot="label">Target</ui-label>
            <ui-node droppable="cc.Node" slot="content" local="target"></ui-node>
        </ui-prop>
    `;
  style = "";
  findComponent() {
    if (this.$parentElement) {
      let e = this.$parentElement;
      do {
        var t = (e = e.parentElement || e.getRootNode().host).dump;
        if (
          e &&
          t &&
          Array.isArray(t.extends) &&
          t.extends.includes("cc.Component")
        ) {
          break;
        }
      } while (e);
      return e;
    }
  }
  async refreshSocketPathList() {
    var e = this.findComponent();
    var e = e ? e.dump : null;
    if (e && e.value.uuid) {
      e = e.value.uuid.value;

      e = await Editor.Message.request(
        getMessageProtocolScene(this.$parentElement),
        "execute-component-method",
        { uuid: e, name: "querySockets", args: [] }
      );

      if (e) {
        return e.map((e) => ({
          name: e,
        }));
      }
    }
    return [];
  }
  async selectClickEvent(e) {
    var t = await this.refreshSocketPathList();
    const a = this;

    if (a.$pathSelect) {
      Editor.Panel.__protected__.openKit("ui-kit.searcher", {
        elem: a.$pathSelect,
        params: [{ type: "string", list: t }],
        listeners: {
          async confirm(e) {
            if (e) {
              a.$pathSelect.value = e.value;

              a.$pathSelect.dispatchEvent(
                new CustomEvent("change", { bubbles: true, composed: true })
              );
            }
          },
        },
      });
    }
  }
  mounted(e) {
    this.$pathSelect = e.querySelector(".select-path");
    this.$node = e.querySelector("ui-node");
  }
  ready() {
    super.ready();

    if (this.$pathSelect) {
      this.$pathSelect.addEventListener("click", this.selectClickEventBind);
    }
  }
  update(e) {
    this.refreshSocketPathList();

    if (
      this.$pathSelect &&
      this.$node &&
      (this.$pathSelect.value !== e.value.path.value &&
        (this.$pathSelect.value = e.value.path.value),
      this.$node.value !== e.value.target.value.uuid)
    ) {
      this.$node.value = e.value.target.value.uuid;
    }
  }
  close() {
    super.close();

    if (this.$pathSelect) {
      this.$pathSelect.removeEventListener("click", this.selectClickEventBind);
    }
  }
}
exports.default = AnimationSocket;
