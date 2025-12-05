'use strict';

const { expect } = require('chai');

describe('Prefab的TargetOverride操作测试(直接在场景中测试)', async () => {
    const result = await Editor.Message.request('scene', 'unit-test', {name: 'targetOverrideTest'});
    expect(result).to.true;
});

