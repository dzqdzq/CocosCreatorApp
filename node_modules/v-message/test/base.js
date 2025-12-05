'use strict';

const assert = require('assert');
const Message = require('../lib/message');

describe('message', () => {
    let message = new Message();

    it('zh - en', () => {
        message.register('zh');
        message.register('en');

        message.switch('zh');
        message.append({
            foo: { bar: 'zh' },
        });
        message.add('v.n', '_zh');

        message.switch('en');
        message.append({
            foo: { bar: 'en' },
        });
        message.add('v.n', '_en');

        message.switch('zh');
        assert.equal(message.query('foo.bar'), 'zh');
        assert.equal(message.query('v.n'), '_zh');
        assert.equal(message.query('v.n.a'), '');

        message.switch('en');
        assert.equal(message.query('foo.bar'), 'en');
        assert.equal(message.query('v.n'), '_en');
        assert.equal(message.query('v.n.a'), '');

        message.subtract({
            foo: { bar: 'en' },
        });
        message.remove('v.n');

        assert.equal(message.query('foo.bar'), '');
        assert.equal(message.query('v.n'), '');

    });
});