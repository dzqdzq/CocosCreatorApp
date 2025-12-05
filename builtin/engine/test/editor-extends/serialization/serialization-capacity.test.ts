
import { serialize } from '../../../source/editor-extends/utils/serialize';
import { _decorator } from 'cc';

@_decorator.ccclass('Foo')
class Foo { @_decorator.property foo!: Foo | null; }

const EXPECTED_CAPACITY = 900;

test('Serialization capacity', () => {
    const foo = createVeryDeepFoo(EXPECTED_CAPACITY);
    expect(() => serialize(foo, { stringify: false })).not.toThrow();
});

function createVeryDeepFoo(depth: number) {
    if (depth === 0) {
        return null;
    } else {
        const foo = new Foo();
        foo.foo = createVeryDeepFoo(depth - 1);
        return foo;
    }
}
