import { pegStaticDataRuntime, staticAddNodeInfos } from '../source/pose-expr-graph/static-data-runtime';
import { PoseExprGraphInterop, addPoseExprState } from '../source/pose-expr-graph/interop';
import { AnimationGraph, ClipMotion, StateMachine, VariableType } from 'cc/editor/new-gen-anim';
import { jest } from '@jest/globals';
import { PEGAddNodeInfo, PEGAddNodeKey, PEGLinkData, PEGNodeData, PEGNodeID, PEGNodeInputData } from '../source/pose-expr-graph/instance-data';

beforeAll(() => {
    Object.defineProperty(globalThis, 'cce', {
        get() {
            return {
                Dump: {
                    encode: {
                        encodeObject(v: unknown) {
                            return v;
                        },
                    },
                    decode: {
                        async decodePatch(propName: string, v: unknown, o: any) {
                            o[propName] = v;
                        },
                    },
                },
            };
        },
    });
});

describe(`Mock data`, () => {
    test(`Node: blend in proportion`, () => {
        const { interop, animationGraph } = createInterop();
        interop.addNode(findAddNodeInfoKey(interop, (info) => info.menu === '姿态/混合/按比例混合'), {});

        // 模仿人类找到结点 ID。
        const nodeId = interop.query().nodes.find(
            (node) => node.name === staticAddNodeInfos['cc.animation.BlendInProportion'].displayName)?.id ?? -1;
        expect(nodeId).toBeGreaterThanOrEqual(0);

        const getNode = () => {
            const node = interop.query().nodes.find((node) => node.id === nodeId);
            expect(node).not.toBeUndefined();
            return node!;
        };

        // 初始时，应该有 0 个混合项。
        checkInputsHumanely(getNode(), 0);

        // 试着插入 1 个混合项。
        interop.insertInput(nodeId, findInsertIdOfPosesHumanely(getNode()));
        checkInputsHumanely(getNode(), 1);

        // 再试着插入 4 个混合项。
        for (let i = 0; i < 4; ++i) { interop.insertInput(nodeId, findInsertIdOfPosesHumanely(getNode())); }
        checkInputsHumanely(getNode(), 5);

        // 试着移除第一个混合项。
        interop.deleteInput(nodeId, findInputIdOfPoseIndexHumanely(getNode(), 0));
        checkInputsHumanely(getNode(), 4);

        // 试着移除最后一个混合项。
        interop.deleteInput(nodeId, findInputIdOfPoseIndexHumanely(getNode(), 3));
        checkInputsHumanely(getNode(), 3);

        // 试着移除中间的混合项。
        interop.deleteInput(nodeId, findInputIdOfPoseIndexHumanely(getNode(), 1));
        checkInputsHumanely(getNode(), 2);

        // 试着插入 1 个混合项。
        interop.insertInput(nodeId, findInsertIdOfPosesHumanely(getNode()));
        checkInputsHumanely(getNode(), 3);

        /**
         * 模仿人类检查结点输入。
         * @param node 结点。
         * @param expectedBlendItemCount 期望有几个混合项。
         */
        function checkInputsHumanely(node: PEGNodeData, expectedBlendItemCount: number) {
            const inputs = node.inputs;
            // 如果结点上有 N 个混合项，那么应该有 N*2 个输入：一个对应姿态，一个对应混合比例。
            expect(inputs).toHaveLength(expectedBlendItemCount * 2);
            for (let iBlendItem = 0; iBlendItem < expectedBlendItemCount; ++iBlendItem) {
                { // 应该有对应的姿态输入，该输入可删除。
                    const poseInput = inputs.find((input) => input.name === `姿态 ${iBlendItem}`);
                    expect(poseInput).not.toBeUndefined();
                    expect(poseInput).toMatchObject({
                        value: null,
                        deletable: true,
                    } as Omit<PEGNodeInputData, 'id'>);
                }
                { // 应该有对应的比例输入，该输入 **不可删除**。
                    const proportionInput = inputs.find((input) => input.name === `比例 ${iBlendItem}`);
                    expect(proportionInput).not.toBeUndefined();
                    expect(proportionInput).toMatchObject({
                        value: 0.0,
                    } as Omit<PEGNodeInputData, 'id'>);
                }
            }
        }

        /**
         * 模仿人类找到指定混合项对应的输入的 ID。
         * @param node 结点。
         * @param blendItemIndex 混合项的索引。
         * @returns 找到的输入 ID。
         */
        function findInputIdOfPoseIndexHumanely(node: PEGNodeData, blendItemIndex: number) {
            const id = node.inputs.find(input => input.name === `姿态 ${blendItemIndex}`)?.id ?? '';
            expect(id).not.toBe('');
            return id;
        }

        /**
         * 模仿人类找到用于插入新的混合项的插入 ID。
         * @param node 结点。
         * @returns 找到的插入 ID。
         */
        function findInsertIdOfPosesHumanely(node: PEGNodeData) {
            const id = node.inputInsertInfos
                ? Object.entries(node.inputInsertInfos).find(([insertId, insertInfo]) => insertInfo.displayName === `混合项`)?.[0] ?? ''
                : '';
            expect(id).not.toBe('');
            return id;
        }
    });

    test(`Connect`, () => {
        const { interop, animationGraph } = createInterop();

        const getNode = (nodeId: PEGNodeID) => {
            const node = interop.query().nodes.find((node) => node.id === nodeId);
            expect(node).not.toBeUndefined();
            return node!;
        };

        interop.addNode(findAddNodeInfoKey(interop, (info) => info.menu === 'X Nodes/数学/取绝对值'), {});
        const absNodeId = interop.query().nodes.find(
            (node) => node.name === staticAddNodeInfos['cc.animation.x_nodes.math.abs'].displayName)?.id ?? -1;
        expect(absNodeId).toBeGreaterThanOrEqual(0);
        const getAbsNode = () => getNode(absNodeId);
        const absInputId = getAbsNode().inputs[0].id;
        const absOutputId = getAbsNode().outputs[0].id;

        interop.addNode(findAddNodeInfoKey(interop, (info) => info.menu === 'X Nodes/数学/取最小值'), {});
        const minNodeId = interop.query().nodes.find(
            (node) => node.name === staticAddNodeInfos['cc.animation.x_nodes.math.min'].displayName)?.id ?? -1;
        expect(minNodeId).toBeGreaterThanOrEqual(0);
        const getMinNode = () => getNode(minNodeId);
        const minInputIds = getMinNode().inputs.map((input) => input.id);
        const minOutputId = getMinNode().outputs[0].id;

        interop.addNode(findAddNodeInfoKey(interop, (info) => info.menu === 'X Nodes/数学/取最大值'), {});
        const maxNodeId = interop.query().nodes.find(
            (node) => node.name === staticAddNodeInfos['cc.animation.x_nodes.math.max'].displayName)?.id ?? -1;
        expect(maxNodeId).toBeGreaterThanOrEqual(0);
        const getMaxNode = () => getNode(maxNodeId);
        const maxInputIds = getMaxNode().inputs.map((input) => input.id);
        const maxOutputId = getMaxNode().outputs[0].id;

        // 添加连接。
        interop.addLink(
            absNodeId,
            absOutputId,
            maxNodeId,
            maxInputIds[0],
        );
        // 应该成功。
        expect(interop.query().links).toStrictEqual([{
            sourceID: absNodeId,
            sourceOutputID: absOutputId,
            destinationID: maxNodeId,
            destinationInputID: maxInputIds[0],
        } as PEGLinkData]);
        // 重复添加一样的连接。
        interop.addLink(
            absNodeId,
            absOutputId,
            maxNodeId,
            maxInputIds[0],
        );
        // 应该没影响（可能有警告）。
        expect(interop.query().links).toStrictEqual([{
            sourceID: absNodeId,
            sourceOutputID: absOutputId,
            destinationID: maxNodeId,
            destinationInputID: maxInputIds[0],
        } as PEGLinkData]);
        // 添加不一样的连接。
        interop.addLink(
            absNodeId,
            absOutputId,
            maxNodeId,
            maxInputIds[1],
        );
        // 能成功。
        {
            const links = interop.query().links;
            expect(links).toHaveLength(2);
            expect(links).toEqual(expect.arrayContaining([
                {
                    sourceID: absNodeId,
                    sourceOutputID: absOutputId,
                    destinationID: maxNodeId,
                    destinationInputID: maxInputIds[0],
                } as PEGLinkData,
                {
                    sourceID: absNodeId,
                    sourceOutputID: absOutputId,
                    destinationID: maxNodeId,
                    destinationInputID: maxInputIds[1],
                } as PEGLinkData,
            ]));
        }

        // 连别的线到一个输入。
        interop.addLink(
            minNodeId,
            minOutputId,
            maxNodeId,
            maxInputIds[0],
        );
        // 能成功。
        {
            const links = interop.query().links;
            expect(links).toHaveLength(2);
            expect(links).toEqual(expect.arrayContaining([
                {
                    sourceID: minNodeId,
                    sourceOutputID: minOutputId,
                    destinationID: maxNodeId,
                    destinationInputID: maxInputIds[0],
                } as PEGLinkData,
                {
                    sourceID: absNodeId,
                    sourceOutputID: absOutputId,
                    destinationID: maxNodeId,
                    destinationInputID: maxInputIds[1],
                } as PEGLinkData,
            ]));
        }
    });

    test(`Add node`, () => {
        const { interop, animationGraph } = createInterop();

        // 添加动态菜单。
        const d1 = interop.addNode(findAddNodeInfoKey(interop, (info) => info.menu === `姿态/播放/播放动画剪辑`), {});
        expect(d1).not.toBeUndefined();
        const d2 = interop.addNode(findAddNodeInfoKey(interop, (info) => info.menu === `姿态/播放/播放一维动画混合`), {});
        expect(d2).not.toBeUndefined();
        const d3 = interop.addNode(findAddNodeInfoKey(interop, (info) => info.menu === `姿态/播放/播放二维动画混合`), {});
        expect(d3).not.toBeUndefined();

        // 添加静态菜单。
        const s = interop.addNode(findAddNodeInfoKey(interop, (info) => info.menu === `姿态/反向动力学/双骨骼 IK`), {});
        expect(s).not.toBeUndefined();

        // 添加一个变量。
        animationGraph.addVariable('fv', VariableType.FLOAT);
        {
            const addNodeInfoEntries = interop.queryAddNodeInfos();
            expect(addNodeInfoEntries.find(([k, v]) => v.menu === 'X Nodes/获取变量/获取 fv')).not.toBeUndefined();
        }
    });

    test(`Get dump data`, async () => {
        const { interop, animationGraph } = createInterop();

        const clipMotionNodeId = interop.addNode(findAddNodeInfoKey(interop, (info) => info.menu === `姿态/播放/播放动画剪辑`), {});
        expect(clipMotionNodeId).not.toBeUndefined();

        const dumpObj = interop.queryNodeDump(clipMotionNodeId!);
        expect(dumpObj).toHaveProperty('motion');

        await interop.updateNodeDump(clipMotionNodeId!, 'motion', null);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        expect((interop.queryNodeDump(clipMotionNodeId!)! as any).motion).toBe(null);

        const clipMotion = new ClipMotion();
        await interop.updateNodeDump(clipMotionNodeId!, 'motion', clipMotion);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        expect((interop.queryNodeDump(clipMotionNodeId!)! as any).motion).toBe(clipMotion);
    });

    test(`Copy and paste`, () => {
        const { interop } = createInterop();

        let expectedNodeCount = 1;

        const node1 = interop.addNode(findAddNodeInfoKey(interop, (info) => info.menu === `姿态/反向动力学/双骨骼 IK`), {});
        expect(node1).not.toBeUndefined();
        ++expectedNodeCount;

        const node2 = interop.addNode(findAddNodeInfoKey(interop, (info) => info.menu === `姿态/播放/播放动画剪辑`), {});
        expect(node2).not.toBeUndefined();
        ++expectedNodeCount;

        {
            const view = interop.query();
            interop.addLink(
                node2!,
                view.nodes.find((node) => node.id === node2)?.outputs[0].id!,
                node1!,
                view.nodes.find((node) => node.id === node1)?.inputs[0].id!,
            );
            const view2 = interop.query();
            expect(view2.links.find((link) => link.destinationID === node1)).not.toBeUndefined();
        }

        const node1_copyInfo = interop.copyNodes([node1!]);
        expect(node1_copyInfo).not.toBeUndefined();
        for (let i = 0; i < 2; ++i) {
            const newNodeIds = interop.pasteNodes(node1_copyInfo!);
            ++expectedNodeCount;
            expect(newNodeIds).toHaveLength(1);
            const newNodeId = newNodeIds[0];
            expect(newNodeId).not.toEqual(node1);

            const view = interop.query();

            expect(view.nodes).toHaveLength(expectedNodeCount);

            const newNode = view.nodes.find((node) => node.id === newNodeId)!;
            expect(newNode).not.toBeUndefined();
            expect(view.links.find((link) => link.destinationID === newNodeId)).toBeUndefined();
        }

        const multiNodesCopyInfo = interop.copyNodes([node1!, node2!]);
        for (let i = 0; i < 2; ++i) {
            const newNodeIds = interop.pasteNodes(multiNodesCopyInfo!);
            expectedNodeCount += 2;
            expect(newNodeIds).toHaveLength(2);

            const view = interop.query();

            expect(view.nodes).toHaveLength(expectedNodeCount);

            const newNodes = newNodeIds.map((id) => {
                const node = view.nodes.find((node) => node.id === id);
                expect(node).not.toBeUndefined();
                return node!;
            });
            const [
                newNode1,
                newNode2,
            ] = [
                node1!,
                node2!,
            ].map((nodeId) => {
                const nodeName = view.nodes.find((node) => node.id === nodeId)?.name;
                const newNode = newNodes.find((node) => node.name === nodeName);
                expect(newNode).not.toBeUndefined();
                return newNode!.id;
            });

            expect(view.links.find((link) => {
                return link.destinationID === newNode1 && link.sourceID === newNode2;
            })).not.toBeUndefined();
        }
    });
});

function createInterop() {
    const animationGraph = new AnimationGraph();
    const stateMachine = new StateMachine();
    const poseExprState = addPoseExprState(stateMachine, {});
    const interop = new PoseExprGraphInterop(animationGraph, poseExprState, {
        layerIndex: 0,
    });
    return {
        interop,
        animationGraph,
    };
}

function findAddNodeInfoKey(interop: PoseExprGraphInterop, filter: (info: PEGAddNodeInfo) => boolean): PEGAddNodeKey {
    const entry = interop.queryAddNodeInfos().find(([k, v]) => filter(v));
    expect(entry).not.toBeUndefined();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return entry![0];
}
