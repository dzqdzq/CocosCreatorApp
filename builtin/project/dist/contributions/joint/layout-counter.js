Object.defineProperty(exports, "__esModule", { value: true });
exports.jointTextureCounter = undefined;
exports.calcJointLayouts = calcJointLayouts;
class JointTextureCounter {
  async calc(t) {
    var e = await Promise.all(t.map((t) => this.calcTextureResult(t)));

    var t = await this.calcTextureLength(t);

    e.sort((t, e) => ((t && t.skeleton) || 0) - ((e && e.skeleton) || 0));

    return { contents: e, textureLength: t };
  }
  async calcTextureResult(t) {
    const e = { skeleton: null, clips: [] };
    if (t.skeleton) {
      var a = await this._getClipHash(t.skeleton);
      if (!a) {
        return null;
      }
      e.skeleton = a;
    }

    if (t.clips && t.clips.length > 0) {
      await Promise.all(
        t.clips.map(async (t) => {
          t = await this._getClipHash(t);

          if (t) {
            e.clips.push(t);
          }
        })
      );
    }

    e.clips.sort();
    return e;
  }
  async calcTextureLength(t) {
    t = (
      await Promise.all(
        t.map(async (t) => (await this.calcJointPixel(t)).pixel)
      )
    ).reduce((t, e) => t + e);
    return 12 * Math.ceil(Math.sqrt(t) / 12);
  }
  async queryJointsLength(t) {
    return (
      ((t =
        t &&
        (await Editor.Message.request("asset-db", "query-asset-meta", t))) &&
        t.userData.jointsLength) ||
      0
    );
  }
  async calcJointPixel(e) {
    var a = await this.queryJointsLength(e.skeleton);
    let r = 0;
    for (let t = 0; t < e.clips.length; t++) {
      var s = e.clips[t];

      if (s && (s = await this._getLibraryJSON(s))) {
        s = Math.ceil(s.sample * s.duration) + 1;
        r += a * s * 3;
      }
    }
    return { joints: a, pixel: (r += 3 * a), length: e.clips.length };
  }
  async _getClipHash(t) {
    t = await this._getLibraryJSON(t);
    return t && t.hash;
  }
  async _getLibraryJSON(t) {
    try {
      return await Editor.Message.request("asset-db", "execute-script", {
        name: "project",
        method: "queryAnimationState",
        args: [t],
      });
    } catch (t) {
      console.error(t);
    }
    return null;
  }
}
async function calcJointLayouts() {
  var t =
    (await Editor.Profile.getProject(
      "project",
      "custom_joint_texture_layouts"
    )) || [];
  if (!t.length) {
    return [];
  }
  var e;
  var a = [];
  for (const r of t) {
    if (
      r &&
      r.contents.length &&
      (e = await exports.jointTextureCounter.calc(r.contents)) &&
      e.textureLength
    ) {
      a.push(e);
    }
  }
  return a;
}
exports.jointTextureCounter = new JointTextureCounter();
