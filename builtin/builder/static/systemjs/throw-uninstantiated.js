import { systemJSPrototype } from "systemjs-source/system-core.js";
systemJSPrototype.instantiate = (t, o) => {
  throw new Error(`Unable to instantiate ${t} from ` + o);
};
