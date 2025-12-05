import ps from 'path';
import fs from 'fs-extra';
import * as cc from 'cc';
import { migrateCurveRange330 } from '../../../source/handler/assets/migrates/migrate-curve-range-3-3-0';
import { migrateGeometryCurve330 } from '../../../source/handler/assets/migrates/migrate-geometry-curve-3-3-0';
import { migrateAnimationClip330 } from '../../../source/handler/assets/migrates/migrate-animation-clip-3-3-0';
import { Archive } from '../../../source/handler/assets/utils/migration-utils';
import { fileURLToPath, URL } from 'url';

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
        const homeDir = fileURLToPath(new URL(`./migrations/${home}/`, import.meta.url));
        const inputPath = ps.join(homeDir, 'input.json');

        const json = await fs.readJson(inputPath);

        const archive = new Archive(json);

        for (const migrateFn of Array.isArray(fn) ? fn : [fn]) {
            await migrateFn(archive);
        }

        const archiveResult = JSON.parse(JSON.stringify(archive.get()));

        expect(archiveResult).toMatchSnapshot();
    });
});
