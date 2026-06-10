var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });

const { join, basename } = require("path");

const { readdirSync } = require("fs-extra");

const transform_1 = __importDefault(require("./node/transform"));
const scene_1 = __importDefault(require("./node/scene"));

const GizmoDefines = {
  components: {
    _EditorHackSceneComponent_: scene_1.default,
    _EditorHackTransformComponent_: transform_1.default,
  },
  iconGizmo: {},
  persistentGizmo: {},
  methods: {},
};

readdirSync(join(__dirname, "./components")).forEach((e) => {
  e = basename(e);
  e = require("./components/" + e);

  if (
    e.name &&
    (e.SelectGizmo && (GizmoDefines.components[e.name] = e.SelectGizmo),
    e.IconGizmo && (GizmoDefines.iconGizmo[e.name] = e.IconGizmo),
    e.PersistentGizmo &&
      (GizmoDefines.persistentGizmo[e.name] = e.PersistentGizmo),
    e.methods)
  ) {
    GizmoDefines.methods[e.name] = e.methods;
  }
});

exports.default = GizmoDefines;
