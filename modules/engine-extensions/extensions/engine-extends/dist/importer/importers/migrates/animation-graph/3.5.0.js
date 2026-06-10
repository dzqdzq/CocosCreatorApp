function migrateVariables(e) {
  e.visitTypedObject("cc.animation.Variable", (e) => {
    switch (e._type) {
      case VariableType.BOOLEAN:
      case VariableType.INTEGER:
      default:
      case VariableType.FLOAT: {
        e.__type__ = "cc.animation.PlainVariable";
        break;
      }
      case VariableType.TRIGGER: {
        e.__type__ = "cc.animation.TriggerVariable";
        delete e._type;
        var e_value = e._value;
        delete e._value;

        if (e_value !== undefined) {
          e._flags = e_value ? 1 : 0;
        }
      }
    }
  });
}
var VariableType;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariableType = undefined;
exports.migrateVariables = undefined;
exports.migrateVariables = migrateVariables;

((e) => {
  e[(e.FLOAT = 0)] = "FLOAT";
  e[(e.BOOLEAN = 1)] = "BOOLEAN";
  e[(e.TRIGGER = 2)] = "TRIGGER";
  e[(e.INTEGER = 3)] = "INTEGER";
})((VariableType = exports.VariableType || (exports.VariableType = {})));
