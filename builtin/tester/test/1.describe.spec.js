'use strict';

const { expect } = require('chai');

// 测试执行顺序以及 before | after

describe('Tester describe 测试', () => {
    let num = 0;

    describe('sub describe 1', () => {
        it('num === 2', () => {
            num++;
            expect(num).to.equal(2);
        });
    });

    it('num === 1', () => {
        num++;
        expect(num).to.equal(1);
    });

    describe('sub describe 2', () => {
        it('num === 3', () => {
            num++;
            expect(num).to.equal(3);
        });
    });

    describe('before', () => {

        before(() => {
            num++;
        });

        after(() => {
            num++;
        });

        it('num === 4', () => {
            expect(num).to.equal(4);
        });
    });

    describe('after', () => {
        it('num === 5', () => {
            expect(num).to.equal(5);
        });
    });

});