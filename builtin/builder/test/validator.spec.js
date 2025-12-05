const ps = require('path');
const { expect } = require('chai');
const { validatorManager, validator } = require(ps.join(__dirname, './../dist/share/validator-manager'));

describe('校验函数的基础使用', () => {

    describe('validator', () => {
        it('validator.check noChinese', async () => {
            expect(validator.check('noChinese', '有中文')).to.be.ok;
        });
        it('validator.check http', async () => {
            expect(validator.check('http', '192.168.11')).to.be.ok;
            expect(validator.check('http', 'https://192.168.11')).to.equal('');
        });
        it('validator.has', async () => {
            expect(validator.has('http')).to.be.true;
        });
        it('validator.add', async () => {
            validator.add('newTestRul', {
                message: 'not exist',
                func: function(val) {
                    if (val) {
                        return true;
                    }
                    return false;
                },
            });
            expect(validator.has('newTestRul')).to.be.true;
            expect(validator.check('newTestRul', '')).to.equal('not exist');
        });
    });
    describe('validatorManager', () => {
        it('addMessage addRule check', async () => {
            validatorManager.addRule('newTestRul2', {
                message: 'newTestRul2 Message',
                func: function(val) {
                    if (val === 'test') {
                        return true;
                    }
                    return false;
                },
            });
            const checkRes = await validatorManager.check('fff', ['newTestRul2', 'http']);
            expect(checkRes).equal('newTestRul2 Message');
        });
    });
});
