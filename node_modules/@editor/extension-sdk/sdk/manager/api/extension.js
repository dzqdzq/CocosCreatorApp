"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiQueryPackageDownloadInfo = exports.apiQueryExtensionDetailInfo = exports.apiQueryExtensionVersionList = exports.apiQueryExtensionList = void 0;
const utils_1 = require("../utils");
const apiQueryExtensionList = async (params) => {
    const result = await utils_1.httpClient.get('/module/list', {
        params,
    });
    return result.data;
};
exports.apiQueryExtensionList = apiQueryExtensionList;
const apiQueryExtensionVersionList = async (params) => {
    const result = await utils_1.httpClient.get('/module/versions', { params });
    return result.data;
};
exports.apiQueryExtensionVersionList = apiQueryExtensionVersionList;
const apiQueryExtensionDetailInfo = async (params) => {
    const result = await utils_1.httpClient.get('/module/details', { params });
    return result.data;
};
exports.apiQueryExtensionDetailInfo = apiQueryExtensionDetailInfo;
const apiQueryPackageDownloadInfo = async (params) => {
    const result = await utils_1.httpClient.get('/module/package', { params });
    return result.data;
};
exports.apiQueryPackageDownloadInfo = apiQueryPackageDownloadInfo;
