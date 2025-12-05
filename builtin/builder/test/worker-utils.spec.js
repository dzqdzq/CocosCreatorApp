const { getLibraryDir } = require('../dist/worker/builder/utils/index');
const { expect } = require('chai');

describe('getLibraryDir', () => {
    it('从项目 library 地址上获取', () => {
        expect(getLibraryDir('F:\\projects\\editor-examples-dev\\projects\\build-example\\library\\38\\38cc5e6b-be65-427c-b97d-815603cc500b.cconb')).to.equal('F:\\projects\\editor-examples-dev\\projects\\build-example\\library');
        expect(getLibraryDir('/Users/admin/cocos-test-editor/projects/build-example/library/38/38cc5e6b-be65-427c-b97d-815603cc500b.cconb')).to.equal('/Users/admin/cocos-test-editor/projects/build-example/library');
    });
    it('从全局 library 地址上获取', () => {
        expect(getLibraryDir('C:\\Users\\ADMINI~1\\AppData\\Local\\Temp\\CocosCreator\\3.8.5\\asset-db\\library\\12\\12cc5e6b-be65-427c-b97d-815603cc500b.png')).to.equal('C:\\Users\\ADMINI~1\\AppData\\Local\\Temp\\CocosCreator\\3.8.5\\asset-db\\library');
        expect(getLibraryDir('/var/folders/_h/848b7c4x3hvf7wfhz8ft1m700000gn/T/CocosCreator/3.8.5/asset-db/library/12/12cc5e6b-be65-427c-b97d-815603cc500b.png')).to.equal('/var/folders/_h/848b7c4x3hvf7wfhz8ft1m700000gn/T/CocosCreator/3.8.5/asset-db/library');
    });
});