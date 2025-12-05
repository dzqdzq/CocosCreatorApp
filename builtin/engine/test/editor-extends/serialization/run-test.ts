
import fs from 'fs-extra';
import { serialize, serializeCompiled } from '../../../source/editor-extends/utils/serialize';
import { CCON } from 'cc/editor/serialization';
import { calculatePortSnapshotPath } from './shared/port';
import type { RunTest } from './shared/utils';

export const runTest: RunTest = async (caseModulePath, port, value, verify) => {
    const {
        useCCON = false,
        compiled = false,
    } = port.serializeOptions;
    const serializeFn = compiled ? serializeCompiled : serialize;
    const serialized = serializeFn(value, { stringify: false, ...port.serializeOptions });
    const snapshotPath = calculatePortSnapshotPath(caseModulePath, port.name);
    if (useCCON) {
        const { document, chunks } = serialized as CCON;
        const merged = { document, chunks: chunks.map((chunk) => Array.from(chunk)) };
        if (!await fs.pathExists(snapshotPath)) {
            await fs.outputFile(snapshotPath, JSON.stringify(merged, undefined, 2), { encoding: 'utf8' });
        } else {
            const json = JSON.parse(await fs.readFile(snapshotPath, 'utf8'));
            expect(merged).toStrictEqual(json);
        }
    } else {
        if (!await fs.pathExists(snapshotPath)) {
            await fs.outputFile(snapshotPath, JSON.stringify(serialized, undefined, 2), { encoding: 'utf8' });
        } else {
            const json = JSON.parse(await fs.readFile(snapshotPath, 'utf8'));
            expect(serialized).toStrictEqual(json);
        }
    }
};
