Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultStateTransition = undefined;
exports.Transition = undefined;
class Transition {
  fromState;
  toState;
  testConditionFunc;
  constructor(t, n, e = null) {
    this.fromState = t;
    this.toState = n;
    this.testConditionFunc = e;
  }
  async testCondition(t = 0) {
    return this.testConditionFunc === null || this.testConditionFunc();
  }
  async Complete() {
    this.toState.fromState = this.fromState;
  }
}
class DefaultStateTransition extends (exports.Transition = Transition) {
  constructor(t, n, e = null) {
    super(t, n, e);
  }
}
exports.DefaultStateTransition = DefaultStateTransition;
