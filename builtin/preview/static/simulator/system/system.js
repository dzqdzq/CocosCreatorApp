
import { systemJSPrototype } from 'systemjs-source/system-core.js';

import { resolveImportMap, resolveIfNotPlainOrUrl, resolveAndComposeImportMap } from 'systemjs-source/common.js';

const baseUrl = 'no-schema:/'

const importMap = { imports: {}, scopes: {} };

function fetchText (url) {
    return new Promise(resolve => {
        let xhr = new XMLHttpRequest()
        xhr.open('GET', url, true);
        xhr.onload = (() => {
            resolve(xhr.response);
        });
        xhr.send(null);
    });
}

async function fetchJson (url) {
    return JSON.parse((await fetchText(url)));
}

/**
 * Extends the import map.
 * @param {*} json 
 * @param {*} location 
 */
function extendsImportMap(json, location) {
    const importMapUrl = resolveIfNotPlainOrUrl(location, baseUrl);
    resolveAndComposeImportMap(json, importMapUrl || location, importMap);
}

systemJSPrototype.extendsImportMap = extendsImportMap;

/**
 * Resolve.
 * @param {*} id 
 * @param {*} parentUrl 
 */
systemJSPrototype.resolve = function(id, parentUrl) {
    parentUrl = parentUrl || baseUrl;
    return resolveImportMap(importMap, resolveIfNotPlainOrUrl(id, parentUrl) || id, parentUrl) || throwUnresolved(id, parentUrl);
};

function throwUnresolved(id, parentUrl) {
    throw new Error(`Unresolved id: ${id} from parentUrl: ${parentUrl}`);
}

/**
 * Instantiate.
 * @param {*} url 
 * @param {*} firstParentUrl 
 */
systemJSPrototype.instantiate = async function (url, firstParentUrl) {
    let loader = this;
    if (url.startsWith(baseUrl)) {
        require(url.slice(baseUrl.length));
        let register = loader.getRegister();
        if (!register) {
            throw new Error(`Module ${url} is an invalid SystemJS module.`);
        }
        return register;
    } else if (url.startsWith('http:') || url.startsWith('https:')) {
        let js = await fetchText(url);
        try {
            window.eval(js + `\n//# sourceURL=${url}`);
        } catch (err) {
            console.error(err);
        }
        let register = loader.getRegister();
        if (!register) {
            throw new Error(`Module ${url} is an invalid SystemJS module.`);
        }
        return register;
    }

    throwInstantiateError(url, firstParentUrl);
}

function throwInstantiateError(url, firstParentUrl) {
    throw new Error(`Unable to instantiate ${url} from ${firstParentUrl}`);
};

systemJSPrototype.prepareImport = function () {
    // do nothing
}