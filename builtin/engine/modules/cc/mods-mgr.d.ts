declare const modsMgr: {
    /**
     * 同步导入一个引擎模块。
     * @param specifier 引擎模块名。
     */
    syncImport(specifier: string): any;
};

export = modsMgr;
