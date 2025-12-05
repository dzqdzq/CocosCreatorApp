
import { GltfConverter } from '../../../source/handler/assets/utils/gltf-converter';
import * as cc from 'cc';
import { GltfAccessorType } from '../../../source/handler/assets/utils/glTF.constants';
import { gltfConverterSilentLogger, LoadedGlTF } from './util';
import { NormalImportSetting } from '../../../source/handler/meta-schemas/glTF.meta';
import { RealArrayTrack } from 'cc/editor/exotic-animation';

describe('glTF converter: Morph import', () => {
    test('Morph animation on splitted meshes', () => {
        const jointCount = cc.pipeline.JOINT_UNIFORM_CAPACITY + 1; // So we can get mesh splitted.
        const nTriangles = jointCount;
        const nVertices = 3 * nTriangles;
        const basePositions = Float32Array.from({ length: 3 * nVertices }, (_, index) => index);
        const displacementPositions = Float32Array.from({ length: basePositions.length }, (_, index) => index * 0.01);
        const jointIndices = Uint16Array.from({ length: 4 * nVertices }, (_, index) => index / 4 / 3);
        const jointWeights = Float32Array.from({ length: jointIndices.length }, (_, index) => index);
        const nTarget = 3;
        const nMorphAnimationFrames = 1;
        const morphAnimationInputs = Float32Array.from({ length: nMorphAnimationFrames }, (_, index) => index);

        const model = new LoadedGlTF();
        model.glTF.meshes = [];
        const iMesh = model.glTF.meshes.length;
        model.glTF.meshes.push({
            primitives: [{
                attributes: {
                    POSITION: model.addAccessor(basePositions, GltfAccessorType.VEC3),
                    JOINTS_0: model.addAccessor(jointIndices, GltfAccessorType.VEC4),
                    WEIGHTS_0: model.addAccessor(jointWeights, GltfAccessorType.VEC4),
                },
                targets: [{
                    POSITION: model.addAccessor(displacementPositions, GltfAccessorType.VEC3),
                }, {
                    POSITION: model.addAccessor(displacementPositions, GltfAccessorType.VEC3),
                }, {
                    POSITION: model.addAccessor(displacementPositions, GltfAccessorType.VEC3),
                }],
            }, {
                attributes: { POSITION: model.addAccessor(basePositions, GltfAccessorType.VEC3) },
                targets: [{
                    POSITION: model.addAccessor(displacementPositions, GltfAccessorType.VEC3),
                }, {
                    POSITION: model.addAccessor(displacementPositions, GltfAccessorType.VEC3),
                }, {
                    POSITION: model.addAccessor(displacementPositions, GltfAccessorType.VEC3),
                }],
            }],
        });
        model.glTF.nodes = [];
        const iRootJoint = model.glTF.nodes.length;
        model.glTF.nodes.push({ children: Array.from({ length: jointCount }, (_, index) => iRootJoint + 1 + index) });
        model.glTF.nodes.push(...Array.from({ length: jointCount - 1 }, (_, index) => ({ name: `Joint-${index}` })));
        model.glTF.skins = [];
        const iSkin = model.glTF.skins.length;
        model.glTF.skins.push({
            skeleton: iRootJoint,
            joints: Array.from({ length: jointCount }, (_, index) => iRootJoint + index),
        });
        const iModelNode = model.glTF.nodes.length;
        model.glTF.nodes.push({
            mesh: iMesh,
            skin: iSkin,
        });
        model.glTF.animations = [];
        model.glTF.animations.push({
            channels: [{ target: { node: iModelNode, path: 'weights' }, sampler: 0 }],
            samplers: [{
                input: model.addAccessor(morphAnimationInputs, GltfAccessorType.SCALAR),
                output: model.addAccessor(new Float32Array(nTarget * nMorphAnimationFrames), GltfAccessorType.SCALAR),
            }],
        });

        const glTFConverter = new GltfConverter(model.glTF, model.buffers, '/dummy.glTF', {
            logger: gltfConverterSilentLogger,
            userData: {
                disableMeshSplit: false,
            },
        });

        const mesh = glTFConverter.createMesh(0);
        const subMeshCount = mesh.struct.primitives.length;
        expect(subMeshCount).toBe(3);

        const animationClip = glTFConverter.createAnimation(0);
        expect(animationClip.tracksCount).toBe(1);
        checkMorphTrack(animationClip.getTrack(0), nTarget);
    });

    describe('Mesh with empty morph data', () => {
        const nTriangles = 2;
        const nVertices = 3 * nTriangles;
        const nTargets = 3;
        const nKeyframes = 5;

        const model = new LoadedGlTF();

        model.glTF.meshes = [];
        model.glTF.meshes.push({
            primitives: [{
                attributes: {
                    POSITION: model.addAccessor(new Float32Array(3 * nVertices), GltfAccessorType.VEC3),
                },
                targets: Array.from({ length: nTargets }, () => {
                    // Empty morph
                    return {
                        POSITION: model.addAccessor(new Float32Array(3 * nVertices), GltfAccessorType.VEC3),
                    };
                }),
            }],
        });
        model.glTF.meshes.push({
            primitives: [{
                attributes: {
                    POSITION: model.addAccessor(new Float32Array(3 * nVertices), GltfAccessorType.VEC3),
                },
            }],
        });

        model.glTF.nodes = [];
        model.glTF.nodes.push({ mesh: 0 });
        model.glTF.nodes.push({ mesh: 1 });

        model.glTF.animations = [];
        model.glTF.animations.push({
            channels: [{ target: { node: 0, path: 'weights' }, sampler: 0 }],
            samplers: [{
                input: model.addAccessor(Float32Array.from({ length: nKeyframes }, (_, i) => 0.1 * i), GltfAccessorType.SCALAR),
                output: model.addAccessor(new Float32Array(nTargets * nKeyframes), GltfAccessorType.SCALAR),
            }],
        });
        model.glTF.animations.push({
            channels: [{ target: { node: 1, path: 'weights' }, sampler: 0 }],
            samplers: [{
                input: model.addAccessor(Float32Array.from({ length: nKeyframes }, (_, i) => 0.1 * i), GltfAccessorType.SCALAR),
                output: model.addAccessor(new Float32Array(nTargets * nKeyframes), GltfAccessorType.SCALAR),
            }],
        });

        test('Empty morph should still be imported', () => {
            const glTFConverter = new GltfConverter(model.glTF, model.buffers, '/dummy.glTF', {
                logger: gltfConverterSilentLogger,
                userData: {
                    normals: NormalImportSetting.exclude,
                },
            });
            const mesh = glTFConverter.createMesh(0);
            expect(mesh.struct.morph).not.toBeUndefined();
            expect(mesh.struct.morph!.subMeshMorphs).toHaveLength(1);
            expect(mesh.struct.morph!.subMeshMorphs[0]).not.toBeNull();
            expect(mesh.struct.morph!.subMeshMorphs[0]!.targets).toHaveLength(nTargets);
        });

        test('Morph animation should be imported even the mesh has empty morph', () => {
            const glTFConverter = new GltfConverter(model.glTF, model.buffers, '/dummy.glTF', {
                logger: gltfConverterSilentLogger,
                userData: {
                    normals: NormalImportSetting.exclude,
                },
            });
            const animationClip = glTFConverter.createAnimation(0);
            expect(animationClip.tracksCount).toBe(1);
            checkMorphTrack(animationClip.getTrack(0), nTargets);
        });

        test('Morph animation would be ignored if its target mesh has no morph targets', () => {
            const glTFConverter = new GltfConverter(model.glTF, model.buffers, '/dummy.glTF', {
                logger: gltfConverterSilentLogger,
                userData: {
                    normals: NormalImportSetting.exclude,
                },
            });
            const animationClip = glTFConverter.createAnimation(1);
            expect(animationClip.tracksCount).toBe(0);
        });
    });
});

function checkMorphTrack(track: cc.animation.Track, expectedTargetCount: number): asserts track is RealArrayTrack & {
    proxy: cc.animation.MorphWeightsAllValueProxy;
} {
    expect(track).toBeInstanceOf(RealArrayTrack);
    expect((track as RealArrayTrack).elementCount).toBe(expectedTargetCount);
    expect((track as RealArrayTrack).channels().length).toBe(expectedTargetCount);
    expect(track.proxy).toBeInstanceOf(cc.animation.MorphWeightsAllValueProxy);
}