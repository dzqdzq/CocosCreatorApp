'use strict';

const { expect } = require('chai');
const { requestScene, clearTestDir, createAsset, getTestDir, isMultiSceneMode } = require('./utils');

const testDBHeader = getTestDir();

const SCENE_INFO = [
    {
        'handler': 'scene',
        'target': `${testDBHeader}/scene-01.scene`,
        'template': 'db://internal/default_file_content/scene/default.scene',
        'overwrite': true,
        'uuid': '1ca11331-5909-4904-a346-b12fd0740551',
    },
    {
        'handler': 'prefab',
        'target': `${testDBHeader}/prefab-01.prefab`,
        'template': 'db://internal/default_file_content/prefab/default.prefab',
        'uuid': '3ca11331-5909-4904-a346-b12fd0740553',
        'overwrite': true,
    },
    {
        'handler': 'scene',
        'target': `${testDBHeader}/scene-02.scene`,
        'template': 'db://internal/default_file_content/scene/default.scene',
        'overwrite': true,
        'uuid': '2ca11331-5909-4904-a346-b12fd0740552',
    },
];

const TEST_NODE = {
    assetUuid: '30da77a1-f02d-4ede-aa56-403452ee7fde',
    name: 'testPrefab',
};

let isMultiScene = false;
describe('多场景编辑功能测试', () => {
    before(async () => {
        isMultiScene = await isMultiSceneMode();

        if (!isMultiScene) {
            return;
        }
        //清除测试目录
        await clearTestDir();

        const currentScene = await requestScene('query-current-scene');
        currentScene && await requestScene('multi-close-others', currentScene);

        //创建 3 个场景
        for (const info of SCENE_INFO) {
            await createAsset(info);
        }
    });

    after(async () => {
        //清除测试目录
        await clearTestDir();
    });

    describe('打开场景', async () => {
        if (!isMultiScene) {
            console.log('非多场景编辑模式，跳过测试');
            return;
        }
        for (const info of SCENE_INFO) {
            await Editor.Message.request('scene', 'open-scene', info.uuid);
        }

        it('场景是否正确打开', async () => {
            const scenes = await requestScene('multi-scene-query');
            let missOneScene = false;
            SCENE_INFO.findIndex((info) => {
                if (scenes.findIndex(scene => scene.uuid === info.uuid) === -1) {
                    missOneScene = true;
                }
            });

            expect(missOneScene).to.false;
        });
    });

    describe('focus 测试', async () => {
        if (!isMultiScene) {
            console.log('非多场景编辑模式，跳过测试');
            return;
        }
        const uuid = await requestScene('multi-scene-focus-query');
        expect(uuid).to.equal(SCENE_INFO[2].uuid);

        for (let info of SCENE_INFO) {
            await requestScene('multi-scene-focus', info.uuid);
            const uuid = await requestScene('multi-scene-focus-query');
            expect(uuid).to.equal(info.uuid);
        }
    });

    // describe('dirty 标记测试', async () => {
    //     if (!isMultiScene) {
    //         console.log('非多场景编辑模式，跳过测试');
    //         return;
    //     }
    // });

    describe('场景保存测试', async () => {
        if (!isMultiScene) {
            console.log('非多场景编辑模式，跳过测试');
            return;
        }
        // 先给每个场景增加一个节点
        let insertNodes = {};
        for (const info of SCENE_INFO) {
            await requestScene('multi-scene-focus', info.uuid);
            insertNodes[info.uuid] = await requestScene('create-node', TEST_NODE);
        }

        // 然后在切换 tab 来检查是否有正确记录
        for (const nodeId in insertNodes) {
            await requestScene('multi-scene-focus', nodeId);
            const nodeDump = await requestScene('query-node', insertNodes[nodeId]);
            expect(!!nodeDump).to.true;
        }

        // 保存场景
        for (const info of SCENE_INFO) {
            await requestScene('multi-scene-focus', info.uuid);
            await requestScene('save-scene');
        }

        //关闭最后一个场景，在打开，检查下创建的节点是否还存在
        const lastScene = SCENE_INFO[SCENE_INFO.length - 1];
        await requestScene('multi-close-scene', lastScene.uuid);
        await requestScene('open-scene', lastScene.uuid);

        const curNode = await requestScene('query-node', insertNodes[lastScene.uuid]);
        expect(!!curNode).to.true;

    });

    describe('tab 移动测试', async () => {
        if (!isMultiScene) {
            console.log('非多场景编辑模式，跳过测试');
            return;
        }
        //把第二个挪到最后
        await requestScene('multi-move-tabs-to', SCENE_INFO[1].uuid, 'end');
        let scenes = await requestScene('multi-scene-query');
        //过滤掉不是我们测试的场景
        scenes = scenes.filter(scene => SCENE_INFO.find(info => info.uuid === scene.uuid));
        //检查现在是否是 1 3 2 的顺序
        expect(scenes[0].uuid).to.equal(SCENE_INFO[0].uuid);
        expect(scenes[1].uuid).to.equal(SCENE_INFO[2].uuid);
        expect(scenes[2].uuid).to.equal(SCENE_INFO[1].uuid);

        //这会 2 在最后，然后把 2 挪到 3 前面，就变会原来的 123 的顺序
        await requestScene('multi-move-tabs-to', SCENE_INFO[1].uuid, SCENE_INFO[2].uuid);
        scenes = await requestScene('multi-scene-query');
        scenes = scenes.filter(scene => SCENE_INFO.find(info => info.uuid === scene.uuid));
        expect(scenes[0].uuid).to.equal(SCENE_INFO[0].uuid);
        expect(scenes[1].uuid).to.equal(SCENE_INFO[1].uuid);
        expect(scenes[2].uuid).to.equal(SCENE_INFO[2].uuid);
    });

    describe('关闭场景测试', async () => {
        if (!isMultiScene) {
            console.log('非多场景编辑模式，跳过测试');
            return;
        }
        const scenes = await requestScene('multi-scene-query');
        //关闭其他场景，确保只剩下我们测试的 3 个场景
        for (const scene of scenes) {
            if (!SCENE_INFO.find(info => info.uuid === scene.uuid)) {
                await requestScene('multi-close-scene', scene.uuid);
            }
        }
        //只剩下 3 个场景
        const currScenes = await requestScene('multi-scene-query');
        expect(currScenes.length).to.equal(3);

        //这 3 个场景都是我记录的场景
        let hasOtherScene = false;
        for (const info of SCENE_INFO) {
            if (currScenes.findIndex(scene => scene.uuid === info.uuid) === -1) {
                hasOtherScene = true;
            }
        }
        expect(hasOtherScene).to.false;

        //focus 到最后一个
        await requestScene('multi-scene-focus', SCENE_INFO[SCENE_INFO.length - 1].uuid);

        //关掉最后一个，他应该是 focus 到倒数第二个
        await requestScene('multi-close-scene', SCENE_INFO[SCENE_INFO.length - 1].uuid);
        const currScene = await requestScene('multi-scene-focus-query');
        expect(currScene).to.equal(SCENE_INFO[SCENE_INFO.length - 2].uuid);

        //先 focus 到第一个，测试当前场景是第一个时，关掉第一个，他应该是 focus 到第二个
        await requestScene('multi-scene-focus', SCENE_INFO[0].uuid);
        //关掉第一个，他应该是 focus 到第二个
        await requestScene('multi-close-scene', SCENE_INFO[0].uuid);
        const currScene2 = await requestScene('multi-scene-focus-query');
        expect(currScene2).to.equal(SCENE_INFO[1].uuid);

        //最后在打开一个空场景
        await requestScene('load-empty-scene');

        //关掉第二个，他应该是 focus 到空场景，下面对空场景进行所有的检查
        await requestScene('multi-close-scene', SCENE_INFO[1].uuid);
        const curScenes = await requestScene('multi-scene-query');
        expect(curScenes.length).to.equal(1);
        expect(curScenes[0].name).to.equal('Untitled.scene');
        const currScene4 = await requestScene('multi-scene-focus-query');
        expect(currScene4).to.equal(curScenes[0].uuid);
    });

});
