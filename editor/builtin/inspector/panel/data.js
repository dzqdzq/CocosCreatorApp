"use strict";
var e = [];

exports.add = function (r) {
  if (r) {
    var a = JSON.parse(r);
    e.push(a);
  }
};

exports.get = function () {
  if (!e) {
    return null;
  }
  var r = e[0];
  if (!r || !r.value) {
    return null;
  }
  e.forEach((e) => {
    var r = {};
    e.value.__comps__.forEach((e) => {
      var a = e.type;

      if (!r[a]) {
        r[a] = 0;
      }

      e.__orderedType = a + r[a];
      r[a] += 1;
    });
  });
  var a = {
    types: {},
    value: {
      uuid: e.map((e) => e.value.uuid).join("^"),
      uuids: e.map((e) => e.value.uuid),
      __type__: r.value.__type__,
      __comps__: [],
    },
  };
  e.every((e) => {
    Object.keys(e.types).forEach((r) => {
      if (!a.types[r]) {
        a.types[r] = e.types[r];
      }
    });
  });
  var t = ["__type__", "uuid", "__comps__", "__prefab__"];

  Object.keys(r.value).forEach((r) => {
    if (-1 === t.indexOf(r)) {
      var _ = [];

      if (e.every((e) => {
        var a = e.value[r];
        _.push(a);
        return !!a;
      })) {
        a.value[r] = u(_);
      }
    }
  });

  if (1 === e.length &&
    r.value.__prefab__) {
    a.value.__prefab__ = r.value.__prefab__;
  }

  r.value.__comps__.forEach((r) => {
    if (
      e.every((e) => {
        return e.value.__comps__.some((e) => e.type === r.type);
      })
    ) {
      var t = false;

      var _ = e.map((e) => {
        var a;

        e.value.__comps__.some((e) => {
          if (e.__orderedType === r.__orderedType) {
            a = e;
          }
        });

        if (!a) {
          t = true;
        }

        return a;
      });

      if (!t) {
        a.value.__comps__.push(
          (function (e, r, a) {
            var t = a[r];
            var _ = { type: r, value: {} };

            Object.keys(t.properties || {}).forEach((r) => {
              var a = e.map((e) =>
                JSON.parse(JSON.stringify(e.value[r]))
              );
              _.value[r] = u(a);
            });

            return _;
          })(_, r.type, a.types)
        );
      }
    }
  });

  a.multi = e.length > 1;
  return a;
};

exports.onSendBegin = null;
exports.onSendEnd = null;
var r = {};

exports.change = function (u, _, n, p) {
  if (e && e[0]) {
    var o = e[0].types[n];

    e.forEach((e) => {
      var t = (function (e, r) {
          if (!r) {
            return e;
          }
          var a = r.match(/target\.__comps__\[(\d+)\]/);
          return a ? e.value.__comps__[a[1]] : null;
        })(e, _);

      var l = (function (e, r, u, t) {
        if (e && r && -1 == a.indexOf(e)) {
          var _ = {};

          Object.keys(r).forEach((e) => {
            if (null == t[e] || Array.isArray(t[e])) {
              _[e] = u.value[e];
            } else {
              _[e] = t[e];
            }
          });

          return _;
        }
        return t;
      })(n, o ? o.properties : null, t.value[u], p);

      var v = t.value.uuid.value || t.value.uuid;
      let s = { id: v, path: u, type: n, value: l, isSubProp: false };
      r[`${v}.${u}`] = s;
    });

    if (exports.onSendBegin) {
      exports.onSendBegin();
    }

    clearTimeout(t);

    t = setTimeout(() => {
      for (let e in r) {
        Editor.Ipc.sendToPanel("scene", "scene:set-property", r[e]);
        delete r[e];
      }

      if (exports.onSendEnd) {
        exports.onSendEnd();
      }
    }, 200);
  }
};

var a = ["cc.Color", "cc.Node"];
function u(e) {
  var r = e[0];
  var a = { type: r.type, value: r.value, values: e.map((e) => e.value) };

  Object.keys(r).forEach((u) => {
    if ("type" != u &&
      "value" != u &&
      "values" != u &&
      e.every((e) => r[u] == e[u])) {
      a[u] = r[u];
    }
  });

  return a;
}

exports.clear = function () {
  e.length = 0;
};

var t = null;
