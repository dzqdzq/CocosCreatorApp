'use strict';

const { expect } = require('chai');

describe('Prefab的嵌套操作测试(直接在场景中测试)', async () => {
    const result = await Editor.Message.request('scene', 'unit-test', {name: 'nestedPrefabTest'});
    expect(result).to.true;
});

