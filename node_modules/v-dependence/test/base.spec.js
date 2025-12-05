'use strict';

const chai = require('chai');
const vDependence = require('../index');

describe('依赖管理器', function() {

    it('接口完整性', function(done) {
        const depend = vDependence.create();

        depend.add('a', {
            depends: [],
            handle() {
                done();
            },
        });
        depend.execute('a');
        depend.finish('a');
        depend.remove('a');
    });

    it('单向单层依赖(a > b)', function() {
        const depend = vDependence.create();

        depend.add('a');
        depend.add('b', {
            depends: ['a'],
            handle() {
                depend.finish('b');
            },
        });

        depend.finish('a');

        chai.expect(depend.name2item['a'].executed).to.equal(true);
        chai.expect(depend.name2item['b'].executed).to.equal(true);
    });

    it('单向多层依赖(a > b, b > c)', function() {
        const depend = vDependence.create();

        depend.add('a');
        depend.add('b', {
            depends: ['a'],
            handle() {
                depend.finish('b');
            },
        });
        depend.add('c', {
            depends: ['b'],
            handle() {
                depend.finish('c');
            },
        });

        depend.finish('a');

        chai.expect(depend.name2item['a'].executed).to.equal(true);
        chai.expect(depend.name2item['b'].executed).to.equal(true);
        chai.expect(depend.name2item['c'].executed).to.equal(true);
    });

    it('多向单层依赖(a > b, a > c)', function() {
        const depend = vDependence.create();

        depend.add('a');
        depend.add('b', {
            depends: ['a'],
            handle() {
                depend.finish('b');
            },
        });
        depend.add('c', {
            depends: ['a'],
            handle() {
                depend.finish('c');
            },
        });

        depend.finish('a');

        chai.expect(depend.name2item['a'].executed).to.equal(true);
        chai.expect(depend.name2item['b'].executed).to.equal(true);
        chai.expect(depend.name2item['c'].executed).to.equal(true);
    });

    it('多向多层依赖(a > b, a > c, d > bc, e > ad)', function() {
        const depend = vDependence.create();

        depend.add('a');
        depend.add('b', {
            depends: ['a'],
            handle() {
                depend.finish('b');
            },
        });
        depend.add('c', {
            depends: ['a'],
            handle() {
                depend.finish('c');
            },
        });
        depend.add('d', {
            depends: ['b', 'c'],
            handle() {
                depend.finish('d');
            },
        });
        depend.add('e', {
            depends: ['a', 'd'],
            handle() {
                depend.finish('e');
            },
        });

        depend.finish('a');

        chai.expect(depend.name2item['a'].executed).to.equal(true);
        chai.expect(depend.name2item['b'].executed).to.equal(true);
        chai.expect(depend.name2item['c'].executed).to.equal(true);
        chai.expect(depend.name2item['d'].executed).to.equal(true);
        chai.expect(depend.name2item['e'].executed).to.equal(true);
    });
});