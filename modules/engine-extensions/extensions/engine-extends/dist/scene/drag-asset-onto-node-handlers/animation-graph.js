Object.defineProperty(exports, "__esModule", { value: true });
exports.dragAnimationGraphOntoNodeHandlerEntry = undefined;
const cc_1 = require("cc");
const new_gen_anim_1 = require("cc/editor/new-gen-anim");

const { translate } = require("../utils/i18n");

async function ensureAnimationController(n) {
  let e = n.getComponent(cc_1.animation.AnimationController);
  if (!e) {
    var o = n.getComponent(cc_1.Animation);
    if (o) {
      if (
        !(await showConfirmDialog(
          translate(
            "engine-extends.drag_asset_onto_node_handlers.animation_graph.confirm_existing_animation_component"
          )
        ))
      ) {
        return null;
      }
      if (!removeComponent(o)) {
        console.warn(
          `Failed to remove animation component ${o}. No animation controller would be created.`
        );

        return null;
      }
    }

    if (!(e = addComponent(n, cc_1.animation.AnimationController))) {
      console.warn("Failed to add animation controller component.");
    }
  }
  return e;
}
function addComponent(n, e) {
  return cce.Node.createComponent(n.uuid, cc_1.js.getClassName(e))
    ? n.getComponent(e)
    : null;
}
function removeComponent(n) {
  var n_node = n.node;

  if (n.uuid) {
    cce.Node.removeComponent(n.uuid);
  } else {
    n.destroy();
  }

  var n_node = !n_node.components.includes(n);
  return n_node;
}
async function showConfirmDialog(n) {
  return (
    (
      await Editor.Dialog.info(n, {
        title: translate(
          "engine-extends.drag_asset_onto_node_handlers.animation_graph.title"
        ),
        buttons: [
          translate(
            "engine-extends.drag_asset_onto_node_handlers.animation_graph.yes"
          ),
          translate(
            "engine-extends.drag_asset_onto_node_handlers.animation_graph.cancel"
          ),
        ],
        default: 1,
        cancel: 1,
      })
    ).response === 0
  );
}
exports.dragAnimationGraphOntoNodeHandlerEntry = [
  new_gen_anim_1.AnimationGraph,
  async function (n) {
    n = await ensureAnimationController(n);
    return !!n && ((n.graph = this), true);
  },
];
