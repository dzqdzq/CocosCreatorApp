import { GltfConverter } from '../../../source/handler/assets/utils/gltf-converter';
import * as cc from 'cc';
import * as glTF from '../../../@types/glTF';
import fs from 'fs-extra';
import ps from 'path';
import { URL, fileURLToPath } from 'url';
import { types } from '@babel/core';
import { linearToSrgb8Bit } from 'cc/editor/color-utils';
import { gltfConverterSilentLogger } from './util';

describe('glTF converter: Material', () => {
    describe('FBX-glTF-conv extras', () => {
        test('Autodesk 3dsMax Physical material', async () => {
            const material = await convertAssertSuccess('asdk-3dsmax-physical-material.gltf', {
                createMaterialOptions: {
                    smartMaterialEnabled: true,
                },
            });
            expect(material.effectAsset).not.toBeNull();
            expect(material.effectAsset!._uuid).toBe('db://internal/effects/util/dcc/imported-metallic-roughness.effect');
            expect((material.getProperty('mainColor') as cc.Color).toHEX()).toBe('bcbcbc');
            expect((material.getProperty('emissive') as cc.Color).toHEX()).toBe('000000');
            expect(material.getProperty('emissiveScale')).toBeCloseTo(1.0);
        });

        test('FBX Phong Material', async () => {
            const material = await convertAssertSuccess('glTF-material-phong.gltf', {
                createMaterialOptions: {
                    smartMaterialEnabled: true,
                },
            });
            expect(material.effectAsset).not.toBeNull();
            expect(material.effectAsset!._uuid).toBe('db://internal/effects/util/dcc/imported-specular-glossiness.effect');
            expect(material.getProperty('specularMap')).not.toBeNull();
        });

        test('Blender FBX Phong Material', async () => {
            const material = await convertAssertSuccess('glTF-blender-phong.gltf', {
                createMaterialOptions: {
                    smartMaterialEnabled: true,
                },
            });
            expect(material.effectAsset).not.toBeNull();
            expect(material.effectAsset!._uuid).toBe('db://internal/effects/util/dcc/imported-specular-glossiness.effect');
            expect(material.getProperty('specularMap')).not.toBeNull(); 
            expect(material.getProperty('mainTexture')).not.toBeNull();
            expect(material.getProperty('shininessExponent')).toBeCloseTo(43.08);
        });

        test('Test gltf pbrMetallicRoughness material property "emissiveFactor" with value [0.3, 0.2, 0.518]', async () => {
            const material = await convertAssertSuccess('glTF-material-emissive.gltf');
            expect(material.getProperty('emissiveScale')).toBeNull();
            expect((material.getProperty('emissive') as cc.Color).toHEX()).toBe('957cbf');
        });

        test('Test gltf pbrMetallicRoughness material property "emissiveFactor" is undefined', async () => {
            const material = await convertAssertSuccess('glTF-material-emissive.gltf', {}, 1);
            expect(material.getProperty('emissiveScale')).toBeNull();
            expect(material.getProperty('emissive')).toBeNull();
        });
        test('Test glTF-sepcular-glossiness material : ', async () => {
            const material = await convertAssertSuccess('glTF-sepcular-glossiness.gltf', {}, 0);
            expect((material.getProperty('mainColor') as cc.Color).toHEX()).toBe('00007c');
            expect((material.getProperty('specularColor') as cc.Color).toHEX()).toBe('7cd8fc');
            expect(material.getProperty('glossiness')).toEqual(0.9);
        });
        test('Test glTF-sepcular-glossiness material :', async () => {
            const material = await convertAssertSuccess('glTF-sepcular-glossiness.gltf', {}, 1);
            expect(material.getProperty('mainColor')).toBeNull();
            expect(material.getProperty('specularColor')).toBeNull();
            expect(material.getProperty('glossiness')).toEqual(0.5);
            expect(material.getProperty('mainTexture')).not.toBeNull();
            expect(material.getProperty('specularGlossinessMap')).not.toBeNull();
        });
        for (let i = 0; i < 21; i++){
            test(`Maya Phong Material_${i}`, async () => {
                const material = await convertAssertSuccess('glTF-maya-phong-transparency.gltf', {
                    createMaterialOptions: {
                        smartMaterialEnabled: true,
                    },
                }, i);
                expect(material.effectAsset!._uuid).toBe('db://internal/effects/util/dcc/imported-specular-glossiness.effect');
                expect((material.getProperty('mainColor') as cc.Color).a).toEqual(linearToSrgb8Bit(1 - i * 0.05));
            });
        }
    });
});

async function convertAssertSuccess(...args: Parameters<typeof convert>) {
    const material = await convert(...args);
    expect(material).not.toBeNull();
    return material!;
}

async function convert(
    caseName: string,
    {
        converterOptions,
        createMaterialOptions,
    }: {
        converterOptions?: GltfConverter.Options;
        createMaterialOptions?: Parameters<GltfConverter['createMaterial']>[3];
    } = {},
    materialIndex = 0,
): Promise<cc.Material | null> {
    const glTFFilePath = ps.resolve(fileURLToPath(new URL('./', import.meta.url)), 'inputs', caseName);
    const glTF = (await fs.readJson(glTFFilePath)) as glTF.GlTf;
    const glTFConverter = new GltfConverter(glTF, [], glTFFilePath, {
        logger: gltfConverterSilentLogger,
        ...converterOptions,
    });
    const material = glTFConverter.createMaterial(
        materialIndex,
        {
            find: () => {
                return null;
            },
        },
        (uuid) => {
            const effect = new cc.EffectAsset();
            effect._uuid = uuid;
            return effect;
        },
        createMaterialOptions ?? {},
    );
    return material;
}

