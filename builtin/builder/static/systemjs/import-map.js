import { systemJSPrototype } from "systemjs-source/system-core.js";
import {
  resolveImportMap,
  resolveIfNotPlainOrUrl,
  resolveAndComposeImportMap,
} from "systemjs-source/common.js";
import { baseUrl } from "./base-url.js";
const importMap = { imports: {}, scopes: {} };
function setImportMap(o, r) {
  resolveAndComposeImportMap(o, r || baseUrl, importMap);
}
function throwUnresolved(o, r) {
  throw new Error(`Unresolved id: ${o} from parentUrl: ` + r);
}
systemJSPrototype.resolve = (o, r) => {
  r = r || baseUrl;

  return (
    resolveImportMap(importMap, resolveIfNotPlainOrUrl(o, r) || o, r) ||
    throwUnresolved(o, r)
  );
};
export { setImportMap };
