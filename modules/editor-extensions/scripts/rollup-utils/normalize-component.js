function normalizeComponent(e, n, t, o, r, s, i, a, d, l) {
  if (typeof i != "boolean") {
    d = a;
    a = i;
    i = false;
  }

  var c = typeof t == "function" ? t.options : t;

  if (
    e &&
    e.render &&
    ((c.render = e.render),
    (c.staticRenderFns = e.staticRenderFns),
    (c._compiled = true),
    r)
  ) {
    c.functional = true;
  }

  if (o) {
    c._scopeId = o;
  }

  let p;

  if (s) {
    p = function (e) {
      if (
        !(e =
          e ||
          (this.$vnode && this.$vnode.ssrContext) ||
          (this.parent &&
            this.parent.$vnode &&
            this.parent.$vnode.ssrContext)) &&
        typeof __VUE_SSR_CONTEXT__ != "undefined"
      ) {
        e = __VUE_SSR_CONTEXT__;
      }

      if (n) {
        n.call(this, d(e));
      }

      if (e && e._registeredComponents) {
        e._registeredComponents.add(s);
      }
    };

    c._ssrRegister = p;
  } else if (n) {
    p = i
      ? function (e) {
          var t =
            (this.$root.$el && this.$root.$el.parentNode) ||
            (this.$root.$options.el && this.$root.$options.el.parentNode);
          n.call(this, l(e, t));
        }
      : function (e) {
          n.call(this, a(e));
        };
  }

  if (p) {
    if (c.functional) {
      const c_render = c.render;
      c.render = (e, t) => {
        p.call(t);
        return c_render(e, t);
      };
    } else {
      e = c.beforeCreate;
      c.beforeCreate = e ? [].concat(e, p) : [p];
    }
  }

  return t;
}
module.exports = normalizeComponent;
