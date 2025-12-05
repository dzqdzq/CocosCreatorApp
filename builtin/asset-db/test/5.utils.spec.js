'use strict';

const { expect } = require('chai');

const { transTimeToNumber } = require('../dist/worker/console');
const { sortAssetCreateMenu } = require('../dist/share/utils');

describe('transTimeToNumber', () => {
    it('2022-11-15 15-50.log', () => {
        expect(transTimeToNumber('2022-11-15 15-50.log') === 1668498600000);
    });
    it('2023-3-8 09-49', () => {
        expect(transTimeToNumber('2023-3-8 09-49') === 1678240140000);
    });
});

describe('sortAssetCreateMenu', () => {
    it('常规排序', () => {
        const testMenu = [{
            handler: 'render-pipeline',
        }, {
            handler: 'test1',
        }, {
            handler: 'script',
        }, {
            handler: 'scene',
        }, {
            handler: 'test2',
        }];
        sortAssetCreateMenu(testMenu);
        expect(testMenu[0].handler).equal('scene');
        expect(testMenu[1].handler).equal('script');
        expect(testMenu[2].handler).equal('render-pipeline');
        expect(testMenu[3].handler).equal('test1');
    });
});