'use strict';

const { join } = require('path');

/**
 * 插件 register 的时候，触发这个钩子
 * 钩子内可以动态更改 package.json 内定义的数据
 * 
 * inspector 主动的查询了 engine 所在的文件夹
 * 并找到对应的 js 定义文件，将 inspector 模版增加到 package.json 里
 * 
 * TODO 在后续拆分计划中，所有数据都需要放到引擎侧
 * 
 * @param info 
 */
exports.register = async function(info) {
    const engine = await Editor.Message.request('engine', 'query-info');

    const panelAsset = join(engine.path, 'editor/inspector/contributions/asset.js');
    const panelNode = join(engine.path, 'editor/inspector/contributions/node.js');

    info.contributions.inspector.type.asset = panelAsset;
    info.contributions.inspector.type.node = panelNode;

    const { config: configAsset } = require(panelAsset);
    const { config: configNode } = require(panelNode);

    info.contributions.inspector.header.asset = configAsset.header;
    info.contributions.inspector.section.asset = configAsset.section;
    info.contributions.inspector.footer.asset = configAsset.footer;

    info.contributions.inspector.header.node = configNode.header ?? {};
    info.contributions.inspector.section.node = configNode.section ?? {};
    info.contributions.inspector.footer.node = configNode.footer ?? {};
};
