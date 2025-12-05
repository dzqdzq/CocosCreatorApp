'use strict';

const { expect } = require('chai');

const { transTimeToNumber } = require('../dist/worker/console');

describe('transTimeToNumber', () => {
    it('2022-11-15 15-50.log', () => {
        expect(transTimeToNumber('2022-11-15 15-50.log') === 1668498600000);
    });
    it('2023-3-8 09-49', () => {
        expect(transTimeToNumber('2023-3-8 09-49') === 1678240140000);
    });
});