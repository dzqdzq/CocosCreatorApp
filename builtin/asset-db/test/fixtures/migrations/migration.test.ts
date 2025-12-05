import ps from 'path';
import fs from 'fs-extra';
import * as cc from 'cc';
import { test } from '@jest/globals';
import { migrateCurveRange330 } from '../../../source/importer-3d/importers/migrates/migrate-curve-range-3-3-0';
import { migrateGeometryCurve330 } from '../../../source/importer-3d/importers/migrates/migrate-geometry-curve-3-3-0';
import { migrateAnimationClip330 } from '../../../source/importer-3d/importers/migrates/migrate-animation-clip-3-3-0';
import { Archive } from '../../../source/importer-3d/importers/utils/migration-utils';

describe('Migrations', () => {
    test.each([
        {
            title: '3.3.0/geometry.AnimationCurve',
            fn: migrateGeometryCurve330,
            home: 'geometry-curve-3-3-0',
        },
        {
            title: '3.3.0/CurveRange',
            fn: [migrateGeometryCurve330, migrateCurveRange330],
            home: 'curve-range-3-3-0',
        },
        {
            title: '3.3.0/AnimationClip',
            fn: [migrateAnimationClip330],
            home: 'animation-clip-3-3-0',
        },
        {
            title: '3.3.0/AnimationClip-ObjectCurve',
            fn: [migrateAnimationClip330],
            home: 'animation-clip-object-curve-3-3-0',
            skipVerify: true,
        },
    ].map((x) => [x.title, x]))('Migrates %s', async (_title, { title, fn, home, skipVerify }) => {
        const homeDir = ps.join(__dirname, 'migrations', home);
        const inputPath = ps.join(homeDir, 'input.json');
        const expectedOutputPath = ps.join(homeDir, 'output-expected.json');

        const json = await fs.readJSON(inputPath);

        const archive = new Archive(json);

        for (const migrateFn of Array.isArray(fn) ? fn : [fn]) {
            await migrateFn(archive);
        }

        const archiveResult = archive.get();

        const outputStringified = JSON.stringify(archiveResult, undefined, 2).replace(/\r\n/g, '\n');

        if (!await fs.pathExists(expectedOutputPath)) {
            if (!skipVerify) {
                verify(JSON.parse(outputStringified));
            }
            await fs.outputFile(expectedOutputPath, outputStringified, { encoding: 'utf8' });
        } else {
            const outputExpectedStringified = (await fs.readFile(expectedOutputPath, 'utf8')).replace(/\r\n/g, '\n');
            expect(outputExpectedStringified).toStrictEqual(outputStringified);
        }
    });
});

function verify(serialized: unknown) {
    const deserializedResult = cc.deserialize(serialized, undefined, undefined);
    // @ts-expect-error
    const againSerialized = EditorExtends.serialize(deserializedResult, { stringify: false });
    // TODO: `serialize()` generates `undefined` fields so we need to remove them
    const redo = JSON.parse(JSON.stringify(againSerialized, undefined, 2));
    expect(redo).toStrictEqual(serialized);
    // TODO: should serialize to the same
    // expect(JSON.stringify(againSerialized, undefined, 2)).toStrictEqual(JSON.stringify(serialized, undefined, 2));
}
