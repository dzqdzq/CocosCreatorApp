const { expect } = require('chai');
const { checkPackageNameValidity } = require('./../dist/builder/utils');

describe('检查 mac 包名合法', () => {
    it('包名支持包含连接符字符数字和 .', () => {
        expect(checkPackageNameValidity('test-ff-67dg.com')).to.not.equal('');
    });
});
