const { expect } = require("chai");
const { existsSync } = require("fs");
const { removeSync } = require("fs-extra");
const { join } = require("path");
exports.prefab = require("./prefab-test").prefab;

exports.queryNode = async (uuid) =>
  Editor.Message.request("scene", "query-node", uuid);

exports.setProperty = async (options) =>
  Editor.Message.request("scene", "set-property", options);

exports.queryNodeTree = async () =>
  Editor.Message.request("scene", "query-node-tree");

exports.queryNodeUUidByAsset = async (uuid) => {
  const ret = await exports.requestScene("query-nodes-by-asset-uuid", uuid);
  expect(ret.length).to.equal(1);
  return ret[0];
};

exports.delay = async (time) => {
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
};

exports.request = Editor.Message.request.bind(Editor.Message);

exports.requestScene = async (method, ...args) =>
  await Editor.Message.request("scene", method, ...args);

exports.createAsset = async (info) =>
  await Editor.Message.request("asset-db", "new-asset", info);

exports.getNodeIDByName = (node, name) => {
  if (!node) {
    return null;
  }
  if (node.name === name) {
    return node;
  }
  if (!node.children) {
    return null;
  }

  for (const child of node.children) {
    const target = exports.getNodeIDByName(child, name);
    if (target) {
      return target;
    }
  }
  return null;
};

exports.getTestDir = () => `db://assets/__test__`;

exports.clearTestDir = async () => {
  const meta = await Editor.Message.request(
    "asset-db",
    "query-asset-meta",
    exports.getTestDir()
  );

  if (meta) {
    await Editor.Message.request(
      "asset-db",
      "delete-asset",
      exports.getTestDir()
    );
  }
};

exports.isMultiSceneMode = async () =>
  Boolean(await Editor.Profile.getConfig("scene", "scene.multi"));
/**
 * 适配单，多场景的 close-scene 接口
 * @returns {Promise<boolean>}
 */
exports.adaptCloseCurrentScene = async () => {
  if (await exports.isMultiSceneMode()) {
    const curFocus = await exports.requestScene("multi-scene-focus-query");
    return exports.requestScene("multi-close-scene", curFocus);
  }
  return await exports.requestScene("close-scene");
};
