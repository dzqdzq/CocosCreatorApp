
import { serialize } from '../../../source/editor-extends/utils/serialize';
import { MissingScript, _decorator } from 'cc';

test('Serialize missing class', () => {
    const missingScript = new MissingScript();
    missingScript._$erialized = { __type__: '__missing_type__', foo: 2 } as unknown as null;
    const serialized = serialize(missingScript, { stringify: false });
    expect(serialized).toStrictEqual({
        __type__: '__missing_type__',
        foo: 2,
    });
});

