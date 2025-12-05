

import { GltfConverter } from '../../../source/importer/importers/utils/gltf-converter';
import * as cc from 'cc';
import * as glTF from '../../../@types/glTF';
import { GltfAccessorType } from '../../../source/importer/importers/utils/glTF.constants';
import { LoadedGlTF } from './util';

describe('glTF converter: Morph import', () => {
    test('Morph animation on splitted meshes', () => {
        const nTriangles = 2;
        const nVertices = 3 * nTriangles;
        const basePositions = Float32Array.from({ length: 3 * nVertices }, (_, index) => index);
        const displacementPositions = Float32Array.from({ length: basePositions.length }, (_, index) => index * 0.01);
        const jointIndices = Uint16Array.from({ length: 4 * nVertices }, (_, index) => index);
        const jointWeights = Float32Array.from({ length: jointIndices.length }, (_, index) => index);
        const jointCount = 66; // So we can get mesh splitted.
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

        const glTFConverter = new GltfConverter(model.glTF, model.buffers, '/dummy.glTF');

        const mesh = glTFConverter.createMesh(0);
        const subMeshCount = mesh.struct.primitives.length;
        expect(subMeshCount).toBeGreaterThan(2);

        const animationClip = glTFConverter.createAnimation(0);
        const nSplittedSubMeshCount = subMeshCount - 1;
        const tracks = Array.from(animationClip.tracks);
        expect(tracks.length).toBe((nSplittedSubMeshCount + 1) * nTarget);
        const morphAnimationTargets: Array<{ subMeshIndex: number; shapeIndex: number; }> = [];
        for (const track of tracks) {
            const channels = Array.from(track.channels());
            expect(channels.length).toBe(1);
            expect(channels[0].curve).toBeInstanceOf(cc.RealCurve);
            const { path, proxy } = track;
            expect(proxy).toBeInstanceOf(cc.animation.MorphWeightValueProxy);
            morphAnimationTargets.push({
                subMeshIndex: (proxy as cc.animation.MorphWeightValueProxy).subMeshIndex,
                shapeIndex: (proxy as cc.animation.MorphWeightValueProxy).shapeIndex,
            });
        }
        const expectedMorphAnimationTargets: typeof morphAnimationTargets = [];
        for (let iSubMesh = 0; iSubMesh < subMeshCount; ++iSubMesh) {
            for (let iTarget = 0; iTarget < nTarget; ++iTarget) {
                expectedMorphAnimationTargets.push({ subMeshIndex: iSubMesh, shapeIndex: iTarget });
            }
        }
        expect(morphAnimationTargets).toHaveLength(expectedMorphAnimationTargets.length);
        expect(morphAnimationTargets).toStrictEqual(expect.arrayContaining(expectedMorphAnimationTargets));
    });
});
