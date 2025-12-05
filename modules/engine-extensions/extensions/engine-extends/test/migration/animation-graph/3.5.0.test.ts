import {
    migrateVariables,
    NewPlainVariableSerialized,
    NewTriggerVariableSerialized,
    OldVariableSerialized,
    VariableType,
} from '../../../source/handler/assets/migrates/animation-graph/3.5.0';
import { Archive } from '../../../source/handler/assets/utils/migration-utils';

test('Migrate trigger variable', () => {
    for (const [input, expectedOutput] of [
        [makeSerializedOldVariable(), makeSerializedNewPlainVariable()],
        [makeSerializedOldVariable(VariableType.FLOAT), makeSerializedNewPlainVariable(VariableType.FLOAT)],
        [makeSerializedOldVariable(VariableType.FLOAT, 0.0), makeSerializedNewPlainVariable(VariableType.FLOAT, 0.0)],
        [makeSerializedOldVariable(undefined, 3.0), makeSerializedNewPlainVariable(undefined, 3.0)],
        [makeSerializedOldVariable(VariableType.FLOAT, 3.0), makeSerializedNewPlainVariable(VariableType.FLOAT, 3.0)],

        [makeSerializedOldVariable(VariableType.BOOLEAN), makeSerializedNewPlainVariable(VariableType.BOOLEAN)],
        [makeSerializedOldVariable(VariableType.BOOLEAN, false), makeSerializedNewPlainVariable(VariableType.BOOLEAN, false)],
        [makeSerializedOldVariable(VariableType.BOOLEAN, true), makeSerializedNewPlainVariable(VariableType.BOOLEAN, true)],

        [makeSerializedOldVariable(VariableType.INTEGER), makeSerializedNewPlainVariable(VariableType.INTEGER)],
        [makeSerializedOldVariable(VariableType.INTEGER, 0), makeSerializedNewPlainVariable(VariableType.INTEGER, 0)],
        [makeSerializedOldVariable(VariableType.INTEGER, 3), makeSerializedNewPlainVariable(VariableType.INTEGER, 3)],

        [makeSerializedOldVariable(VariableType.TRIGGER), makeSerializedNewTriggerVariable()],
        [makeSerializedOldVariable(VariableType.TRIGGER, false), makeSerializedNewTriggerVariable(0)],
        [makeSerializedOldVariable(VariableType.TRIGGER, true), makeSerializedNewTriggerVariable(1)],
    ] as Array<[input: unknown, expectedOutput: unknown]>) {
        const archive = new Archive(input);
        migrateVariables(archive);
        const output = archive.get();
        expect(output).toStrictEqual(expectedOutput);
    }
});

function makeSerializedOldVariable(type?: VariableType, value?: number | boolean) {
    const result: OldVariableSerialized = {
        __type__: 'cc.animation.Variable',
    };
    if (typeof type !== 'undefined') {
        result._type = type;
    }
    if (typeof value !== 'undefined') {
        result._value = value;
    }
    return result;
}

function makeSerializedNewPlainVariable(type?: VariableType.FLOAT | VariableType.INTEGER | VariableType.BOOLEAN, value?: number | boolean) {
    const result: NewPlainVariableSerialized = {
        __type__: 'cc.animation.PlainVariable',
    };
    if (typeof type !== 'undefined') {
        result._type = type;
    }
    if (typeof value !== 'undefined') {
        result._value = value;
    }
    return result;
}

function makeSerializedNewTriggerVariable(value?: number) {
    const result: NewTriggerVariableSerialized = {
        __type__: 'cc.animation.TriggerVariable',
    };
    if (typeof value !== 'undefined') {
        result._flags = value;
    }
    return result;
}
