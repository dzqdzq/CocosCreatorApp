'use strict';

const { existsSync } = require('fs');
const { readJSONSync, outputJSONSync } = require('fs-extra');
const { join } = require('path');
const semver = require('semver');

const project = require('@editor/project');
const ipc = require('@base/electron-base-ipc');

const { Dialog } = require('@editor/creator/dist/dialog');
const { t, errorDialog, chooseProjectPath } = require('./util');
const { version } = require('@editor/setting'); // 编辑器当前版本

/**
 * 打开一个项目
 * @param {*} path 项目路径，如果打开新项目，则传入空值
 */
exports.openProject = async function(path) {
    try {
        if (!path) {
            path = await chooseProjectPath(t('open_project'));
        }
        if (!path) {
            return false;
        }

        // 判断路径是否存在,不存在则提示并从项目管理器中删除
        if (!existsSync(path)) {
            const result = await Dialog.warn(t('message.project_missing'), {
                title: t('project_missing'),
                buttons: [t('cancel')],
            });
            return false;
        }

        // 打开项目前的版本检测
        // 提示存在升级或降级的影响
        const pkgPath = join(path, 'package.json');
        const pkg = readJSONSync(pkgPath);
        let willOpen = true;
        const projectCreatorVersion = pkg.creator?.version || pkg.version;
        if (projectCreatorVersion) {
            const isUpgrade = semver.gt(semver.valid(semver.coerce(version)), semver.valid(semver.coerce(projectCreatorVersion)));
            const isDegrade = semver.lt(semver.valid(semver.coerce(version)), semver.valid(semver.coerce(projectCreatorVersion)));
            let message = '';
            let detail = '';

            if (isUpgrade) {
                message = t('message.upgrade_message');
                detail = t('message.upgrade_detail');
            }

            if (isDegrade) {
                message = t('message.degrade_message');
                detail = t('message.degrade_detail');
            }

            if (message) {
                detail = detail.replace('$$projectVersion', pkg.version)
                    .replace('$$editorVersion', version)
                    .replace('$$projectPath', path);

                const choose = await Dialog.warn(message, {
                    title: t('warn'),
                    detail,
                    buttons: [t('confirm'), t('cancel')],
                });
                willOpen = choose.response === 0;
            }

            if (!willOpen) {
                return false; // 决定不打开
            }
        }

        // 补充版本信息
        pkg.version = version;
        outputJSONSync(pkgPath, pkg, {
            spaces: 2,
        });
        // 实际打开流程
        project.open(path);
        return true;
    } catch (error) {
        await errorDialog(t('message.check_version_error', { error: error.message }), path);
        console.error(error);
        return false;
    }
};

