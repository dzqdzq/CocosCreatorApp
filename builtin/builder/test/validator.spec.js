const ps = require('path');
const { expect } = require('chai');
const { validatorManager, validator } = require(ps.join(__dirname, './../dist/share/common-options-validator'));

describe('校验函数的基础使用', () => {

    describe('validator', () => {
        it('validator.check noChinese', async () => {
            expect(validator.check('noChinese', '有中文')).to.be.false;
        });
        it('validator.check http', async () => {
            expect(validator.check('http', '192.168.11')).to.be.false;
            expect(validator.check('http', 'https://192.168.11')).to.be.true;
        });
        it('validator.has', async () => {
            expect(validator.has('http')).to.be.true;
        });
        it('validator.add', async () => {
            validator.add('newTestRul', function(val) {
                if (val) {
                    return true;
                }
                return false;
            });
            expect(validator.has('newTestRul')).to.be.true;
            expect(validator.check('')).to.be.false;
        });
    });
    describe('validatorManager', () => {
        it('addMessage addRule check', async () => {
            validatorManager.addMessage('newTestRul2', 'newTestRul2 Message');
            validatorManager.addRule('newTestRul2', function(val) {
                if (val) {
                    return true;
                }
                return false;
            }, 'testPkg');
            expect(validatorManager.check('newTestRul2', {}, ['newTestRul2', 'http'])).equal('newTestRul2 Message');
        });
    });
});
