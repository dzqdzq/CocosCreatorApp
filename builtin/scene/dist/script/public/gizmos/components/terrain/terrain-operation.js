Object.defineProperty(exports, "__esModule", { value: true });

exports.TerrainWeightUndoRedo = undefined;
exports.TerrainBlockLayerData = undefined;
exports.TerrainWeightOperation = undefined;
exports.TerrainLayerUndoRedo = undefined;
exports.TerrainLayerOperation = undefined;
exports.TerrainWeightData = undefined;
exports.TerrainHeightUndoRedo = undefined;
exports.TerrainHeightOperation = undefined;
exports.TerrainHeightData = undefined;

const cc_1 = require("cc");
const undo_1 = require("../../../../export/undo");
class TerrainHeightData {
  x = 0;
  y = 0;
  value = 0;
}
exports.TerrainHeightData = TerrainHeightData;
class TerrainHeightOperation extends undo_1.SceneUndoCommand {
  _terrain;
  constructor(e) {
    super();
    this._terrain = e;
  }
  set terrain(e) {
    this._terrain = e;
  }
  get terrain() {
    return this._terrain;
  }
  static addChangeList(e, r) {
    for (const t of e) {
      if (t === r) {
        return;
      }
    }
    e.push(r);
  }
  data = new Array();
  push(e, r, t) {
    for (const i of this.data) {
      if (i.x === e && i.y === r) {
        return;
      }
    }
    var a = new TerrainHeightData();
    a.x = e;
    a.y = r;
    a.value = t;
    this.data.push(a);
  }
  apply() {
    if (this._terrain && this.data.length != 0) {
      let t = this.data[0].x;
      let a = this.data[0].x;
      let e = this.data[0].y;
      let i = this.data[0].y;
      for (const s of this.data) {
        this._terrain.setHeight(s.x, s.y, s.value);
        t = Math.min(t, s.x);
        a = Math.max(a, s.x);
        e = Math.min(e, s.y);
        i = Math.max(i, s.y);
      }

      if (t > 0) {
        --t;
      }

      if (a < this._terrain.info.vertexCount[0] - 1) {
        a += 1;
      }

      if (e > 0) {
        --e;
      }

      i < this._terrain.info.vertexCount[1] - 1 && i;
      for (let r = e; r <= i; ++r) {
        for (let e = t; e <= a; ++e) {
          var n = this._terrain._calcNormal(e, r);
          this._terrain._setNormal(e, r, n);
        }
      }
      var r = new Array();
      var o = new cc_1.Rect(t, e, a - t, i - e);
      for (const h of this._terrain.getBlocks()) {
        if (h.getRect().intersects(o)) {
          TerrainHeightOperation.addChangeList(r, h);
        }
      }
      for (const c of r) {
        c._updateHeight();
        c.update();
      }
    }
  }
}
class TerrainHeightUndoRedo extends (exports.TerrainHeightOperation =
  TerrainHeightOperation) {
  redoOperations = [];
  async undo() {
    this.apply();
  }
  async redo() {
    this.redoOperations.forEach((e) => {
      e.apply();
    });
  }
}
exports.TerrainHeightUndoRedo = TerrainHeightUndoRedo;
class TerrainWeightData {
  x = 0;
  y = 0;
  value = new cc_1.Vec4();
}
exports.TerrainWeightData = TerrainWeightData;
class TerrainLayerOperation {
  _terrain;
  _layers = [];
  constructor(e) {
    this._terrain = e;
  }
  set terrain(e) {
    this._terrain = e;
  }
  get terrain() {
    return this._terrain;
  }
  setLayers() {
    for (let e = 0; e < this.terrain._layers.length; e++) {
      this._layers[e] = this.terrain._layers[e];
    }
  }
  apply() {
    for (let e = 0; e < this._layers.length; e++) {
      this.terrain.setLayer(e, this._layers[e]);
    }
  }
}
class TerrainLayerUndoRedo extends (exports.TerrainLayerOperation =
  TerrainLayerOperation) {
  redoOperations = [];
  undo() {
    this.apply();
  }
  redo() {
    this.redoOperations.forEach((e) => {
      e.apply();
    });
  }
}
exports.TerrainLayerUndoRedo = TerrainLayerUndoRedo;
class TerrainWeightOperation extends undo_1.SceneUndoCommand {
  _terrain;
  constructor(e) {
    super();
    this._terrain = e;
  }
  set terrain(e) {
    this._terrain = e;
  }
  get terrain() {
    return this._terrain;
  }
  static addChangeList(e, r) {
    for (const t of e) {
      if (t === r) {
        return;
      }
    }
    e.push(r);
  }
  data = new Array();
  push(e, r, t) {
    for (const i of this.data) {
      if (i.x === e && i.y === r) {
        return;
      }
    }
    var a = new TerrainWeightData();
    a.x = e;
    a.y = r;
    a.value = t;
    this.data.push(a);
  }
  apply() {
    if (this._terrain) {
      for (const t of this.data) {
        this._terrain.setWeight(t.x, t.y, t.value);
      }
      var e = new Array();
      for (const a of this._terrain.getBlocks()) {
        var r = new cc_1.Rect();
        r.x = a.getIndex()[0] * this._terrain.info.weightMapSize;
        r.y = a.getIndex()[1] * this._terrain.info.weightMapSize;
        r.width = this._terrain.info.weightMapSize;
        r.height = this._terrain.info.weightMapSize;
        for (const i of this.data) {
          if (r.contains(new cc_1.Vec2(i.x, i.y))) {
            TerrainWeightOperation.addChangeList(e, a);
          }
        }
      }
      for (const n of e) {
        n._updateWeightMap();
        n.update();
      }
    }
  }
}
exports.TerrainWeightOperation = TerrainWeightOperation;
class TerrainBlockLayerData {
  block;
  layers = [-1, -1, -1, -1];
  constructor(e, r) {
    this.block = e;
    this.layers.length = r.length;
    for (let e = 0; e < r.length; ++e) {
      this.layers[e] = r[e];
    }
  }
}
exports.TerrainBlockLayerData = TerrainBlockLayerData;
class TerrainWeightUndoRedo extends TerrainWeightOperation {
  undoBlockLayers = new Array();
  redoBlockLayers = new Array();
  redoOperations = [];
  async undo() {
    this.apply();
  }
  async redo() {
    for (const t of this.redoBlockLayers) {
      var { block, layers } = t;

      block.setLayer(0, layers[0]);
      block.setLayer(1, layers[1]);
      block.setLayer(2, layers[2]);
      block.setLayer(3, layers[3]);
    }
    this.redoOperations.forEach((e) => {
      e.apply();
    });
  }
  pushBlock(e, r, t) {
    for (const a of this.redoBlockLayers) {
      if (a.block === e) {
        a.layers.length = t.length;
        for (let e = 0; e < t.length; ++e) {
          a.layers[e] = t[e];
        }
        return;
      }
    }
    this.redoBlockLayers.push(new TerrainBlockLayerData(e, t));
    for (const i of this.undoBlockLayers) {
      if (i.block === e) {
        return;
      }
    }
    this.undoBlockLayers.push(new TerrainBlockLayerData(e, r));
  }
  apply() {
    if (this._terrain) {
      for (const t of this.undoBlockLayers) {
        var { block, layers } = t;

        block.setLayer(0, layers[0]);
        block.setLayer(1, layers[1]);
        block.setLayer(2, layers[2]);
        block.setLayer(3, layers[3]);
      }
      super.apply();
    }
  }
}
exports.TerrainWeightUndoRedo = TerrainWeightUndoRedo;
