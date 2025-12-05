
declare global {
    namespace globalThis {
        // eslint-disable-next-line no-var
        var ENGINE_LOCATION: string;
    }
}

import './setup-engine-location';
import { serialize } from '../../../builtin/engine/source/editor-extends/utils/serialize';
import * as GeometryUtils from '../../../builtin/engine/source/editor-extends/utils/geometry';

// @ts-ignore
globalThis.EditorExtends = {
    serialize,
    GeometryUtils,
};

jest.mock('serialization-test-helper/run-test', () => {
    return require('../../../builtin/engine/test/editor-extends/serialization/run-test');
}, {
    virtual: true,
});

export {};
