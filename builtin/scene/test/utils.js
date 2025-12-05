

exports.queryNode = async function (uuid) {
    return Editor.Message.request('scene', 'query-node', uuid);
}

exports.setProperty = async function (options) {
    return Editor.Message.request('scene', 'set-property', options);
}

exports.queryNodeTree = async function () {
    return Editor.Message.request('scene', 'query-node-tree');
}