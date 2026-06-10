module.exports = (t) => {
  const { Widget, UITransform, Label } = t;
  const global_cc = global.cc;
  const o = { TOP: 1, MID: 2, BOT: 4, LEFT: 8, CENTER: 16, RIGHT: 32 };

  Widget.prototype.setLockTop = function (t) {
    this._setLock(o.TOP, t);
  };

  Widget.prototype.getLockTop = function () {
    return this._lockFlags & o.TOP;
  };

  Widget.prototype.setLockBottom = function (t) {
    this._setLock(o.BOT, t);
  };

  Widget.prototype.getLockBottom = function () {
    return this._lockFlags & o.BOT;
  };

  Widget.prototype.setLockLeft = function (t) {
    this._setLock(o.LEFT, t);
  };

  Widget.prototype.getLockLeft = function () {
    return this._lockFlags & o.LEFT;
  };

  Widget.prototype.setLockRight = function (t) {
    this._setLock(o.RIGHT, t);
  };

  Widget.prototype.getLockRight = function () {
    return this._lockFlags & o.RIGHT;
  };

  Widget.prototype.setLockHorizontalCenter = function (t) {
    this._setLock(o.CENTER, t);
  };

  Widget.prototype.getLockHorizontalCenter = function () {
    return this._lockFlags & o.CENTER;
  };

  Widget.prototype.setLockVerticalCenter = function (t) {
    this._setLock(o.MID, t);
  };

  Widget.prototype.getLockVerticalCenter = function () {
    return this._lockFlags & o.MID;
  };

  Widget.prototype._setLock = function (t, e) {
    if (e !== 0 < (this._lockFlags & t)) {
      if (e) {
        this._lockFlags |= t;
      } else {
        this._lockFlags &= ~t;
      }
    }
  };

  Widget.prototype._adjustWidgetToAllowMovingInEditor = function (e) {
    if (
      e & global_cc.internal.TransformBit.POSITION &&
      !global_cc._widgetManager.isAligning
    ) {
      var e = this;
      var o = e.node.getPosition();
      var i = this._lastPos;
      var o = new global_cc.Vec3(o);
      o.subtract(i);
      let t = e.node.parent;
      var n;
      var s;
      var i = new global_cc.Vec3(1, 1, 1);

      if (e.target) {
        t = e.target;
        global_cc.internal.computeInverseTransForTarget(
          e.node,
          t,
          new global_cc.Vec3(),
          i
        );
      }

      if (t) {
        n = global_cc.internal.getReadonlyNodeSize(t);
        s = new global_cc.Vec3();

        n.width !== 0 &&
          n.height !== 0 &&
          global_cc.Vec3.set(s, o.x / n.width, o.y / n.height, s.z);

        e.isAlignTop &&
          !e.getLockTop() &&
          (e._top -= (e._isAbsTop ? o : s).y * i.y);

        e.isAlignBottom &&
          !e.getLockBottom() &&
          (e._bottom += (e._isAbsBottom ? o : s).y * i.y);

        e.isAlignLeft &&
          !e.getLockLeft() &&
          (e._left += (e._isAbsLeft ? o : s).x * i.x);

        e.isAlignRight &&
          !e.getLockRight() &&
          (e._right -= (e._isAbsRight ? o : s).x * i.x);

        e.isAlignHorizontalCenter &&
          !e.getLockHorizontalCenter() &&
          (e._horizontalCenter += (e._isAbsHorizontalCenter ? o : s).x * i.x);

        e.isAlignVerticalCenter &&
          !e.getLockVerticalCenter() &&
          (e._verticalCenter += (e._isAbsVerticalCenter ? o : s).y * i.y);

        this._recursiveDirty();
        e.node.getPosition(e._lastPos);
      }
    }
  };

  Widget.prototype._adjustWidgetToAllowResizingInEditor = function () {
    if (!global_cc._widgetManager.isAligning) {
      var e = this;
      var o = e.node.getComponent(UITransform);
      if (o) {
        var o_contentSize = o.contentSize;
        var n = this._lastSize;
        var o_contentSize = new global_cc.Vec3(
          o_contentSize.width - n.width,
          o_contentSize.height - n.height,
          0
        );
        let t = e.node.parent;
        var s;
        var r;
        var n = new global_cc.Vec3(1, 1, 1);

        if (e.target) {
          t = e.target;

          global_cc.internal.computeInverseTransForTarget(
            e.node,
            t,
            new global_cc.Vec3(),
            n
          );
        }

        if (t) {
          r = global_cc.internal.getReadonlyNodeSize(t);
          s = new global_cc.Vec3();

          r.width !== 0 &&
            r.height !== 0 &&
            global_cc.Vec3.set(
              s,
              o_contentSize.x / r.width,
              o_contentSize.y / r.height,
              s.z
            );

          r = o.anchorPoint;

          e.isAlignTop &&
            !e.getLockTop() &&
            (e._top -= (e._isAbsTop ? o_contentSize : s).y * (1 - r.y) * n.y);

          e.isAlignBottom &&
            !e.getLockBottom() &&
            (e._bottom -= (e._isAbsBottom ? o_contentSize : s).y * r.y * n.y);

          e.isAlignLeft &&
            !e.getLockLeft() &&
            (e._left -= (e._isAbsLeft ? o_contentSize : s).x * r.x * n.x);

          e.isAlignRight &&
            !e.getLockRight() &&
            (e._right -=
              (e._isAbsRight ? o_contentSize : s).x * (1 - r.x) * n.x);

          ((o = e.node.getComponent(Label)) &&
            o.overflow === 0 &&
            e.isAlignRight &&
            e.isAlignLeft) ||
            this._recursiveDirty();
        }
      }
    }
  };
};
