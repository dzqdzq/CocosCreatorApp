var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, i = r) => {
        var n = Object.getOwnPropertyDescriptor(t, r);

        if (
          !n ||
          (!("get" in n) ? !n.writable && !n.configurable : t.__esModule)
        ) {
          n = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, i, n);
      }
    : (e, t, r, i) => {
        e[(i = i === undefined ? r : i)] = t[r];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, t) => {
        Object.defineProperty(e, "default", { enumerable: true, value: t });
      }
    : (e, t) => {
        e.default = t;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var n = (e) =>
      (n =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var r = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              r[r.length] = t;
            }
          }
          return r;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var r = n(e), i = 0; i < r.length; i++) {
          if (r[i] !== "default") {
            __createBinding(t, e, r[i]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.transformPluginScript = transformPluginScript;
const babel = __importStar(require("@babel/core"));
async function transformPluginScript(e, t) {
  var r = !((e.length > 500000) /* 5e5 */);

  var r = await babel.transformAsync(e, {
    compact: r,
    plugins: [[wrapPluginScript(t)]],
  });

  return r ? { code: r.code } : { code: e };
}
const wrapPluginScript = (a) => {
  const l = babel.template.statements(
    `(function(root) {
    %%HIDE_COMMONJS%%;
    %%HIDE_AMD%%;
    %%SIMULATE_GLOBALS%%;
    (function() {
        %%ORIGINAL_CODE%%
    }).call(root);
})(
    // The environment-specific global.
    (function() {
        if (typeof globalThis !== 'undefined') return globalThis;
        if (typeof self !== 'undefined') return self;
        if (typeof window !== 'undefined') return window;
        if (typeof global !== 'undefined') return global;
        if (typeof this !== 'undefined') return this;
        return {};
    }).call(this),
);
`,
    { preserveComments: true, syntacticPlaceholders: true }
  );
  return {
    visitor: {
      Program: (e, t) => {
        let r;

        if (a.hideCommonJs) {
          r = babel.types.variableDeclaration(
            "var",
            ["exports", "module", "require"].map((e) =>
              babel.types.variableDeclarator(
                babel.types.identifier(e),
                babel.types.identifier("undefined")
              )
            )
          );
        }

        let i;

        if (a.hideAmd) {
          i = babel.types.variableDeclaration(
            "var",
            ["define"].map((e) =>
              babel.types.variableDeclarator(
                babel.types.identifier(e),
                babel.types.identifier("undefined")
              )
            )
          );
        }

        let n;

        if (a.simulateGlobals && a.simulateGlobals.length !== 0) {
          n = babel.types.variableDeclaration(
            "var",
            a.simulateGlobals.map((e) =>
              babel.types.variableDeclarator(
                babel.types.identifier(e),
                babel.types.identifier("root")
              )
            )
          );
        }

        e.node.body = l({
          ORIGINAL_CODE: e.node.body,
          SIMULATE_GLOBALS: n,
          HIDE_COMMONJS: r,
          HIDE_AMD: i,
        });
      },
    },
  };
};
