var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.componentOperation = undefined;
const cc_1 = require("cc");

const { instantiate } = cc_1;

const utils_1 = require("./utils");
const node_1 = __importDefault(require("../node"));
const dump_1 = __importDefault(require("../../../export/dump"));
const scene_facade_state_interface_1 = require("../../facade/scene-facade-state-interface");
const undo_1 = require("../../../export/undo");
const CompPrefabInfo = cc_1.Prefab._utils.CompPrefabInfo;
class ApplyRemoveComponentCommand extends undo_1.SceneUndoCommand {
  removedCompInfo = null;
  _undoFunc;
  _redoFunc;
  constructor(e, t) {
    super();
    this._undoFunc = e;
    this._redoFunc = t;
  }
  async undo() {
    if (this.removedCompInfo) {
      this._undoFunc(this.removedCompInfo);
    }
  }
  async redo() {
    if (this.removedCompInfo) {
      this._redoFunc(
        this.removedCompInfo.nodeUUID,
        this.removedCompInfo.compData.__prefab.fileId
      );
    }
  }
}
class ComponentOperation {
  isRevertingRemovedComponents = false;
  isRemovingMountedComponents = false;
  compMap = {};
  cacheComp(e) {
    this.compMap[e.uuid] = e._instantiate();
  }
  getCachedComp(e) {
    return this.compMap[e];
  }
  clearCompCache() {
    this.compMap = {};
  }
  onAddComponent(e) {
    this.cacheComp(e);

    if (!this.isRevertingRemovedComponents) {
      if ((e = e.node) && e._prefab) {
        this.updateMountedComponents(e);
      }
    }
  }
  onComponentAdded(e, t) {
    this.cacheComp(e);

    if (
      t.modeName === scene_facade_state_interface_1.SceneModeType.Prefab &&
      e.node &&
      e.node._prefab
    ) {
      if (!e.__prefab) {
        e.__prefab = new CompPrefabInfo();
        e.__prefab.fileId = e.uuid;
      }
    }
  }
  onRemoveComponentInGeneralMode(e, t) {
    var n;
    var o;

    if (!this.isRemovingMountedComponents) {
      if ((n = e.node) && n._prefab) {
        o = utils_1.prefabUtils.getMountedRoot(e);

        e.__prefab && !o
          ? this.onPrefabComponentRemoved(e)
          : this.updateMountedComponents(n);
      }
    }
  }
  onPrefabComponentRemoved(e) {
    var t;
    var n;
    var e_prefab = e.__prefab;

    if (
      e_prefab &&
      (e = e.node)._prefab &&
      (t = (e = utils_1.prefabUtils.getOutMostPrefabInstanceInfo(e))
        .outMostPrefabInstanceNode) &&
      ((e = e.targetPath), (n = t._prefab?.instance))
    ) {
      e.splice(0, 1);
      e.push(e_prefab.fileId);
      utils_1.prefabUtils.fireBeforeChangeMsg(t);
      utils_1.prefabUtils.addRemovedComponent(n, e);
      utils_1.prefabUtils.fireChangeMsg(t);
    }
  }
  onComponentRemovedInGeneralMode(e, t) {
    if (!this.isRemovingMountedComponents) {
      utils_1.prefabUtils.checkToRemoveTargetOverride(e, t);
    }
  }
  async doApplyRemovedComponent(e, t) {
    var i_prefab = node_1.default.query(e);
    if (i_prefab) {
      var o = utils_1.prefabUtils.getOutMostPrefabInstanceInfo(i_prefab);
      var o_outMostPrefabInstanceNode = o.outMostPrefabInstanceNode;
      if (o_outMostPrefabInstanceNode) {
        var o = o.targetPath;
        var s = o_outMostPrefabInstanceNode._prefab?.instance;
        var o_outMostPrefabInstanceNode__prefab =
          o_outMostPrefabInstanceNode._prefab;
        if (
          s &&
          o_outMostPrefabInstanceNode__prefab &&
          o_outMostPrefabInstanceNode__prefab.asset
        ) {
          var i = o_outMostPrefabInstanceNode__prefab.asset._uuid;
          if (utils_1.prefabUtils.isSubAsset(i)) {
            console.warn("can't apply RemovedComponent in SubAsset Prefab");
            return null;
          }
          o.splice(0, 1);
          o.push(t);
          i = utils_1.prefabUtils.getPrefabAssetNodeInstance(
            o_outMostPrefabInstanceNode__prefab
          );
          if (!i) {
            return null;
          }
          var t = utils_1.prefabUtils.getTarget(o, i);
          var p = t.node.components.indexOf(t);
          var f = t._instantiate();
          if (!f) {
            return null;
          }

          if (i_prefab._prefab?.instance && i_prefab._prefab?.instance !== s) {
            d = (i_prefab = i._prefab).instance;
            i_prefab.instance = undefined;
            this.onRemoveComponentInGeneralMode(t, i);
            i_prefab.instance = d;
          }

          t._destroyImmediate();
          var i_prefab = i._prefab;

          if (i_prefab) {
            i_prefab.instance = undefined;
          }

          var d = utils_1.prefabUtils.generatePrefabDataFromNode(i);

          return d
            ? ((t = d.prefabData),
              (i_prefab = await Editor.Message.request(
                "asset-db",
                "query-asset-info",
                o_outMostPrefabInstanceNode__prefab.asset._uuid
              ))
                ? (utils_1.prefabUtils.fireBeforeChangeMsg(
                    o_outMostPrefabInstanceNode
                  ),
                  utils_1.prefabUtils.deleteRemovedComponent(s, o),
                  utils_1.prefabUtils.fireChangeMsg(
                    o_outMostPrefabInstanceNode
                  ),
                  await Editor.Message.request(
                    "asset-db",
                    "create-asset",
                    i_prefab.source,
                    t,
                    { overwrite: true }
                  ),
                  cce.SceneFacadeManager.abortSnapshot(),
                  { nodeUUID: e, compIndex: p, compData: f })
                : null)
            : null;
        }
      }
    }
    return null;
  }
  async undoApplyRemovedComponent(e) {
    var t;
    var n;
    var o;
    var a;
    var s;
    var r;

    if (
      e &&
      (s = node_1.default.query(e.nodeUUID)) &&
      (t = (n = utils_1.prefabUtils.getOutMostPrefabInstanceInfo(s))
        .outMostPrefabInstanceNode) &&
      ((n = n.targetPath), (o = t._prefab?.instance), (a = t._prefab), o) &&
      a &&
      a.asset &&
      (n.splice(0, 1),
      (r = n.slice()).push(s._prefab.fileId),
      (s = e.compData.__prefab.fileId),
      n.push(s),
      (s = utils_1.prefabUtils.getPrefabAssetNodeInstance(a))) &&
      (utils_1.prefabUtils
        .getTarget(r, s)
        ._addComponentAt(e.compData, e.compIndex),
      (r = utils_1.prefabUtils.generatePrefabDataFromNode(s))) &&
      (e = await Editor.Message.request(
        "asset-db",
        "query-asset-info",
        a.asset._uuid
      ))
    ) {
      utils_1.prefabUtils.fireBeforeChangeMsg(t);
      utils_1.prefabUtils.addRemovedComponent(o, n);
      utils_1.prefabUtils.fireChangeMsg(t);

      await Editor.Message.request(
        "asset-db",
        "create-asset",
        e.source,
        r.prefabData,
        { overwrite: true }
      );

      cce.SceneFacadeManager.abortSnapshot();
    }
  }
  async applyRemovedComponent(e, t) {
    var n = new ApplyRemoveComponentCommand(
      this.undoApplyRemovedComponent.bind(this),
      this.doApplyRemovedComponent.bind(this)
    );

    var o = cce.SceneFacadeManager.beginRecording(e, { customCommand: n });
    var e = await this.doApplyRemovedComponent(e, t);

    if (e) {
      n.removedCompInfo = e;
      cce.SceneFacadeManager.endRecording(o);
    } else {
      cce.SceneFacadeManager.cancelRecording(o);
    }
  }
  async cloneComponentToNode(e, t) {
    var n;
    var o = dump_1.default.dumpComponent(t);
    delete o.value._objFlags;
    var a = e.addComponent(cc_1.js.getClassName(t));
    var e_components = e.components;

    if (
      e_components &&
      e_components.length &&
      (n = e_components[(e_components = e_components.length - 1)]) &&
      n === a &&
      (await dump_1.default.restoreProperty(e, "__comps__." + e_components, o),
      a instanceof cc_1.MissingScript)
    ) {
      a._$erialized = t._$erialized;
    }
  }
  async revertRemovedComponent(e, t) {
    var n;
    var o;
    var a;
    var s;
    var r = node_1.default.query(e);

    if (
      r &&
      (n = (o = utils_1.prefabUtils.getOutMostPrefabInstanceInfo(r))
        .outMostPrefabInstanceNode) &&
      ((o = o.targetPath), (a = n._prefab?.instance), (s = n._prefab), a) &&
      s &&
      s.asset &&
      (o.splice(0, 1), o.push(t), (t = instantiate(s.asset)))
    ) {
      s = cce.SceneFacadeManager.beginRecording([n.uuid, e]);
      e = utils_1.prefabUtils.getTarget(o, t);
      utils_1.prefabUtils.fireBeforeChangeMsg(r);
      this.isRevertingRemovedComponents = true;
      await this.cloneComponentToNode(r, e);
      this.isRevertingRemovedComponents = false;
      utils_1.prefabUtils.fireChangeMsg(r);
      utils_1.prefabUtils.fireBeforeChangeMsg(n);
      utils_1.prefabUtils.deleteRemovedComponent(a, o);
      utils_1.prefabUtils.fireChangeMsg(n);
      cce.SceneFacadeManager.endRecording(s);
    }
  }
  updateMountedComponents(t) {
    var t_prefab = t._prefab;
    if (t_prefab) {
      var outMostPrefabInstanceNode_prefab =
        utils_1.prefabUtils.getOutMostPrefabInstanceInfo(t);

      var { outMostPrefabInstanceNode, targetPath } =
        outMostPrefabInstanceNode_prefab;

      if (!outMostPrefabInstanceNode) {
        return null;
      }
      var outMostPrefabInstanceNode_prefab = outMostPrefabInstanceNode._prefab;
      var a = outMostPrefabInstanceNode_prefab?.instance;
      if (outMostPrefabInstanceNode && outMostPrefabInstanceNode_prefab && a) {
        outMostPrefabInstanceNode_prefab =
          utils_1.prefabUtils.getPrefabAssetNodeInstance(
            outMostPrefabInstanceNode_prefab
          );
        if (outMostPrefabInstanceNode_prefab) {
          targetPath.splice(0, 1);
          targetPath.push(t_prefab.fileId);
          t_prefab = utils_1.prefabUtils.getTarget(
            targetPath,
            outMostPrefabInstanceNode_prefab
          );
          if (t_prefab) {
            var s = t_prefab.components.map((e) => e.__prefab?.fileId);

            var r = [];
            for (let t_prefab = 0; t_prefab < t.components.length; t_prefab++) {
              var i;
              var p = t.components[t_prefab];

              if (
                !p.__prefab ||
                (!s.includes(p.__prefab?.fileId) &&
                  (!(i = utils_1.prefabUtils.getMountedRoot(p)) ||
                    i === outMostPrefabInstanceNode))
              ) {
                r.push(p);
              }
            }
            utils_1.prefabUtils.fireBeforeChangeMsg(outMostPrefabInstanceNode);

            if (r.length > 0) {
              outMostPrefabInstanceNode_prefab =
                utils_1.prefabUtils.getPrefabInstanceMountedComponents(
                  a,
                  targetPath
                );
              outMostPrefabInstanceNode_prefab.components = r;

              outMostPrefabInstanceNode_prefab.components.forEach((e) => {
                utils_1.prefabUtils.setMountedRoot(
                  e,
                  outMostPrefabInstanceNode
                );
              });
            } else {
              for (
                let t_prefab = 0;
                t_prefab < a.mountedComponents.length;
                t_prefab++
              ) {
                var f = a.mountedComponents[t_prefab];
                if (f.isTarget(targetPath)) {
                  f.components.forEach((e) => {
                    utils_1.prefabUtils.setMountedRoot(e, undefined);
                  });

                  a.mountedComponents.splice(t_prefab, 1);
                  break;
                }
              }
            }

            utils_1.prefabUtils.fireChangeMsg(outMostPrefabInstanceNode);
          }
        }
      }
    }
  }
  applyMountedComponents(e) {
    var t = e;
    const t_prefab = t._prefab;
    if (t_prefab) {
      const t_prefab_instance = t_prefab.instance;
      if (t_prefab_instance) {
        const p = new Map();
        var t_prefab_instance_mountedComponents =
          t_prefab_instance.mountedComponents;
        for (let e = 0; e < t_prefab_instance_mountedComponents.length; e++) {
          var o = t_prefab_instance_mountedComponents[e];
          const o_targetInfo = o.targetInfo;
          if (o_targetInfo) {
            const d = utils_1.prefabUtils.getTarget(o_targetInfo.localID, t);

            if (d) {
              o.components.forEach((e) => {
                var t;
                var n;
                var o;
                var a;
                var s;

                if (!e.__prefab) {
                  e.__prefab = new CompPrefabInfo();
                  e.__prefab.fileId = e.uuid;
                }

                if (o_targetInfo.localID.length > 1) {
                  t_prefab.instance = undefined;
                  t = utils_1.prefabUtils.getOutMostPrefabInstanceInfo(d);
                  t_prefab.instance = t_prefab_instance;

                  (n = t.outMostPrefabInstanceNode) &&
                    (o = n._prefab) &&
                    (o = o.instance) &&
                    (s = d._prefab) &&
                    ((a = t.targetPath.slice(1)).push(s.fileId),
                    utils_1.prefabUtils
                      .getPrefabInstanceMountedComponents(o, a)
                      .components.push(e),
                    utils_1.prefabUtils.setMountedRoot(e, n),
                    (s = t.targetPath.slice()).push(e.__prefab.fileId),
                    p.set(s, { prefabInfo: null }));
                } else {
                  p.set([e.__prefab.fileId], { prefabInfo: null });
                  utils_1.prefabUtils.setMountedRoot(e, undefined);
                }
              });
            }
          }
        }
        t_prefab_instance.mountedComponents = [];
        return p;
      }
    }
  }
}
const componentOperation = new ComponentOperation();
exports.componentOperation = componentOperation;
