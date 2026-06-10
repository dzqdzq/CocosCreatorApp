class Rect {
  constructor(t, e, i, h) {
    this.x = t || 0;
    this.y = e || 0;
    this.width = i || 0;
    this.height = h || 0;
  }

  static isContainedIn(t, e) {
    return (
      t.x >= e.x &&
      t.y >= e.y &&
      t.x + t.width <= e.x + e.width &&
      t.y + t.height <= e.y + e.height
    );
  }
}

Rect.prototype = {
  constructor: Rect,
  clone() {
    return new Rect(this.x, this.y, this.width, this.height);
  },
};

var BestShortSideFit = 0;
var BestLongSideFit = 1;
var BestAreaFit = 2;
var BottomLeftRule = 3;
var ContactPointRule = 4;
var LeftoverArea = 5;
function MaxRectsBinPack(t, e, i) {
  this.binWidth = 0;
  this.binHeight = 0;
  this.allowRotate = false;
  this.usedRectangles = [];
  this.freeRectangles = [];
  this.init(t, e, i);
}

MaxRectsBinPack.prototype = {
  constructor: MaxRectsBinPack,
  init(t, e, i) {
    this.binWidth = t;
    this.binHeight = e;
    this.allowRotate = i || false;
    this.usedRectangles.length = 0;
    this.freeRectangles.length = 0;
    this.freeRectangles.push(new Rect(0, 0, t, e));
  },
  insertRects(t, e) {
    for (var i = []; t.length > 0; ) {
      for (
        var h = Infinity, a = Infinity, n = -1, o = new Rect(), s = 0;
        s < t.length;
        s++
      ) {
        var l = { value: 0 };
        var r = { value: 0 };
        var u = this._scoreRectangle(t[s].width, t[s].height, e, l, r);

        if (l.value < h || (l.value === h && r.value < a)) {
          h = l.value;
          a = r.value;
          o = u;
          n = s;
        }
      }
      if (-1 === n) {
        return i;
      }
      this._placeRectangle(o);
      var c = t.splice(n, 1)[0];
      c.x = o.x;
      c.y = o.y;

      if (
        c.width !== c.height &&
        c.width === o.height &&
        c.height === o.width
      ) {
        c.rotated = !c.rotated;
      }

      i.push(c);
    }
    return i;
  },
  _placeRectangle(t) {
    for (var e = 0; e < this.freeRectangles.length; e++) {
      if (this._splitFreeNode(this.freeRectangles[e], t)) {
        this.freeRectangles.splice(e, 1);
        e--;
      }
    }
    this._pruneFreeList();
    this.usedRectangles.push(t);
  },
  _scoreRectangle(t, e, i, h, a) {
    var n = new Rect();
    h.value = Infinity;
    a.value = Infinity;

    switch (i) {
      case BestShortSideFit: {
        n = this._findPositionForNewNodeBestShortSideFit(t, e, h, a);
        break;
      }
      case BottomLeftRule: {
        n = this._findPositionForNewNodeBottomLeft(t, e, h, a);
        break;
      }
      case ContactPointRule: {
        n = this._findPositionForNewNodeContactPoint(t, e, h);
        h = -h;
        break;
      }
      case BestLongSideFit: {
        n = this._findPositionForNewNodeBestLongSideFit(t, e, a, h);
        break;
      }
      case BestAreaFit: {
        n = this._findPositionForNewNodeBestAreaFit(t, e, h, a);
        break;
      }
      case LeftoverArea: {
        n = this._findPositionForNewNodeLeftoverArea(t, e, h, a);
      }
    }

    if (n.height === 0) {
      h.value = Infinity;
      a.value = Infinity;
    }

    return n;
  },
  _findPositionForNewNodeBottomLeft(t, e, i, h) {
    var a;
    var n;
    var o = this.freeRectangles;
    var s = new Rect();
    i.value = Infinity;
    for (var l = 0; l < o.length; l++) {
      if (
        (a = o[l]).width >= t &&
        a.height >= e &&
        ((n = a.y + e) < i.value || (n === i.value && a.x < h.value))
      ) {
        s.x = a.x;
        s.y = a.y;
        s.width = t;
        s.height = e;
        i.value = n;
        h.value = a.x;
      }

      if (
        this.allowRotate &&
        a.width >= e &&
        a.height >= t &&
        ((n = a.y + t) < i.value || (n === i.value && a.x < h.value))
      ) {
        s.x = a.x;
        s.y = a.y;
        s.width = e;
        s.height = t;
        i.value = n;
        h.value = a.x;
      }
    }
    return s;
  },
  _findPositionForNewNodeBestShortSideFit(t, e, i, h) {
    var a = this.freeRectangles;
    var n = new Rect();
    i.value = Infinity;
    for (var o, s, l, r, u, c = 0; c < a.length; c++) {
      if (
        (u = a[c]).width >= t &&
        u.height >= e &&
        ((l = Math.abs(u.width - t)),
        (o = Math.abs(u.height - e)),
        (s = Math.min(l, o)),
        (l = Math.max(l, o)),
        s < i.value || (s === i.value && l < h.value))
      ) {
        n.x = u.x;
        n.y = u.y;
        n.width = t;
        n.height = e;
        i.value = s;
        h.value = l;
      }

      if (
        this.allowRotate &&
        u.width >= e &&
        u.height >= t &&
        ((o = Math.abs(u.width - e)),
        (s = Math.abs(u.height - t)),
        (l = Math.min(o, s)),
        (r = Math.max(o, s)),
        l < i.value || (l === i.value && r < h.value))
      ) {
        n.x = u.x;
        n.y = u.y;
        n.width = e;
        n.height = t;
        i.value = l;
        h.value = r;
      }
    }
    return n;
  },
  _findPositionForNewNodeBestLongSideFit(t, e, i, h) {
    var a;
    var n;
    var o;
    var s;
    var l;
    var r = this.freeRectangles;
    var u = new Rect();
    h.value = Infinity;
    for (var c = 0; c < r.length; c++) {
      if (
        (a = r[c]).width >= t &&
        a.height >= e &&
        ((n = Math.abs(a.width - t)),
        (o = Math.abs(a.height - e)),
        (s = Math.min(n, o)),
        (l = Math.max(n, o)) < h.value || (l === h.value && s < i.value))
      ) {
        u.x = a.x;
        u.y = a.y;
        u.width = t;
        u.height = e;
        i.value = s;
        h.value = l;
      }

      if (
        this.allowRotate &&
        a.width >= e &&
        a.height >= t &&
        ((n = Math.abs(a.width - e)),
        (o = Math.abs(a.height - t)),
        (s = Math.min(n, o)),
        (l = Math.max(n, o)) < h.value || (l === h.value && s < i.value))
      ) {
        u.x = a.x;
        u.y = a.y;
        u.width = e;
        u.height = t;
        i.value = s;
        h.value = l;
      }
    }
    return u;
  },
  _findPositionForNewNodeBestAreaFit(t, e, i, h) {
    var a;
    var n;
    var o;
    var s = this.freeRectangles;
    var l = new Rect();
    var r = t * e;
    i.value = Infinity;
    for (var u = 0; u < s.length; u++) {
      var c = s[u];
      var d = c.width * c.height - r;

      if (
        c.width >= t &&
        c.height >= e &&
        ((a = c.width - t),
        (n = c.height - e),
        (o = Math.min(a, n)),
        d < i.value || (d === i.value && o < h.value))
      ) {
        l.x = c.x;
        l.y = c.y;
        l.width = t;
        l.height = e;
        h.value = o;
        i.value = d;
      }

      if (
        this.allowRotate &&
        c.width >= e &&
        c.height >= t &&
        ((a = c.width - e),
        (n = c.height - t),
        (o = Math.min(a, n)),
        d < i.value || (d === i.value && o < h.value))
      ) {
        l.x = c.x;
        l.y = c.y;
        l.width = e;
        l.height = t;
        h.value = o;
        i.value = d;
      }
    }
    return l;
  },
  _findPositionForNewNodeLeftoverArea(t, e, i, h) {
    var a;
    var n;
    var o;
    var s;
    var l;
    var r = this.freeRectangles;
    var u = new Rect();
    i.value = 0;
    for (var c = (h.value = 0); c < r.length; c++) {
      l = (a = r[c]).width * a.height - t * e;

      if (
        a.width >= t &&
        a.height >= e &&
        ((n = Math.abs(a.width - t)),
        (o = Math.abs(a.height - e)),
        (s = Math.min(n, o)),
        l > i.value || (l === i.value && s > h.value))
      ) {
        u.x = a.x;
        u.y = a.y;
        u.width = t;
        u.height = e;
        h.value = s;
        i.value = l;
      }

      if (
        this.allowRotate &&
        a.width >= e &&
        a.height >= t &&
        ((n = Math.abs(a.width - e)),
        (o = Math.abs(a.height - t)),
        (s = Math.min(n, o)),
        l > i.value || (l === i.value && s > h.value))
      ) {
        u.x = a.x;
        u.y = a.y;
        u.width = e;
        u.height = t;
        h.value = s;
        i.value = l;
      }
    }
    i.value = this.binWidth * this.binHeight - i.value;
    h.value = Math.min(this.binWidth, this.binHeight) - h.value;
    return u;
  },
  _commonIntervalLength(t, e, i, h) {
    return e < i || h < t ? 0 : Math.min(e, h) - Math.max(t, i);
  },
  _contactPointScoreNode(t, e, i, h) {
    var a;
    var n = this.usedRectangles;
    var o = 0;

    if (t === 0 || t + i === this.binWidth) {
      o += h;
    }

    if (e === 0 || e + h === this.binHeight) {
      o += i;
    }

    for (var s = 0; s < n.length; s++) {
      if ((a = n[s]).x === t + i || a.x + a.width === t) {
        o += this._commonIntervalLength(a.y, a.y + a.height, e, e + h);
      }

      if (a.y === e + h || a.y + a.height === e) {
        o += this._commonIntervalLength(a.x, a.x + a.width, t, t + i);
      }
    }
    return o;
  },
  _findPositionForNewNodeContactPoint(t, e, i) {
    var h;
    var a;
    var n = this.freeRectangles;
    var o = new Rect();
    i.value = -1;
    for (var s = 0; s < n.length; s++) {
      if (
        (h = n[s]).width >= t &&
        h.height >= e &&
        (a = this._contactPointScoreNode(h.x, h.y, t, e)) > i.value
      ) {
        o.x = h.x;
        o.y = h.y;
        o.width = t;
        o.height = e;
        i = a;
      }

      if (
        this.allowRotate &&
        h.width >= e &&
        h.height >= t &&
        (a = this._contactPointScoreNode(h.x, h.y, e, t)) > i.value
      ) {
        o.x = h.x;
        o.y = h.y;
        o.width = e;
        o.height = t;
        i.value = a;
      }
    }
    return o;
  },
  _splitFreeNode(t, e) {
    var i;
    var h = this.freeRectangles;
    return !(
      e.x >= t.x + t.width ||
      e.x + e.width <= t.x ||
      e.y >= t.y + t.height ||
      e.y + e.height <= t.y ||
      (e.y > t.y &&
        e.y < t.y + t.height &&
        (((i = t.clone()).height = e.y - t.y), h.push(i)),
      e.y + e.height < t.y + t.height &&
        (((i = t.clone()).y = e.y + e.height),
        (i.height = t.y + t.height - i.y),
        h.push(i)),
      e.x > t.x &&
        e.x < t.x + t.width &&
        (((i = t.clone()).width = e.x - t.x), h.push(i)),
      e.x + e.width < t.x + t.width &&
        (((i = t.clone()).x = e.x + e.width),
        (i.width = t.x + t.width - i.x),
        h.push(i)),
      0)
    );
  },
  _pruneFreeList() {
    for (var t = this.freeRectangles, e = 0; e < t.length; e++) {
      for (var i = e + 1; i < t.length; i++) {
        if (Rect.isContainedIn(t[e], t[i])) {
          t.splice(e, 1);
          e--;
          break;
        }

        if (Rect.isContainedIn(t[i], t[e])) {
          t.splice(i, 1);
          i--;
        }
      }
    }
  },
};

MaxRectsBinPack.heuristices = {
  BestShortSideFit,
  BestLongSideFit,
  BestAreaFit,
  BottomLeftRule,
  ContactPointRule,
  LeftoverArea,
};

module.exports = MaxRectsBinPack;
