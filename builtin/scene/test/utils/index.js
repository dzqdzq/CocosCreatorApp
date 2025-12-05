const { expect } = require('chai');
exports.prefab = require('./prefab-test').prefab;

exports.queryNode = async function(uuid) {
    return Editor.Message.request('scene', 'query-node', uuid);
};

exports.setProperty = async function(options) {
    return Editor.Message.request('scene', 'set-property', options);
};

exports.queryNodeTree = async function() {
    return Editor.Message.request('scene', 'query-node-tree');
};

exports.queryNodeUUidByAsset = async function(uuid) {
    const ret = await exports.requestScene( 'query-nodes-by-asset-uuid', uuid);
    expect(ret.length).to.equal(1);
    return ret[0];
};

exports.delay = async function(time) {
    await new Promise((resolve) => {
        setTimeout(function() {
            resolve();
        }, time);
    });
};

exports.request = Editor.Message.request.bind(Editor.Message);

exports.requestScene = async (method, ...args) => {
    return await Editor.Message.request('scene', method, ...args);
};