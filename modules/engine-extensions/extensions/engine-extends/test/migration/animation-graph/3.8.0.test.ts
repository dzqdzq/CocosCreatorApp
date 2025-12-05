import { URL, fileURLToPath } from 'url';
import {
    migrateAnimationGraph_3_8_0,
} from '../../../source/handler/assets/migrates/animation-graph/3.8.0';
import { Archive } from '../../../source/handler/assets/utils/migration-utils';
import fs from 'fs-extra';
import ps from 'path';

test('Migrate animation graph 3.8.0', async () => {
    const data = await fs.readJson(ps.join(
        fileURLToPath(new URL('../test-inputs', import.meta.url)),
        'target-3.8.0',
        'source-3.7.2',
        'assets',
        'animation-graphs',
        'default.animgraph',
    ));
    const archive = new Archive(data);
    migrateAnimationGraph_3_8_0(archive);
    const output = JSON.parse(JSON.stringify(archive.get()));
    expect(output).toMatchSnapshot();
});
