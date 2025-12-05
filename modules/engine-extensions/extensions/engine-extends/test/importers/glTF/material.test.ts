import { GltfConverter } from '../../../source/importer/importers/utils/gltf-converter';
import * as cc from 'cc';
import * as glTF from '../../../@types/glTF';
import fs from 'fs-extra';
import ps from 'path';

describe('glTF converter: Material', () => {
    describe('FBX-glTF-conv extras', () => {
        test('Autodesk 3dsMax Physical material', async () => {
            const material = await convertAssertSuccess('asdk-3dsmax-physical-material.gltf');
            expect(material.effectAsset).not.toBeNull();
            expect(material.effectAsset!._uuid).toMatchInlineSnapshot(`"db://internal/effects/surfaces/builtin-dcc-metalRough.effect"`);
            expect((material.getProperty('mainColor') as cc.Color).toHEX()).toMatchInlineSnapshot(`"7f7f7f"`);
            expect((material.getProperty('emissive') as cc.Color).toHEX()).toMatchInlineSnapshot(`"000000"`);
            expect(material.getProperty('emissiveScale')).toBeCloseTo(1.0);
        });

        test('.....', async () => {
        });
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
    const glTFFilePath = ps.resolve(__dirname, 'inputs', caseName);
    const glTF = (await fs.readJson(glTFFilePath)) as glTF.GlTf;
    const glTFConverter = new GltfConverter(glTF, [], glTFFilePath, converterOptions);
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
