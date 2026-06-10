Object.defineProperty(exports, "__esModule", { value: true });
exports.splitAnimation = splitAnimation;
const cc_1 = require("cc");
const exotic_animation_1 = require("cc/editor/exotic-animation");

const { evaluateValueTangent } = require("./curve-utils");

function splitAnimation(e, t, i) {
  var n = new cc_1.AnimationClip();
  n.duration = i - t;
  n.enableTrsBlending = e.enableTrsBlending;
  for (const o of e.tracks) {
    var a = cloneTrackWithoutChannels(o);
    var r = Array.from(o.channels());
    const c = Array.from(a.channels());

    r.forEach(({ name, curve }, a) => {
      c[a].name = name;
      name = c[a].curve;
      if (curve instanceof cc_1.RealCurve) {
        splitRealCurve(curve, t, i, name);
      } else {
        if (!(curve instanceof cc_1.QuatCurve)) {
          throw new Error("Unknown curve type.");
        }
        splitQuaternionCurve(curve, t, i, name);
      }
    });

    n.addTrack(o);
  }
  e = e[exotic_animation_1.exoticAnimationTag];

  if (e) {
    n[exotic_animation_1.exoticAnimationTag] = e.split(t, i);
  }

  return n;
}
function cloneTrackWithoutChannels(e) {
  switch (true) {
    default: {
      throw new Error("Unknown track type.");
    }
    case e instanceof cc_1.animation.RealTrack: {
      return new cc_1.animation.RealTrack();
    }
    case e instanceof cc_1.animation.QuatTrack: {
      return new cc_1.animation.QuatTrack();
    }
    case e instanceof cc_1.animation.ObjectTrack: {
      return new cc_1.animation.ObjectTrack();
    }
    case e instanceof cc_1.animation.VectorTrack: {
      var n = new cc_1.animation.VectorTrack();
      n.componentsCount = e.componentsCount;
      return n;
    }
    case e instanceof cc_1.animation.ColorTrack: {
      return new cc_1.animation.ColorTrack();
    }
    case e instanceof exotic_animation_1.RealArrayTrack: {
      n = new exotic_animation_1.RealArrayTrack();
      n.elementCount = e.elementCount;
      return n;
    }
  }
}
function splitRealCurve(e, n, a, t) {
  var i;
  var r = e.indexOfKeyframe(n);
  var o = e.indexOfKeyframe(a);
  var c = r;
  var l = o;
  var u = [...e.keyframes()].slice(c, l);

  if (c !== r) {
    ({ value: c, tangent: i } = evaluateBetweenKeyframes(e, r, c, n));

    u.unshift([
      n,
      {
        value: c,
        interpolationMode: e.getKeyframeValue(r).interpolationMode,
        rightTangent: i.y,
        rightTangentWeight: i.x,
      },
    ]);
  }

  if (l !== o) {
    ({ value: n, tangent: c } = evaluateBetweenKeyframes(e, l, o, a));

    u.unshift([
      a,
      {
        value: n,
        interpolationMode: e.getKeyframeValue(o).interpolationMode,
        leftTangent: c.y,
        leftTangentWeight: c.x,
      },
    ]);
  }

  t.assignSorted(u);
  t.preExtrapolation = e.preExtrapolation;
  t.postExtrapolation = e.postExtrapolation;
}
function splitQuaternionCurve(e, n, a, t) {
  var i = e.indexOfKeyframe(n);
  var r = e.indexOfKeyframe(a);
  var o = i;
  var c = r;
  var l = [...e.keyframes()].slice(o, c);

  if (o !== i && i >= 0) {
    o = e.evaluate(n);

    l.unshift([
      n,
      {
        value: o,
        interpolationMode: e.getKeyframeValue(i).interpolationMode,
        easingMethod: e.getKeyframeValue(i).easingMethod,
      },
    ]);
  }

  if (c !== r && r >= 0) {
    n = e.evaluate(a);

    l.unshift([
      a,
      {
        value: n,
        interpolationMode: e.getKeyframeValue(r).interpolationMode,
        easingMethod: e.getKeyframeValue(r).easingMethod,
      },
    ]);
  }

  t.assignSorted(l);
}
function evaluateBetweenKeyframes(e, n, a, t) {
  var i = e.getKeyframeTime(n);

  var { value: n, rightTangent, rightTangentWeight } = e.getKeyframeValue(n);

  var c = e.getKeyframeTime(a);
  var { value: e, leftTangent: a, leftTangentWeight } = e.getKeyframeValue(a);
  return evaluateValueTangent(
    t,
    i,
    n,
    rightTangentWeight,
    rightTangent,
    c,
    e,
    leftTangentWeight,
    a
  );
}
