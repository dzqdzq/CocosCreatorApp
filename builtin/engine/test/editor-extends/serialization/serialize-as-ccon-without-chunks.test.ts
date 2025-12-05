
import { CCON } from 'cc/editor/serialization';
import { serialize } from '../../../source/editor-extends/utils/serialize';

test('Serialize as CCON without chunks', () => {
    const serialized = serialize({ foo: 'bar' }, { useCCON: true }) as CCON;
    expect(serialized).toBeInstanceOf(CCON);
    expect(serialized.chunks).toHaveLength(0);
});

