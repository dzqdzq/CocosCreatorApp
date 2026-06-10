var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, i = r) => {
        Object.defineProperty(e, i, {
          enumerable: true,
          get() {
            return t[r];
          },
        });
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
  ((e) => {
    if (e && e.__esModule) {
      return e;
    }
    var t = {};
    if (e != null) {
      for (var r in e) {
        if (r !== "default" && Object.prototype.hasOwnProperty.call(e, r)) {
          __createBinding(t, e, r);
        }
      }
    }
    __setModuleDefault(t, e);
    return t;
  });

Object.defineProperty(exports, "__esModule", { value: true });
exports.transformPluginScript = undefined;
const babel = __importStar(require("@babel/core"));
async function transformPluginScript(e, t) {
  t = await babel.transformAsync(e, { plugins: [[wrapPluginScript(t)]] });
  return t ? { code: t.code } : { code: e };
}
exports.transformPluginScript = transformPluginScript;
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
