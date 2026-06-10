System.register(["cc"], function (e, t) {
  var n;
  var i;
  var c;

  var a =
    (this && this.__awaiter) ||
    ((e, c, a, s) =>
      new (a = a || Promise)((n, t) => {
        function r(e) {
          try {
            i(s.next(e));
          } catch (e) {
            t(e);
          }
        }
        function u(e) {
          try {
            i(s.throw(e));
          } catch (e) {
            t(e);
          }
        }
        function i(e) {
          var t;

          if (e.done) {
            n(e.value);
          } else {
            ((t = e.value) instanceof a
              ? t
              : new a((e) => {
                  e(t);
                })
            ).then(r, u);
          }
        }
        i((s = s.apply(e, c || [])).next());
      }));

  var s =
    (this && this.__generator) ||
    ((r, u) => {
      var i;
      var c;
      var a;

      var s = {
        label: 0,
        sent() {
          if (1 & a[0]) {
            throw a[1];
          }
          return a[1];
        },
        trys: [],
        ops: [],
      };

      var e = { next: t(0), throw: t(1), return: t(2) };

      if (typeof Symbol == "function") {
        e[Symbol.iterator] = function () {
          return this;
        };
      }

      return e;
      function t(n) {
        return (e) => {
          var t = [n, e];
          if (i) {
            throw new TypeError("Generator is already executing.");
          }

          while (s) {
            try {
              i = 1;

              if (
                c &&
                (a =
                  2 & t[0]
                    ? c.return
                    : t[0]
                    ? c.throw || ((a = c.return) && a.call(c), 0)
                    : c.next) &&
                !(a = a.call(c, t[1])).done
              ) {
                return a;
              }

              c = 0;

              switch ((t = a ? [2 & t[0], a.value] : t)[0]) {
                case 0:
                case 1: {
                  a = t;
                  break;
                }
                case 4: {
                  s.label++;
                  return { value: t[1], done: false };
                }
                case 5: {
                  s.label++;
                  c = t[1];
                  t = [0];
                  continue;
                }
                case 7: {
                  t = s.ops.pop();
                  s.trys.pop();
                  continue;
                }
                default: {
                  if (
                    !(a = (a = s.trys).length > 0 && a[a.length - 1]) &&
                    (t[0] === 6 || t[0] === 2)
                  ) {
                    s = 0;
                    continue;
                  }
                  if (t[0] === 3 && (!a || (t[1] > a[0] && t[1] < a[3]))) {
                    s.label = t[1];
                  } else if (t[0] === 6 && s.label < a[1]) {
                    s.label = a[1];
                    a = t;
                  } else {
                    if (!(a && s.label < a[2])) {
                      if (a[2]) {
                        s.ops.pop();
                      }

                      s.trys.pop();
                      continue;
                    }
                    s.label = a[2];
                    s.ops.push(t);
                  }
                }
              }

              t = u.call(r, s);
            } catch (e) {
              t = [6, e];
              c = 0;
            } finally {
              i = 0;
              a = 0;
            }
          }

          if (5 & t[0]) {
            throw t[1];
          }
          return { value: t[0] ? t[1] : undefined, done: true };
        };
      }
    });

  if (t) {
    t.id;
  }

  function r(u, t) {
    var e = this;
    u.output = u.input;

    a(e, undefined, undefined, function () {
      var t;
      var n;
      var r;
      return s(this, (e) => {
        switch (e.label) {
          case 0: {
            t = 0;
            e.label = 1;
          }
          case 1: {
            if (!(t < u.input.length)) {
              return [3, 6];
            }
            if (!(n = u.input[t]).uuid || n.isNative) {
              return [3, 5];
            }
            e.label = 2;
          }
          case 2: {
            e.trys.push([2, 4, , 5]);

            return [
              4,
              (function (r) {
                return a(this, undefined, undefined, function () {
                  var t;
                  var n;
                  return s(this, (e) => {
                    switch (e.label) {
                      case 0: {
                        if (r in i) {
                          return i[r] !== null
                            ? [2, i[r]]
                            : [
                                2,
                                new Promise((e) => {
                                  c[r] = c[r] || [];
                                  c[r].push(e);
                                }),
                              ];
                        }
                        i[r] = null;
                        e.label = 1;
                      }
                      case 1: {
                        e.trys.push([1, 4, , 5]);
                        return [4, fetch(`/query-extname/${r}`)];
                      }
                      case 2: {
                        return [4, e.sent().text()];
                      }
                      case 3: {
                        t = e.sent();
                        i[r] = t;

                        if (c[r]) {
                          c[r].forEach((e) => e(t));
                          c[r] = [];
                        }

                        return [2, t];
                      }
                      case 4: {
                        n = e.sent();
                        console.error(n);
                        return [2, (i[r] = "")];
                      }
                      case 5: {
                        return [2];
                      }
                    }
                  });
                });
              })(n.uuid),
            ];
          }
          case 3: {
            if ((r = e.sent())) {
              n.ext = r;
              n.url = n.url.replace(".json", r);
            }

            return [3, 5];
          }
          case 4: {
            e.sent();
            return [3, 5];
          }
          case 5: {
            t++;
            return [3, 1];
          }
          case 6: {
            return [2];
          }
        }
      });
    })
      .then(() => {
        t(null);
      })
      .catch((e) => {
        t(e);
      });
  }
  return {
    setters: [
      (e) => {
        n = e;
      },
    ],
    execute() {
      n.assetManager.pipeline.insert(r, 1);
      n.assetManager.fetchPipeline.insert(r, 1);
      i = {};
      c = {};
    },
  };
});
