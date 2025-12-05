'use strict';

const assert = require('assert');
const utils = require('../lib/utils');

describe('utils', () => {

    let target = {};
    let reference = {
        array: [
            {
                string: '',
                number: 1,
                empty: null,
                miss: undefined,
            },
        ],
        object: {
            string: '',
            number: 1,
            empty: null,
            miss: undefined,
        },
        string: '',
        number: 1,
        empty: null,
        miss: undefined,
    };
    it('deepCopyObject', () => {
        utils.deepCopyObject(target, reference);
        assert.equal(Array.isArray(target.array), true);
        assert.equal(target.array[0].string, '');
        assert.equal(target.object.empty, null);
        assert.equal(target.miss, undefined);

        reference.array[0].string = 'changed';
        reference.object.empty = false;
        reference.miss = 'V...';

        assert.equal(Array.isArray(target.array), true);
        assert.equal(target.array[0].string, '');
        assert.equal(target.object.empty, null);
        assert.equal(target.miss, undefined);
    });

    it('deepEliminateObject', () => {
        utils.deepEliminateObject(target, reference);
        assert.equal(target.array, undefined);
        assert.equal(target.object, undefined);
    });

});