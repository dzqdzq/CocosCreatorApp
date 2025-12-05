'use strict';

const { existsSync, readFileSync } = require('fs');
const { join } = require('path');
const { expect } = require('chai');

const InterpMode = {
    LINEAR: 0,
    CONSTANT: 1,
    CUBIC: 2,
};

function generateAnimOperation(funcName, args) {
    return {
        funcName,
        args,
    };
}

/**
 * 更改当前正在编辑的动画的 sample
 */
function IchangeClipSample(clipUuid, sample) {
    return generateAnimOperation('changeSample', [clipUuid, sample]);
}

/**
 * 更改当前正在编辑的动画的 wrapMode
 */
function IchangeClipWrapMode(clipUuid, wrapMode) {
    return generateAnimOperation('changeWrapMode', [clipUuid, wrapMode]);
}

/**
 * 更改当前动画编辑模式
 */
async function Irecord(uuid, active) {
    return await Editor.Message.request('scene', 'record-animation', uuid, active);
}

/**
 * 切换动画根节点
 */
async function IchangeAnimNode(uuid, clipUuid) {
    return await Editor.Message.request('scene', 'change-animation-root', uuid, clipUuid);
}

/**
 * 更改当前当前关键帧
 */
function IsetCurEditTime(time) {
    return Editor.Message.request('scene', 'set-edit-time', time);
}

/**
 * 更改当前正在编辑的动画的 speed
 */
function IchangeClipSpeed(clipUuid, speed) {
    return generateAnimOperation('changeSpeed', [clipUuid, speed]);
}

/**
 * 更改当前正在编辑的动画的播放状态
 */
function IchangeAnimationState(operate, clipUuid) {
    return Editor.Message.request('scene', 'change-clip-state', operate, clipUuid);
}

/**
 * 更改当前正在编辑的动画 uuid
 *
 * @param clipUuid
 */
function IsetEditClip(clipUuid) {
    return Editor.Message.request('scene', 'change-edit-clip', clipUuid);
}

/**
 * 创建动画的属性轨道
 */
function IcreateProp(clipUuid, nodePath, propKey) {
    return generateAnimOperation('createProp', [clipUuid, nodePath, propKey]);
}

/**
 * 删除动画的属性轨道
 */
function IremoveProp(clipUuid, nodePath, propKey) {
    return generateAnimOperation('removeProp', [clipUuid, nodePath, propKey]);
}

/**
 * 新增关键帧
 */
function IcreateKey(clipUuid, nodePath, propKey, frame, customData) {
    return generateAnimOperation('createKey', [clipUuid, nodePath, propKey, frame, customData]);
}

/**
 * 拷贝关键帧
 */
function IcopyKeysTo(clipUuid, nodePath, propKey, srcFrames, dstFrame) {
    return generateAnimOperation('copyKeysTo', [clipUuid, nodePath, propKey, srcFrames, dstFrame]);
}

/**
 * 移除关键帧
 */
function IremoveKey(clipUuid, nodePath, propKey, frame) {
    return generateAnimOperation('removeKey', [clipUuid, nodePath, propKey, frame]);
}

/**
 * 移动关键帧
 */
function ImoveKeys(clipUuid, nodePath, propKey, frames, offset) {
    return generateAnimOperation('moveKeys', [clipUuid, nodePath, propKey, frames, offset]);
}

/**
 * 间隔排列关键帧
 */
function IspacingKeys(clipUuid, nodePath, propKey, frames, spacingFrame) {
    return generateAnimOperation('spacingKeys', [clipUuid, nodePath, propKey, frames, spacingFrame]);
}

/**
 * 清除轨道上的关键帧
 */
function IclearKeys(clipUuid, nodePath, propKey) {
    return generateAnimOperation('clearKeys', [clipUuid, nodePath, propKey]);
}

/**
 * 清除节点动画数据
 */
function IremoveNode(clipUuid, path) {
    return generateAnimOperation('removeNode', [clipUuid, path]);
}

/**
 * 迁移节点动画数据
 */
function IchangeNodeDataPath(clipUuid, srcPath, dstPath) {
    return generateAnimOperation('changeNodeDataPath', [clipUuid, srcPath, dstPath]);
}

/**
 * 添加帧事件
 */
function IaddEvent(clipUuid, frame, funcName, params) {
    return generateAnimOperation('addEvent', [clipUuid, frame, funcName, params]);
}

/**
 * 复制帧事件
 */
function IcopyEventsTo(clipUuid, srcFrames, dstFrame) {
    return generateAnimOperation('copyEventsTo', [clipUuid, srcFrames, dstFrame]);
}

/**
 * 移动帧事件
 */
function ImoveEvents(clipUuid, frames, offset) {
    return generateAnimOperation('moveEvents', [clipUuid, frames, offset]);
}

/**
 * 删除帧事件
 */
function IdeleteEvent(clipUuid, frame) {
    return generateAnimOperation('deleteEvent', [clipUuid, frame]);
}

/**
 * 更新帧事件
 */
function IupdateEvent(clipUuid, frame, events) {
    return generateAnimOperation('updateEvent', [clipUuid, frame, events]);
}

/**
 * 保存动画数据
 */
function IsaveClip() {
    return Editor.Message.request('scene', 'save-clip');
}

/**
 * 保存动画曲线数据
 */
function ImodifyCurveOfKey(clipUuid, nodePath, propKey, frame, data) {
    return generateAnimOperation('modifyCurveOfKey', [clipUuid, nodePath, propKey, frame, data]);
}

/**
 * 复制节点动画
 */
function IcopyNode(clipUuid, srcInfo, dstInfo) {
    return generateAnimOperation('copyNode', [clipUuid, srcInfo, dstInfo]);
}

/**
 * 复制动画的属性轨道
 */
function IcopyProp(clipUuid, srcInfo, dstInfo) {
    return generateAnimOperation('copyProp', [clipUuid, srcInfo, dstInfo]);
}

/**
 * 复制动画的关键帧
 */
function IcopyKey(clipUuid, srcInfo, dstInfo) {
    return generateAnimOperation('copyKey', [clipUuid, srcInfo, dstInfo]);
}

/**
 * 复制动画的事件
 */
function IcopyEvent(clipUuid, srcInfo, dstInfo) {
    return generateAnimOperation('copyEvent', [clipUuid, srcInfo, dstInfo]);
}

/**
 * 将动画操作队列发送到场景中
 * @param operationList
 */
function IApplyOperation(operationList) {
    if (!operationList) {
        return false;
    }

    if (!Array.isArray(operationList)) {
        operationList = [operationList];
    }

    if (operationList.length <= 0) {
        return false;
    }

    return Editor.Message.request('scene', 'animation-operation', operationList);
}

describe('Test Animation IPC', () => {
    let testNodeUuid = null;
    const testAnimClipUrl = 'db://assets/testAnimClip.anim';
    let animClipUuid = null;
    const subNodeName = 'SubNode';
    let subNodeUuid = null;

    describe('prepare test resources', async () => {

        it('create Cube Node', async () => {
            const newNodeUuid = await Editor.Message.request('scene', 'create-node',
                { name: 'testAnimNode', assetUuid: '30da77a1-f02d-4ede-aa56-403452ee7fde' });
            expect(!!newNodeUuid).to.true;
            testNodeUuid = newNodeUuid;
        });

        it('create Sub Cone Node', async () => {
            const newNodeUuid = await Editor.Message.request('scene', 'create-node',
                { name: subNodeName, assetUuid: '6350d660-e888-4acf-a552-f3b719ae9110', parent: testNodeUuid });
            expect(!!newNodeUuid).to.true;
            subNodeUuid = newNodeUuid;
        });

        it('add animation component', async () => {
            await Editor.Message.request('scene', 'create-component', {
                uuid: testNodeUuid,
                component: 'cc.Animation',
            });

            const nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);
            expect(nodeDump.__comps__[1].type).to.equal('cc.Animation');
        });

        it('create animation clip', async () => {
            const templateUrl = 'db://internal/default_file_content/anim';
            const filePath = await Editor.Message.request('asset-db', 'query-path', templateUrl);
            const asset = await Editor.Message.request('asset-db', 'import-asset', filePath, testAnimClipUrl, { overwrite: true });

            expect(!!asset.uuid).to.true;
            animClipUuid = asset.uuid;
        });

        it('set default clip to component', async () => {
            await Editor.Message.request('scene', 'set-property', {
                uuid: testNodeUuid,
                path: '__comps__.1.defaultClip',
                dump: {
                    type: 'cc.AnimationClip',
                    value: {
                        uuid: animClipUuid,
                    },
                },
            });

            const nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);
            const defaultClipUuid = nodeDump.__comps__[1].value.defaultClip.value.uuid;
            expect(defaultClipUuid).to.equal(animClipUuid);
        });
    });

    describe('test animation clip edit', async () => {

        await new Promise((resolve) => {
            setTimeout(function() {
                resolve();
            }, 2000);
        });

        const getCurEditClipDump = async function() {
            return await Editor.Message.request('scene', 'query-animation-clip', testNodeUuid, animClipUuid);
        };

        describe('enter Animation Mode', async () => {
            it('set edit clip', async () => {
                IsetEditClip(animClipUuid);
                const curAnimInfo = await Editor.Message.request('scene', 'query-current-animation-info');
                expect(curAnimInfo.clipid).to.equal(animClipUuid);
            });

            it('change to Animation Mode', async () => {
                Irecord(testNodeUuid, true);
                const sceneMode = await Editor.Message.request('scene', 'query-scene-mode');
                expect(sceneMode).to.equal('animation');
            });
        });

        describe('edit uniform key', async () => {
            const nodePath = '/';
            const uniformProp = 'mainColor';
            let uniformPropDump = null;
            let propData = null;
            const curveIndex = 0;
            let propKey = '';

            it('get animatable properties', async () => {
                const animatableProps = await Editor.Message.request('scene', 'query-animation-properties', testNodeUuid);
                console.log(animatableProps);
                animatableProps.forEach((animProp) => {
                    if (animProp.name === uniformProp) {
                        uniformPropDump = animProp;
                    }
                });
                console.log(uniformPropDump);
                propData = uniformPropDump.propData;
                propData.type = uniformPropDump.type;
                propKey = uniformPropDump.key;
                // expect(!!clipDump.paths[path].props[prop]).to.true;
            });

            it(`create ${uniformProp} prop`, async () => {
                await IApplyOperation(IcreateProp(animClipUuid, nodePath, propKey));
                const clipDump = await getCurEditClipDump();
                console.log(clipDump);
                expect(!!clipDump.curves[curveIndex]).to.true;
            });

            const keyframe1 = 0;
            let keyframe2 = 30;
            it('create key', async () => {
                const customData = {};
                customData.newValue = { r: 255, g: 0, b: 0, a: 255 };
                const addKey1 = await IApplyOperation(IcreateKey(animClipUuid, nodePath, propKey, keyframe1, customData));
                customData.newValue = { r: 0, g: 255, b: 0, a: 255 };
                const addKey2 = await IApplyOperation(IcreateKey(animClipUuid, nodePath, propKey, keyframe2, customData));
                const clipDump = await getCurEditClipDump();
                console.log('create key:', clipDump);
                const keyframes = clipDump.curves[curveIndex].keyframes;
                const checkFrames = (keyframes.length === 2) &&
                                  (keyframes[0].frame === keyframe1) &&
                                  (keyframes[1].frame === keyframe2);
                expect(addKey1 && addKey2 && checkFrames).to.true;
            });

            it('get value at', async () => {
                const dumpValue = await Editor.Message.request('scene', 'query-property-value-at-frame', animClipUuid, nodePath, propKey, 60);
                console.log('get value at', dumpValue);
                expect(!!dumpValue).to.true;
            });

            // it('wrap mode', async() => {
            //     await Editor.Message.request('scene', 'change-clip-wrap-mode', animClipUuid, 2);
            // });

            // it('play', async() => {
            //     await Editor.Message.request('scene', 'change-clip-state', 'play', animClipUuid);
            // });

            const copyDstFrame = 15;
            let copyKeyframe1 = keyframe1 + copyDstFrame;
            let copyKeyframe2 = keyframe2 + copyDstFrame;
            it('copy key', async () => {
                delete propData.newValue;
                const result = await IApplyOperation(IcopyKeysTo(animClipUuid, nodePath, propKey,
                    [keyframe1, keyframe2], copyDstFrame));
                const clipDump = await getCurEditClipDump();
                // console.log("copy key:", clipDump);
                const keyframes = clipDump.curves[curveIndex].keyframes;
                const checkFrames = (keyframes.length === 4) &&
                                  (keyframes[1].frame === copyKeyframe1) &&
                                  (keyframes[3].frame === copyKeyframe2);
                expect(result && checkFrames).to.true;
            });

            const moveOffset = 5;
            it('move keys', async () => {
                const result = await IApplyOperation(ImoveKeys(animClipUuid, nodePath, propKey,
                    [copyKeyframe1, copyKeyframe2], moveOffset));
                const clipDump = await getCurEditClipDump();
                // console.log("move key:", clipDump);
                const keyframes = clipDump.curves[curveIndex].keyframes;
                copyKeyframe1 = copyKeyframe1 + moveOffset;
                copyKeyframe2 = copyKeyframe2 + moveOffset;
                const checkFrames = (keyframes.length === 4) &&
                                  (keyframes[1].frame === copyKeyframe1) &&
                                  (keyframes[3].frame === copyKeyframe2);
                expect(result && checkFrames).to.true;
            });

            it('spacing keys', async () => {
                const result = await IApplyOperation(IspacingKeys(animClipUuid, nodePath, propKey,
                    [keyframe1, keyframe2, copyKeyframe1, copyKeyframe2], 10));
                const clipDump = await getCurEditClipDump();
                // console.log("spacing key:", clipDump);
                const keyframes = clipDump.curves[curveIndex].keyframes;
                copyKeyframe1 = 10;
                copyKeyframe2 = 20;
                keyframe2 = 30;
                const checkFrames = (keyframes.length === 4) &&
                                  (keyframes[0].frame === keyframe1) &&
                                  (keyframes[1].frame === copyKeyframe1) &&
                                  (keyframes[2].frame === copyKeyframe2) &&
                                  (keyframes[3].frame === keyframe2);
                expect(result && checkFrames).to.true;
            });

            it('remove key', async () => {
                const deleteKey1 = await IApplyOperation(IremoveKey(
                    animClipUuid, nodePath, propKey, copyKeyframe1));
                const deleteKey2 = await IApplyOperation(IremoveKey(
                    animClipUuid, nodePath, propKey, copyKeyframe2));
                const clipDump = await getCurEditClipDump();
                // console.log("remove key:", clipDump);
                const keyframes = clipDump.curves[curveIndex].keyframes;
                const checkFrames = (keyframes.length === 2) &&
                                  (keyframes[0].frame === keyframe1) &&
                                  (keyframes[1].frame === keyframe2);
                expect(deleteKey1 && deleteKey2 && checkFrames).to.true;
            });

            it('change sample', async () => {
                const sample = 30;
                const result = await IApplyOperation(IchangeClipSample(animClipUuid, sample));
                const clipDump = await getCurEditClipDump();
                expect(result && (clipDump.sample === sample)).to.true;
            });

            it('clear keys', async () => {
                const result = await IApplyOperation(IclearKeys(animClipUuid, nodePath, propKey));
                const clipDump = await getCurEditClipDump();
                console.log('remove key:', clipDump);
                const keyframes = clipDump.curves[curveIndex].keyframes;
                const checkFrames = (keyframes.length === 0);
                expect(result && checkFrames).to.true;
            });

            it('remove material prop', async () => {
                const result = await IApplyOperation(IremoveProp(animClipUuid, nodePath, propKey));
                const clipDump = await getCurEditClipDump();
                console.log('remove key:', clipDump);
                const curves = clipDump.curves;
                const checkcurves = (curves.length === 0);
                expect(result && checkcurves).to.true;
            });
        });

        describe('edit node keys', async () => {
            const nodePath = '/';
            const prop = 'position';
            let posPropDump = null;
            let propData = null;
            const curveIndex = 0;
            let propKey = '';

            it('get animatable properties', async () => {
                const animatableProps = await Editor.Message.request('scene',
                    'query-animation-properties', testNodeUuid);
                console.log(animatableProps);
                animatableProps.forEach((animProp) => {
                    if (animProp.name === prop) {
                        posPropDump = animProp;
                    }
                });
                propData = posPropDump.propData;
                propData.type = posPropDump.type;
                propKey = posPropDump.key;
            });

            it(`create ${prop} prop`, async () => {
                await IApplyOperation(IcreateProp(animClipUuid, nodePath, propKey));
                const clipDump = await getCurEditClipDump();
                console.log('position prop:', clipDump);
                // position curve has one combined curve and three part curve
                expect(clipDump.curves.length === 4).to.true;
            });

            const keyframe1 = 0;
            let keyframe2 = 30;
            it('create key', async () => {
                const addKey1 = await IApplyOperation(IcreateKey(animClipUuid, nodePath, propKey, keyframe1));
                const addKey2 = await IApplyOperation(IcreateKey(animClipUuid, nodePath, propKey, keyframe2));
                const clipDump = await getCurEditClipDump();
                console.log(`create ${prop} key:`, clipDump);
                const keyframes = clipDump.curves[curveIndex].keyframes;
                const checkFrames = (keyframes.length === 2) &&
                                  (keyframes[0].frame === keyframe1) &&
                                  (keyframes[1].frame === keyframe2);
                expect(addKey1 && addKey2 && checkFrames).to.true;
            });
            // key
            // [0, 30]

            const copyDstFrame = 15;
            let copyKeyframe1 = keyframe1 + copyDstFrame;
            let copyKeyframe2 = keyframe2 + copyDstFrame;
            it('copy key', async () => {
                const result = IApplyOperation(IcopyKeysTo(
                    animClipUuid, nodePath, propKey, [keyframe1, keyframe2], copyDstFrame));
                const clipDump = await getCurEditClipDump();
                console.log(`copy ${prop} key:`, clipDump);
                const keyframes = clipDump.curves[curveIndex].keyframes;
                const checkFrames = (keyframes.length === 4) &&
                                  (keyframes[1].frame === copyKeyframe1) &&
                                  (keyframes[3].frame === copyKeyframe2);
                expect(result && checkFrames).to.true;
            });
            // key
            // [0, 15, 40, 45]

            const moveOffset = 5;
            it('move keys', async () => {
                const result = await IApplyOperation(ImoveKeys(
                    animClipUuid, nodePath, propKey, [copyKeyframe1, copyKeyframe2], moveOffset));
                const clipDump = await getCurEditClipDump();
                console.log(`move ${prop} key:`, clipDump);
                const keyframes = clipDump.curves[curveIndex].keyframes;
                copyKeyframe1 = copyKeyframe1 + moveOffset;
                copyKeyframe2 = copyKeyframe2 + moveOffset;
                const checkFrames = (keyframes.length === 4) &&
                                  (keyframes[1].frame === copyKeyframe1) &&
                                  (keyframes[3].frame === copyKeyframe2);
                expect(result && checkFrames).to.true;
            });
            // key
            // [0, 20, 40, 50]

            it('spacing keys', async () => {
                const result = await IApplyOperation(IspacingKeys(
                    animClipUuid, nodePath, propKey, [keyframe1, keyframe2, copyKeyframe1, copyKeyframe2], 10));
                const clipDump = await getCurEditClipDump();
                console.log(`spacing ${prop} key:`, clipDump);
                const keyframes = clipDump.curves[curveIndex].keyframes;
                copyKeyframe1 = 10;
                copyKeyframe2 = 20;
                keyframe2 = 30;
                const checkFrames = (keyframes.length === 4) &&
                                  (keyframes[0].frame === keyframe1) &&
                                  (keyframes[1].frame === copyKeyframe1) &&
                                  (keyframes[2].frame === copyKeyframe2) &&
                                  (keyframes[3].frame === keyframe2);
                expect(result && checkFrames).to.true;
            });
            // key
            // [0, 10, 20, 30]

            it('remove key', async () => {
                const deleteKey1 = await IApplyOperation(IremoveKey(
                    animClipUuid, nodePath, propKey, copyKeyframe1));
                const deleteKey2 = await IApplyOperation(IremoveKey(
                    animClipUuid, nodePath, propKey, copyKeyframe2));
                const clipDump = await getCurEditClipDump();
                console.log(`remove ${prop} key:`, clipDump);
                const keyframes = clipDump.curves[curveIndex + 1].keyframes;
                const checkFrames = (keyframes.length === 2) &&
                                  (keyframes[0].frame === keyframe1) &&
                                  (keyframes[1].frame === keyframe2);
                expect(deleteKey1 && deleteKey2 && checkFrames).to.true;
            });
            // key
            // [0, 30]

            it('change sample', async () => {
                const sample = 30;
                const result = await IApplyOperation(IchangeClipSample(animClipUuid, sample));
                const clipDump = await getCurEditClipDump();
                expect(result && (clipDump.sample === sample)).to.true;
            });

            it('set edit time', async () => {
                const result = await IsetCurEditTime(1); // 1s
                expect(result).to.true;
            });

            it('auto add key', async () => {
                await Editor.Message.request('scene', 'set-property', {
                    uuid: testNodeUuid,
                    path: prop,
                    dump: {
                        type: 'cc.Vec3',
                        value: {
                            x: 0,
                            y: 5,
                            z: 0,
                        },
                    },
                });

                const clipDump = await getCurEditClipDump();
                console.log('after Auto add key:', clipDump);
                const keyframes = clipDump.curves[curveIndex].keyframes;
                const checkFrames = (keyframes.length === 2) &&
                                  (keyframes[0].frame === keyframe1) &&
                                  (keyframes[1].frame === keyframe2);
                expect(checkFrames).to.true;
            });

            const endKey = 45;
            const modifyKey = 30;
            const modifyInTangent = 0.5;
            const modifyOutTangent = 0.7;
            const modifyInterpMode = InterpMode.CUBIC;
            const curveData = { inTangent: modifyInTangent, outTangent: modifyOutTangent, interpMode: modifyInterpMode };
            it('modify curve', async () => {
                const addKey = await IApplyOperation(IcreateKey(animClipUuid, nodePath, propKey, endKey));
                const curveResult = await IApplyOperation(ImodifyCurveOfKey(animClipUuid, nodePath, propKey + '.x', modifyKey, curveData));

                const clipDump = await getCurEditClipDump();
                console.log(clipDump);
                const keyframes = clipDump.curves[curveIndex + 1].keyframes;
                const checkFrames = (keyframes.length === 3) &&
                                  (keyframes[0].frame === keyframe1) &&
                                  (keyframes[1].frame === keyframe2) &&
                                  (keyframes[2].frame === endKey);
                console.log(keyframes[1].inTangent);
                const checkCurve = (keyframes[1].inTangent === 0.5);
                // let checkCurve = (JSON.stringify(keyframes[1].curve) === JSON.stringify(curveData));
                expect(addKey && curveResult && checkFrames && checkCurve).to.true;
            });
            // key
            // - testAnimNode[0, 30, 45]

            it('save clip', async () => {
                await IsaveClip();
            });

            it('change to General Mode', async () => {
                Irecord(testNodeUuid, false);
                const sceneMode = await Editor.Message.request('scene', 'query-scene-mode');
                expect(sceneMode).to.equal('general');
            });

            it('set edit clip', async () => {
                IsetEditClip(animClipUuid);
                const curAnimInfo = await Editor.Message.request('scene', 'query-current-animation-info');
                expect(curAnimInfo.clipid).to.equal(animClipUuid);
            });

            it('change to Animation Mode', async () => {
                Irecord(testNodeUuid, true);
                const sceneMode = await Editor.Message.request('scene', 'query-scene-mode');
                expect(sceneMode).to.equal('animation');
            });

            it('test Serialized Data', async () => {
                const clipDump = await getCurEditClipDump();
                console.log('reload data:', clipDump);

                // let keyframes = clipDump.curves[curveIndex].keyframes;
                // let checkFrames = (keyframes.length === 3) &&
                //                   (keyframes[0].frame === keyframe1) &&
                //                   (keyframes[1].frame === keyframe2) &&
                //                   (keyframes[2].frame === endKey);
                // // test curve
                // let checkCurve = (JSON.stringify(keyframes[1].curve) === JSON.stringify(curveData));
                // expect(checkFrames && checkCurve).to.true;
            });

            const subNodePath = '/' + subNodeName;
            const subCurveIndex = 4;
            // copy node
            it('copy node curve to subNode', async () => {
                const srcClipDump = await getCurEditClipDump();
                await IApplyOperation(IcopyNode(animClipUuid, { curvesDump: srcClipDump.curves }, { nodePath: subNodePath }));
                const clipDump = await getCurEditClipDump();
                console.log('dump after copy to subNode:', clipDump);
                const keyframes = clipDump.curves[subCurveIndex].keyframes;
                const checkFrames = (keyframes.length === 3);
                // position curve has one combined curve and three part curve
                expect(clipDump.curves.length === 8 && checkFrames).to.true;
            });
            // key
            // - testAnimNode[0, 30, 45]
            //   - subNode[0, 30, 45]

            it('remove subNode data', async () => {
                const result = await IApplyOperation(IremoveNode(animClipUuid, subNodePath));
                const clipDump = await getCurEditClipDump();
                console.log('dump after remove subNode data:', clipDump);
                const curves = clipDump.curves;
                const checkCurves = (curves.length === 4);
                expect(result && checkCurves).to.true;
            });
            // key
            // - testAnimNode[0, 30, 45]

            // create prop for subNode
            it(`create ${prop} prop for subNode`, async () => {
                await IApplyOperation(IcreateProp(animClipUuid, subNodePath, propKey));
                const clipDump = await getCurEditClipDump();
                console.log('position prop:', clipDump);
                // position curve has one combined curve and three part curve
                expect(clipDump.curves.length === 8).to.true;
            });

            // copy prop
            it('copy prop curve to subNode', async () => {
                const srcClipDump = await getCurEditClipDump();
                await IApplyOperation(IcopyProp(animClipUuid, { curvesDump: [srcClipDump.curves[1]] }, { nodePath: subNodePath, propKeys: [propKey + '.x'] }));
                const clipDump = await getCurEditClipDump();
                console.log('dump after copy prop to subNode:', clipDump);
                const keyframes = clipDump.curves[subCurveIndex + 1].keyframes;
                const checkFrames = (keyframes.length === 3);
                // position curve has one combined curve and three part curve
                expect(clipDump.curves.length === 8 && checkFrames).to.true;

                const subXKeyframes = clipDump.curves[subCurveIndex + 1].keyframes;
                const curveKeyframe = subXKeyframes[1];
                expect(curveKeyframe.inTangent).to.approximately(modifyInTangent, 0.001);
                expect(curveKeyframe.outTangent).to.approximately(modifyOutTangent, 0.001);
                expect(curveKeyframe.interpMode).to.equal(modifyInterpMode);
            });
            // key
            // - testAnimNode[0, 30, 45]
            //   - subNode[0, 30, 45]

            it('remove key', async () => {
                const deleteKey1 = await IApplyOperation(IremoveKey(
                    animClipUuid, nodePath, propKey, 0));
                const clipDump = await getCurEditClipDump();
                console.log('remove key:', clipDump);
                const keyframes = clipDump.curves[curveIndex].keyframes;
                const checkFrames = (keyframes.length === 2) &&
                                  (keyframes[0].frame === 30) &&
                                  (keyframes[1].frame === 45);
                expect(deleteKey1 && checkFrames).to.true;
            });
            // key
            // - testAnimNode[30, 45]
            //   - subNode[0, 30, 45]

            // copy key
            const startFrame = 5;
            it('copy prop curve key to subNode prop', async () => {
                const srcClipDump = await getCurEditClipDump();
                await IApplyOperation(IcopyKey(animClipUuid, { curvesDump: [srcClipDump.curves[0]] }, { nodePath: subNodePath, propKeys: [propKey], startFrame }));
                const clipDump = await getCurEditClipDump();
                console.log('dump after copy prop key to subNode prop:', clipDump);
                const keyframes = clipDump.curves[subCurveIndex].keyframes;
                const checkFrames = (keyframes.length === 5) &&
                                    keyframes[1].frame === 5 &&
                                    keyframes[2].frame === 20;
                const checkValues = (keyframes[1].dump.value.y === 5);
                // position curve has one combined curve and three part curve
                expect(clipDump.curves.length === 8 && checkFrames && checkValues).to.true;
            });
            // key
            // - testAnimNode[30, 45]
            //   - subNode[0, 5, 20, 30, 45]

            it('clear subNode keys', async () => {
                const result = await IApplyOperation(IclearKeys(animClipUuid, subNodePath, propKey));
                const clipDump = await getCurEditClipDump();
                const keyframes = clipDump.curves[subCurveIndex].keyframes;
                const checkFrames = (keyframes.length === 0);
                expect(result && checkFrames).to.true;
            });

            it(`create key for subNode ${prop}`, async () => {
                const addKey1 = await IApplyOperation(IcreateKey(animClipUuid, subNodePath, propKey, keyframe1));
                const addKey2 = await IApplyOperation(IcreateKey(animClipUuid, subNodePath, propKey, keyframe2));
                const clipDump = await getCurEditClipDump();
                const checkCurveNum = (clipDump.curves.length === 8);
                const keyframes = clipDump.curves[subCurveIndex].keyframes;
                const checkFrames = (keyframes.length === 2) &&
                                  (keyframes[0].frame === keyframe1) &&
                                  (keyframes[1].frame === keyframe2);
                expect(addKey1 && addKey2 && checkCurveNum && checkFrames).to.true;
            });

            // test change node path
            it('change node data path', async () => {
                IApplyOperation(IchangeNodeDataPath(animClipUuid, nodePath, subNodePath));
                const clipDump = await getCurEditClipDump();
                console.log('data after change path:', clipDump);

                const checkCurveNum = (clipDump.curves.length === 4);
                const keyframes = clipDump.curves[curveIndex].keyframes;
                const checkFrames = (keyframes.length === 2) &&
                                  (keyframes[0].frame === keyframe2) &&
                                  (keyframes[1].frame === endKey);
                expect(checkCurveNum && checkFrames).to.true;
            });

            it('change node data path back', async () => {
                IApplyOperation(IchangeNodeDataPath(animClipUuid, subNodePath, nodePath));
                const clipDump = await getCurEditClipDump();
                console.log('data after change path back:', clipDump);

                const checkCurveNum = (clipDump.curves.length === 4);
                const keyframes = clipDump.curves[curveIndex].keyframes;
                const checkFrames = (keyframes.length === 2) &&
                                  (keyframes[0].frame === keyframe2) &&
                                  (keyframes[1].frame === endKey);
                expect(checkCurveNum && checkFrames).to.true;
            });

            it('set speed', async () => {
                const newSpeed = 3;
                await IApplyOperation(IchangeClipSpeed(animClipUuid, newSpeed));
                const clipDump = await getCurEditClipDump();
                const checkSpeed = (clipDump.speed === newSpeed);
                expect(checkSpeed).to.true;
            });

            it('set wrap mode', async () => {
                const newWrap = 2; // loop
                await IApplyOperation(IchangeClipWrapMode(animClipUuid, newWrap));
                const clipDump = await getCurEditClipDump();
                const checkWrap = (clipDump.wrapMode === newWrap);
                expect(checkWrap).to.true;
            });

            it('clear keys', async () => {
                const result = await IApplyOperation(IclearKeys(animClipUuid, nodePath, propKey));
                const clipDump = await getCurEditClipDump();
                const keyframes = clipDump.curves[curveIndex].keyframes;
                const checkFrames = (keyframes.length === 0);
                expect(result && checkFrames).to.true;
            });

            it('remove node clip', async () => {
                const result = await IApplyOperation(IremoveNode(animClipUuid, nodePath));
                const clipDump = await getCurEditClipDump();
                console.log(clipDump);
                const curves = clipDump.curves;
                const checkCurves = (curves.length === 0);
                expect(result && checkCurves).to.true;
            });
        });

        describe('edit events', async () => {
            const eventFrame1 = 5;
            const eventFrame2 = 30;
            const eventFuncName1 = 'Hello1';
            const eventFuncName2 = 'Hello2';
            it('add event', async () => {
                const result1 = await IApplyOperation(IaddEvent(animClipUuid, eventFrame1, eventFuncName1, []));
                const result2 = await IApplyOperation(IaddEvent(animClipUuid, eventFrame2, eventFuncName2, []));
                const clipDump = await getCurEditClipDump();
                const checkEvents = clipDump.events.length === 2 &&
                                  clipDump.events[0].frame === eventFrame1 &&
                                  clipDump.events[0].func === eventFuncName1 &&
                                  clipDump.events[1].frame === eventFrame2 &&
                                  clipDump.events[1].func === eventFuncName2;
                expect(result1 && result2 && checkEvents).to.true;
            });

            const dstFrame = 15;
            let copyEventFrame1 = dstFrame;
            let copyEventFrame2 = eventFrame2 + dstFrame - eventFrame1;
            it('copy event', async () => {
                const srcClipDump = await getCurEditClipDump();
                const result = await IApplyOperation(IcopyEvent(animClipUuid, { eventsDump: srcClipDump.events }, { startFrame: dstFrame }));
                const clipDump = await getCurEditClipDump();
                const checkEvents = clipDump.events.length === 4 &&
                                  clipDump.events[1].frame === copyEventFrame1 &&
                                  clipDump.events[1].func === eventFuncName1 &&
                                  clipDump.events[3].frame === copyEventFrame2 &&
                                  clipDump.events[3].func === eventFuncName2;
                expect(result && checkEvents).to.true;
            });

            const offset = 5;
            it('move events', async () => {
                const result = await IApplyOperation(ImoveEvents(
                    animClipUuid, [copyEventFrame1, copyEventFrame2], offset));
                copyEventFrame1 = copyEventFrame1 + offset;
                copyEventFrame2 = copyEventFrame2 + offset;
                const clipDump = await getCurEditClipDump();
                const checkEvents = clipDump.events.length === 4 &&
                                  clipDump.events[1].frame === copyEventFrame1 &&
                                  clipDump.events[1].func === eventFuncName1 &&
                                  clipDump.events[3].frame === copyEventFrame2 &&
                                  clipDump.events[3].func === eventFuncName2;
                expect(result && checkEvents).to.true;
            });

            it('update event', async () => {
                const updateFuncName = 'update Hello';
                const result = await IApplyOperation(IupdateEvent(
                    animClipUuid, copyEventFrame1, [{ func: updateFuncName, params: [] }]));
                const clipDump = await getCurEditClipDump();
                const checkEvents = clipDump.events.length === 4 &&
                                  clipDump.events[1].frame === copyEventFrame1 &&
                                  clipDump.events[1].func === updateFuncName &&
                                  clipDump.events[3].frame === copyEventFrame2 &&
                                  clipDump.events[3].func === eventFuncName2;
                expect(result && checkEvents).to.true;
            });

            it('delete event', async () => {
                const result = await IApplyOperation(IdeleteEvent(animClipUuid, copyEventFrame2));
                const clipDump = await getCurEditClipDump();
                const checkEvents = clipDump.events.length === 3 &&
                                  clipDump.events[2].frame === eventFrame2 &&
                                  clipDump.events[2].func === eventFuncName2;
                expect(result && checkEvents).to.true;
            });
        });

        describe('exit Animation Mode', async () => {
            it('save clip', async () => {
                await IsaveClip();
            });

            it('change to General Mode', async () => {
                await Irecord(testNodeUuid, false);
                const sceneMode = await Editor.Message.request('scene', 'query-scene-mode');
                expect(sceneMode).to.equal('general');
            });
        });
    });

    describe('clear test resources', async () => {
        it('remove node', async () => {
            await Editor.Message.request('scene', 'remove-node', { uuid: testNodeUuid });
        });

        it('delete animation clip', async () => {
            const asset = await Editor.Message.request('asset-db', 'delete-asset', testAnimClipUrl);
            expect(asset).not.to.be.null;
        });
    });
});
