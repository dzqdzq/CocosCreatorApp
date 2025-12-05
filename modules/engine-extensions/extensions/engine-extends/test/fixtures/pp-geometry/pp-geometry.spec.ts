
import { gfx } from 'cc';
import { PPGeometry, PPGeometryTypedArray, getNormalizer } from '../../../source/handler/assets/utils/pp-geometry';

type ArrayBufferView = Uint16Array | Uint32Array | Float32Array;

declare global {
    namespace jest {
        interface Matchers<R> {
            toBeExactArrayBufferView<T extends ArrayBufferView>(expected: T): CustomMatcherResult;
        }
    }
}

function average<T extends number[] | ArrayBufferView>(arr: T, by: number) {
    const group = arr.length / by;
    for (let iGroup = 0; iGroup < group; ++iGroup) {
        let sum = 0.0;
        for (let i = 0; i < by; ++i) {
            sum += arr[by * iGroup + i];
        }
        if (sum === 0.0) {
            continue;
        }
        for (let i = 0; i < by; ++i) {
            arr[by * iGroup + i] /= sum;
        }
    }
    return arr;
}

expect.extend({
    toBeExactArrayBufferView<T extends ArrayBufferView>(received: T, expected: T, epsilon = 1e-5) {
        if (!(received instanceof expected.constructor)) {
            return {
                pass: false,
                message: () => `Expected ${received} to be typeof ${expected.constructor.name}`,
            };
        }
        if (received.length !== expected.length) {
            return {
                pass: false,
                message: () => `Expected ${received} to have length ${expected.length}`,
            };
        }

        return received.every((v: number, i: number) => Math.abs(v - expected[i]) < epsilon) ? ({
            pass: true,
            message: () => `Expected ${received} not to be ${expected}`,
        }) : ({
            pass: false,
            message: () => `Expected ${received} to be ${expected}`,
        });
    },
});

test('pp-geometry:normalized-integer', () => {
    const normalize = (typedArray: PPGeometryTypedArray) => {
        const normalizer = getNormalizer(typedArray);
        if (normalizer) {
            return Float32Array.from(typedArray, normalizer);
        } else {
            return Float32Array.from(typedArray);
        }
    };

    const uTest = (constructor: Uint8ArrayConstructor | Uint16ArrayConstructor, expected: Float32Array) => {
        const bits = 8 * constructor.BYTES_PER_ELEMENT;
        expect(normalize(new constructor([
            0, // minimal
            2 ** (bits - 1) - 1, // middle - 1
            2 ** (bits - 1), // middle
            2 ** bits - 1, // maximum
        ]))).toBeExactArrayBufferView(expected);
    };
    uTest(Uint8Array, new Float32Array([
        0.0,
        0.4980392156,
        0.5019607843,
        1.0,
    ]));
    uTest(Uint16Array, new Float32Array([
        0.0,
        0.49999237060546875,
        0.5000076293945312,
        1.0,
    ]));

    const iTest = (constructor: Int8ArrayConstructor | Int16ArrayConstructor, expected: Float32Array) => {
        const bits = 8 * constructor.BYTES_PER_ELEMENT;
        expect(normalize(new constructor([
            -(2 ** (bits - 1)), // minimal
            -(2 ** (bits - 2)), // negative middle
            -(2 ** (bits - 2) - 1), // negative (middle - 1)
            0,
            2 ** (bits - 2) - 1, // middle -1
            2 ** (bits - 2), // middle
            2 ** (bits - 1) - 1, // maximum
        ]))).toBeExactArrayBufferView(expected);
    };
    iTest(Int8Array, new Float32Array([
        -1.0,
        -0.5039370059967041,
        -0.4960629940032959,
        0.0,
        0.4960629940032959,
        0.5039370059967041,
        1.0,
    ]));
    iTest(Int16Array, new Float32Array([
        -1.0,
        -0.5000152587890625,
        -0.4999847412109375,
        0.0,
        0.4999847412109375,
        0.5000152587890625,
        1.0,
    ]));
});

test('pp-geometry:reduce-joint-influences', () => {
    const jointsUnits = 4;

    const merge = (jointsWeights: Array<{
        joints: Uint8Array | Uint16Array,
        weights: PPGeometryTypedArray,
    }>, expected: {
        joints: Uint16Array,
        weights: Float32Array,
    }) => {
        expect(jointsWeights.length !== 0);
        expect(jointsWeights[0].joints.length % jointsUnits === 0);
        const nVertices = jointsWeights[0].joints.length / jointsUnits;
        const ppGeometry = new PPGeometry(nVertices, gfx.PrimitiveMode.POINT_LIST);
        jointsWeights.forEach(({ joints, weights }, set) => {
            expect(joints.length === jointsWeights[0].joints.length);
            expect(joints.length === weights.length);
            ppGeometry.setAttribute(PPGeometry.StdSemantics.set(PPGeometry.StdSemantics.joints, set), joints, jointsUnits);
            ppGeometry.setAttribute(PPGeometry.StdSemantics.set(PPGeometry.StdSemantics.weights, set), weights, jointsUnits);
        });
        ppGeometry.reduceJointInfluences();
        const attributes: Record<PPGeometry.Semantic, PPGeometry.Attribute> = {};
        ppGeometry.forEachAttribute((attribute) => {
            attributes[attribute.semantic] = attribute;
        });
        expect(attributes[PPGeometry.StdSemantics.set(PPGeometry.StdSemantics.joints, 0)].data).toBeExactArrayBufferView(
            expected.joints);
        expect(attributes[PPGeometry.StdSemantics.set(PPGeometry.StdSemantics.weights, 0)].data).toBeExactArrayBufferView(
            expected.weights);
    };

    merge([
        {
            joints: Uint16Array.from([0, 1, 2, 3]),
            weights: Float32Array.from([0.1, 0.5, 0.3, 0.6]),
        },
        {
            joints: Uint16Array.from([4, 5, 6, 7]),
            weights: Float32Array.from([0.2, 0.9, 0.3, 0.7]),
        },
    ], {
        joints: Uint16Array.from([5, 7, 3, 1]),
        weights: Float32Array.from(average([0.9, 0.7, 0.6, 0.5], jointsUnits)),
    });
});
