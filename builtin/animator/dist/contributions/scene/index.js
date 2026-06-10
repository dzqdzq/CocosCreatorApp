Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
const cc_1 = require("cc");

const { promisify } = require("util");

function getAnimationComp(e, n) {
  var o = cce.Node.query(e);
  if (o) {
    if (n) {
      return o.getComponent(n);
    }
    for (const i of ["cc.Animation", "cc.SkeletalAnimation"]) {
      var t = o.getComponent(i);
      if (t) {
        return t;
      }
    }
  } else {
    console.debug("can not get node from uuid " + e);
  }
  return null;
}
async function addAllPropKeysToNode(e, n, o, t) {
  var i = `Start addAllPropKeysToNode ${o || "/"}...`;
  console.time(i);
  t.node++;
  var a = cce.Animation.queryProperties(e.uuid);
  t.property += a.length;

  await Promise.all(a.map((e) => addAllKeysToProp(e.key, n, o || "/")));

  if (e.children && e.children.length) {
    await Promise.all(
      e.children.map((e) => addAllPropKeysToNode(e, n, o + "/" + e.name, t))
    );

    console.timeEnd(i);
  }

  return true;
}
async function addAllKeysToProp(o, t, i) {
  var e = `Start addAllKeysToProp ${i}:${o} with key(${t.num})...`;
  console.time(e);

  if (t.createProp) {
    await cce.Animation._curEditAnimClip.createProp(i, o);
  }

  await Promise.all(
    new Array(t.num)
      .fill(1)
      .map((e, n) =>
        cce.Animation._curEditAnimClip.createKey(i, o, t.start + n * t.spacing)
      )
  );

  console.timeEnd(e);
  cce.Animation._isDirty = true;
}
exports.methods = {
  async createAniCompFromAsset(e, o, t) {
    if (!e || !o || !o.length) {
      return false;
    }
    if ("cc.animation.AnimationController" !== (t = t || "cc.Animation")) {
      var i = cce.Node.query(e);
      let n = i.getComponent(t);

      if (!n) {
        cce.SceneFacadeManager.createComponent({ uuid: e, component: t });
        n = i.getComponent(t);
      }

      e = n.defaultClip;
      for (const c of o) {
        var a = await promisify(cc_1.assetManager.loadAny)(c);
        n.defaultClip = a;
      }

      if (e) {
        n.defaultClip = e;
      }

      cce.SceneFacadeManager.snapshot();
      t = i.components.findIndex((e) => e.uuid === n.uuid);
      cce.Node.emit("change", i, { propPath: `__comps__.${t}.defaultClip` });
      return true;
    }
    console.debug(
      "Can not add AnimationClip to cc.animation.AnimationController"
    );
  },
  async addClipFromAsset(e, n, o) {
    if (!e || !n) {
      return false;
    }
    const t = getAnimationComp(e, o);

    if (t) {
      if (o !== "cc.animation.AnimationController") {
        o = await promisify(cc_1.assetManager.loadAny)(n);
        t.defaultClip = o;
        cce.SceneFacadeManager.snapshot();

        o = (n = cce.Node.query(e)).components.findIndex(
          (e) => e.uuid === t.uuid
        );

        cce.Node.emit("change", n, {
          propPath: `__comps__.${o}.defaultClip`,
        });

        return true;
      }

      return void console.debug(
        "Can not add AnimationClip to cc.animation.AnimationController"
      );
    }

    console.debug(`get animaton component from ${e} failed!`);
    return false;
  },
  async restoreFromDump(e, n, o) {
    cce.Animation.restoreFromDump(e, n, o);
  },
  queryClipDump(e, n) {
    return cce.Animation.dumpClip(e, n);
  },
  async createAllSupportKeys(e) {
    var n;

    if (cce.SceneFacadeManager.queryMode() !== "animation") {
      console.warn("请先进入动画编辑模式");
    } else {
      n = { spacing: 5, num: 4, createProp: true, start: 0 };
      e = e ? Object.assign(n, e) : n;
      n = cce.Scene.queryNodeTree(cce.Animation._curEditRootNodeUuid);
      console.time("createAllSupportKeys");
      await addAllPropKeysToNode(n, e, "", (n = { node: 0, property: 0 }));
      cce.Animation._isDirty = true;
      cce.Engine.repaintInEditMode();

      cce.Animation.emit(
        "scene:animation-change",
        cce.Animation._curEditRootNodeUuid,
        cce.Animation._curEditClipUuid
      );

      Editor.Message.broadcast(
        "scene:animation-change",
        cce.Animation._curEditRootNodeUuid,
        cce.Animation._curEditClipUuid
      );

      console.timeEnd("createAllSupportKeys");

      console.log(
        `createAllSupportKeys with node: ${n.node}, property: ` + n.property
      );
    }
  },
};
