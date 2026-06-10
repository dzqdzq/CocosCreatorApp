Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateAnimationGraph_3_8_0 = migrateAnimationGraph_3_8_0;
const TYPE_ID_BINARY_CONDITION = "cc.animation.BinaryCondition";
function migrateAnimationGraph_3_8_0(i) {
  migrateTransitionBindings(i);
}
function migrateTransitionBindings(i) {
  const s = (() => {
    let a;

    i.visitTypedObject("cc.animation.AnimationGraph", (i) => {
      if (a) {
        throw new Error(
          "Migration error: the old serialized animation graph assets has more than one animation graph objects!"
        );
      }
      a = i;
    });

    if (a) {
      return a;
    }

    throw new Error(
      "Migration error: the old serialized animation graph assets has no any animation graph object!"
    );
  })();
  i.visitTypedObject(TYPE_ID_BINARY_CONDITION, (i) => {
    const { lhs, rhs, ...n } = i;
    if ("" !== (rhs.variable ?? "")) {
      throw new Error(
        "Migration error: the old serialized binary condition is asserted to have only constant value but instead saw " +
          rhs.variable
      );
    }
    let TCBindingValueType_FLOAT = TCBindingValueType.FLOAT;
    var t = s._variables[lhs.variable];
    if (t) {
      let i;
      o = i = i || {};
      o[(o.FLOAT = 0)] = "FLOAT";
      let rhs = !(o[(o.INTEGER = 3)] = "INTEGER");

      if (t.__type__ === "cc.animation.PlainVariable") {
        if ((o = t._type ?? 0) === i.FLOAT) {
          TCBindingValueType_FLOAT = TCBindingValueType.FLOAT;
          rhs = true;
        } else if (o === i.INTEGER) {
          TCBindingValueType_FLOAT = TCBindingValueType.INTEGER;
          rhs = true;
        }
      }

      if (!rhs) {
        console.debug(
          `The condition's lhs variable ${lhs.variable} was previously ` +
            "bound to a variable with mismatched type: " +
            JSON.stringify(t, undefined, 2)
        );
      }
    } else {
      console.debug(
        `The condition's lhs variable ${lhs.variable} was previously not bound.`
      );
    }
    var o = {
      ...n,
      lhs: lhs.value,
      lhsBinding: {
        __type__: "cc.animation.TCVariableBinding",
        type: TCBindingValueType_FLOAT,
        variableName: lhs.variable,
      },
      rhs: i.rhs.value,
    };
    clearEntries(i);
    Object.assign(i, o);
  });
}
var TCBindingValueType;
function clearEntries(i) {
  for (const a in i) {
    delete i[a];
  }
}
!((i) => {
  i[(i.FLOAT = 0)] = "FLOAT";
  i[(i.INTEGER = 3)] = "INTEGER";
})((TCBindingValueType = TCBindingValueType || {}));
