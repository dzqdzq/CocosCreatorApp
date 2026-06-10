Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectWalker = undefined;
exports.ObjectWalkerBehavior = undefined;
exports.walk = walk;
exports.walkProperties = walkProperties;
exports.getNextProperty = getNextProperty;
class ObjectWalkerBehavior {
  walk(e, t, r) {}
  root;
  constructor(e) {
    this.root = e;
  }
  parseObject(e) {
    var t;
    var r;

    if (Array.isArray(e)) {
      this.forEach(e);
    } else {
      t = e.constructor;

      ((e instanceof cc.Asset ||
        (t !== Object && !cc.js.getClassId(e, false))) &&
        e !== this.root) ||
        ((r = t && t.__props__) ? this.parseCCClass(e, t, r) : this.forIn(e));
    }
  }
  parseCCClass(t, e, r) {
    var s = cc.Class.Attr.getClassAttrs(e);
    for (let e = 0; e < r.length; e++) {
      var o = r[e];

      if (s[o + cc.Class.Attr.DELIMETER + "serializable"] !== false) {
        this.walk(t, o, t[o]);
      }
    }
  }
  forIn(e) {
    for (const t in e) {
      if (
        e.hasOwnProperty(t) &&
        (t.charCodeAt(0) !== 95 || t.charCodeAt(1) !== 95)
      ) {
        this.walk(e, t, e[t]);
      }
    }
  }
  forEach(r) {
    for (let e = 0, t = r.length; e < t; ++e) {
      this.walk(r, "" + e, r[e]);
    }
  }
}
class ObjectWalker extends (exports.ObjectWalkerBehavior =
  ObjectWalkerBehavior) {
  iteratee;
  parsedObjects;
  parsedKeys;
  ignoreParent;
  ignoreSubPrefabHelper;
  walked = new Set();
  constructor(e, t, r) {
    super(e);
    this.iteratee = t;
    this.parsedObjects = [];
    this.parsedKeys = [];
    this.walked.add(e);
    this.ignoreParent = r && r.ignoreParent;
    this.ignoreSubPrefabHelper = r && r.ignoreSubPrefabHelper;

    if (this.ignoreParent) {
      if (this.root instanceof cc.Component) {
        this.ignoreParent = this.root.node;
      } else {
        if (!(this.root instanceof cc.Node)) {
          return cc.error("can only ignore parent of scene node");
        }
        this.ignoreParent = this.root;
      }
    }

    this.parseObject(e);
  }
  walk(e, t, r) {
    var s = r && typeof r == "object";
    if (s && !this.walked.has(r)) {
      if (this.ignoreParent) {
        if (r instanceof cc.Node) {
          if (!r.isChildOf(this.ignoreParent)) {
            return;
          }
        } else if (
          r instanceof cc.Component &&
          !r.node.isChildOf(this.ignoreParent)
        ) {
          return;
        }
      }

      if (
        !this.ignoreSubPrefabHelper ||
        !(r instanceof cc._PrefabInfo) ||
        r.root === e
      ) {
        this.walked.add(r);
        this.iteratee(e, t, r, this.parsedObjects, this.parsedKeys);
        this.parsedObjects.push(e);
        this.parsedKeys.push(t);
        this.parseObject(r);
        this.parsedObjects.pop();
        this.parsedKeys.pop();
      }
    }
  }
}
function walk(e, t) {
  new ObjectWalker(e, t);
}
exports.ObjectWalker = ObjectWalker;
const staticDummyWalker = new ObjectWalkerBehavior(null);
function doWalkProperties(e, t) {
  staticDummyWalker.root = null;
  staticDummyWalker.walk = t;
  staticDummyWalker.parseObject(e);
}
function walkProperties(e, o, t) {
  const a = t && t.dontSkipNull;
  new ObjectWalker(
    e,
    (e, t, r, s) => {
      if (r && typeof r == "object") {
        s.push(e);

        doWalkProperties(r, (e, t, r) => {
          if (typeof r == "object" && (a || r)) {
            o(e, t, r, s);
          }
        });

        s.pop();
      }
    },
    t
  );
}
function getNextProperty(e, t, r) {
  let s;
  var o = e.lastIndexOf(r);
  if (o === e.length - 1) {
    s = t;
  } else {
    if (!(o >= 0 && o < e.length - 1)) {
      return "";
    }
    s = e[o + 1];
  }
  let a = "";

  doWalkProperties(r, (e, t, r) => {
    if (r === s) {
      a = t;
    }
  });

  return a;
}
