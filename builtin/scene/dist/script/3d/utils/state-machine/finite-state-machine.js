Object.defineProperty(exports, "__esModule", { value: true });
const transition_1 = require("./transition");
class FiniteStateMachine {
  currentState;
  _states;
  _transitions;
  constructor(t) {
    if (t.length < 1) {
      console.error("A FiniteStateMachine needs at least 1 state");
    }

    this._transitions = new Map();

    (this._states = t).forEach((t) => {
      this._transitions.set(t, new Map());
    });
  }
  addTransition(t, e, n, s) {
    if (this._states.includes(t)) {
      if (this._states.includes(e)) {
        if (typeof s == "function") {
          this._transitions
            .get(t)
            ?.set(n, new transition_1.DefaultStateTransition(t, e, s));
        } else {
          this._transitions
            .get(t)
            ?.set(n, s ?? new transition_1.DefaultStateTransition(t, e));
        }
      } else {
        console.error("unknown to state");
      }
    } else {
      console.error("unknown from state");
    }

    return this;
  }
  Begin(t) {
    if (t) {
      if (this._states.includes(t)) {
        this.currentState = t;
      } else {
        console.error("unknown first state");
      }
    }

    return this;
  }
  async issueCommand(t, e = {}) {
    var n = this._transitions.get(this.currentState);
    if (n?.has(t)) {
      n = n.get(t);
      if (!n) {
        return false;
      }
      if (await n.testCondition(e)) {
        await n.Complete();
        await this.currentState.exit();
        this.currentState = n.toState;
        await this.currentState.enter(e);
        return true;
      }
    }
    return false;
  }
}
exports.default = FiniteStateMachine;
