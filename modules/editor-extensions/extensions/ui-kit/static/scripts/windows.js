'use strict';
const { join, extname, basename } = require('path');
module.paths.push(join(Editor.App.path, 'node_modules'));
const i18nHandler = require('@base/electron-i18n');
const { existsSync, outputFileSync, readJsonSync, readFileSync, removeSync } = require('fs-extra');
const { parse } = require('url');
const Profile = require('@base/electron-profile');
const profile = Profile.load('global://editor/ui-kit.json');
const { registerTranslator, updateTranslate } = require('@editor/creator-ui-kit/dist/renderer');

const defaultStep = 0.1;
const step = profile.get('num-input.step') ?? defaultStep;

function attach(name, file) {
    const mod = require(file);
    Editor.UI.register('ui-' + name, mod.element);
}

exports.load = function() {
    // 注册翻译方法
    registerTranslator(Editor.I18n.t);
    updateTranslate();
    i18nHandler.on('switch', () => {
        // 切换语言时更新翻译内容
        updateTranslate();
    });
    const list = Editor.Package.getPackages({ enable: true });
    // 记录注册过的 ui 组件名称
    const registeredUIComponentNameList = [];
    function register(item) {
        if (item.info.contributions && item.info.contributions['ui-kit']) {
            if (item.info.contributions['ui-kit'].element) {
                for (const name in item.info.contributions['ui-kit'].element) {
                    if (!item.info.contributions['ui-kit'].element[name]) {
                        continue;
                    }
                    const file = join(item.path, item.info.contributions['ui-kit'].element[name]);
                    const mod = require(file);
                    mod.load && mod.load();
                    const uiComponentName = 'ui-' + name;
                    // 已注册的组件不再注册
                    if (!registeredUIComponentNameList.includes(uiComponentName)) {
                        Editor.UI.register(uiComponentName, mod.element);
                        registeredUIComponentNameList.push(uiComponentName);
                    }
                }
            }
            if (item.info.contributions['ui-kit']['ui-prop']) {
                const info = item.info.contributions['ui-kit']['ui-prop'];
                for (const key in info.render) {
                    if (!info.render[key]) {
                        continue;
                    }
                    try {
                        const mod = require(join(item.path, info.render[key]));
                        Editor.UI.Prop.registerRender(key, mod);
                    } catch (error) {
                        console.error(error);
                    }
                }
            }
        }
    }
    list.forEach(register);
    Editor.Package.on('enable', register);

    // ---- NumInput 组件 ----
    // 若 偏好设置设置了步长
    Editor.UI.NumInput._setStep(step);

    // ---- Image 组件 ----
    Image.init();

    // ---- Link 组件 ----
    Editor.UI.Link.setLinkHandle(async function(value, type) {
        if (!type) {
            return false;
        }

        value = value.trim();

        switch (type) {
            case 'assetUrl':
                value = await Editor.Message.request('asset-db', 'query-uuid', value);
                if (Editor.Utils.UUID.isUUID(value)) {
                    Editor.Message.send('assets', 'twinkle', value);
                }
                return true;
            case 'assetUuid':
                // 资源 uuid 在节点上
                if (Editor.Utils.UUID.isUUID(value)) {
                    Editor.Message.send('assets', 'twinkle', value);
                }
                return true;
            case 'nodeUuid':
                if (Editor.Utils.UUID.isUUID(value)) {
                    Editor.Message.send('hierarchy', 'twinkle', value);
                }
                return true;
            case 'message':
                try {
                    const messageParams = JSON.parse(value);
                    if (!messageParams || messageParams.length < 3 || !['send', 'broadcast'].includes(messageParams[0])) {
                        console.warn(`Invalid link value: ${value}`);
                        return;
                    }
                    const messageType = messageParams.shift();
                    Editor.Message[messageType](...messageParams);
                } catch (error) {
                    console.warn(error);
                    console.warn(`Invalid link value: ${value}`);
                }
        }
    });

    // 注册打开 curve 面板方法
    Editor.UI.Curve.registerOpenHandle(async function(e) {
        const $elem = e?.target;
        Editor.Panel.__protected__.openKit('ui-kit.curve-editor', {
            elem: $elem,
            params: [
                {
                    value: $elem.value || {
                        keys: [],
                        keyFrames: [],
                        multiplier: 1,
                        postWrapMode: 1,
                        preWrapMode: 1,
                    },
                    config: $elem.config,
                    label: $elem.getAttribute('label'),
                },
            ],
            listeners: {
                confirm: (detail) => {
                    if (!detail) return;
                    $elem.value = detail.value;
                    $elem.dispatch('confirm', detail.value);
                },
                change: (detail) => {
                    if (!detail) return;
                    $elem.value = detail.value;
                    $elem.dispatch('change', detail.value);
                },
                cancel: (detail) => {
                    if (!detail) return;
                    $elem.value = detail.value;
                    $elem.dispatch('cancel', detail.value);
                },
            },
        });
    });

    // 注册 Clipboard
    Editor.UI.CurveEditor.registerClipboardHandle(Editor.Clipboard);

    // 注册 color 打开 color-picker 面板方法
    Editor.UI.Color.registerPanelHandle(async function(event) {
        const $elem = this;
        Editor.Panel.__protected__.openKit('ui-kit.color-picker', {
            elem: $elem,
            params: [
                {
                    value: $elem.value ?? '[0,0,0,1]',
                },
            ],
            listeners: {
                confirm: (detail) => {
                    if (!detail) return;
                    $elem.value = detail.value;
                    $elem.dispatch('confirm', detail.value);
                },
                change: (detail) => {
                    if (!detail) return;
                    $elem.value = detail.value;
                    $elem.dispatch('change', detail.value);
                },
                cancel: (detail) => {
                    if (!detail) return;
                    $elem.value = detail.value;
                    $elem.dispatch('cancel', detail.value);
                },
            },
        });
    });

    // 注册 color picker 存储 preset 数据的方法
    Editor.UI.ColorPicker.registerSetColorStorageHandle(function(colors = []) {
        profile.set('color-picker.staging-colors', colors);
        profile.save();
    });

    // 注册 color picker 获取 preset 数据的方法
    Editor.UI.ColorPicker.registerGetColorStorageHandle(function() {
        return profile.get('color-picker.staging-colors') ?? [];
    });

    // 注册 gradient 打开 gradient-picker 面板方法
    Editor.UI.Gradient.registerPanelHandle(async function(e) {
        const $elem = e?.target;
        Editor.Panel.__protected__.openKit('ui-kit.gradient-picker', {
            elem: $elem,
            params: [
                {
                    value: $elem.value,
                },
            ],
            listeners: {
                confirm: (detail) => {
                    if (!detail) return;
                    $elem.value = detail.value;
                    $elem.dispatch('confirm', detail.value);
                },
                change: (detail) => {
                    if (!detail) return;
                    $elem.value = detail.value;
                    $elem.dispatch('change', detail.value);
                },
                cancel: (detail) => {
                    if (!detail) return;
                    $elem.value = detail.value;
                    $elem.dispatch('cancel', detail.value);
                },
            },
        });
    });

    // 注册 setting 组件的 profile
    Editor.UI.Setting.setProfile(Editor.Profile);

    // profile change 回调
    Profile.on('change', (protocol, file, key, value) => {
        if (protocol === 'global' && file === 'editor/ui-kit.json') {
            // 更新 num-input tooltip setp
            if (key === 'num-input.step') {
                Editor.UI.NumInput._changeToolTipHandle(value);
            }
        }
    });
};

exports.unload = function() {
    // Editor.UI.Image.setNameTranslator(null);
};

// 图片缩略图的生成，队列，缓存和更新
const Image = {
    dbInfos: {}, // 缓存 db url 根路径 db://assets 的磁盘路径信息
    init() {
        Editor.UI.Image.setSrcTranslator(async function(value) {
            if (!value) {
                return '';
            }

            if (value.startsWith('db://')) {
                value = await Editor.Message.request('asset-db', 'query-uuid', value);
            }

            const rootUuid = value.split('@').shift();
            if (Editor.Utils.UUID.isUUID(rootUuid)) {
                const asset = await Editor.Message.request('asset-db', 'query-asset-info', value);
                if (!asset) {
                    return '';
                }

                if (value.indexOf('@') !== -1) {
                    if (asset.importer === 'gltf-mesh') {
                        return await Image.modelImage(asset);
                    }

                    return await Image.subImage(asset, this.size);
                } else {
                    return await Image.image(asset, this.size);
                }
            }

            return value;
        });

        Editor.UI.Image.prototype._onConnectedCallback = function() {
            this.addEventListener('click', Image.bindClick);
        };
        Editor.UI.Image.prototype._onDisconnectedCallback = function() {
            this.removeEventListener('click', Image.bindClick);
        };
    },
    bindClick() {
        Editor.Message.send('assets', 'twinkle', this.value.trim());
    },
    /**
     * 获取缩略图
     * @param asset 资源
     * @param size 缩略图的da
     */
    async getThumbnail(asset, size) {
        const url = parse(asset.path);
        let dbInfo = this.dbInfos[url.host];

        // 编辑器启动，删除之前已缓存的缩略图
        if (!dbInfo) {
            dbInfo = await Editor.Message.request('asset-db', 'query-db-info', url.host);
            this.dbInfos[url.host] = dbInfo;
        }

        const parentDir = asset.uuid.substr(0, 2);
        const cachePath = join(dbInfo.temp, parentDir, asset.uuid, size);
        if (existsSync(cachePath)) {
            const base64 = readFileSync(cachePath, 'utf8');
            return base64;
        }

        return cachePath;
    },
    /**
     * 生成缩略图
     * @param src 原图片地址，含缓存标识 ?refreshTime
     * @param cachePath 缩略图路径
     * @param userData 原图附加信息
     */
    async setThumbnail(src, cachePath, userData = {}) {
        const img = document.createElement('img');

        // 增加随机数去掉图片缓存
        img.src = src.replace('#', '%23');
        const loaded = await new Promise((resolve) => {
            img.addEventListener('load', () => {
                resolve(img);
            });
            img.addEventListener('error', () => {
                resolve(false);
            });
        });

        if (loaded === false) {
            return '';
        }

        const size = basename(cachePath);

        const sizes = size.split(',');
        const sizeWidth = Number(sizes[0]) || img.width;
        const sizeHeight = Number(sizes[1]) || img.height;

        let width = userData.width || img.width;
        let height = userData.height || img.height;

        const coefficientWidth = width / sizeWidth;
        const coefficientHeight = height / sizeHeight;

        const canvas = document.createElement('canvas');
        canvas.width = sizeWidth;
        canvas.height = sizeHeight;
        const context = canvas.getContext('2d');

        if (userData.rotated) {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            context.translate(centerX, centerY);
            context.rotate((-90 * Math.PI) / 180);
            context.translate(-centerX, -centerY);

            width = userData.height;
            height = userData.width;
        }

        context.drawImage(
            img,
            userData.trimX || 0,
            userData.trimY || 0,
            width,
            height,
            (sizeWidth - width / coefficientWidth) / 2,
            (sizeHeight - height / coefficientHeight) / 2,
            width / coefficientWidth,
            height / coefficientHeight,
        );

        const value = canvas.toDataURL('image/png');
        outputFileSync(cachePath, value);

        return value;
    },
    /**
     * 找到图片资源的缩略图
     * @param asset 资源
     * @param size 是否指定了输出缩略图的大小 如 '100,100'
     */
    async image(asset, size) {
        const fileExt = extname(asset.name).toLowerCase();

        if (!size) {
            const src = this.getLibraryImageSrc(asset.library, fileExt);

            return src ? `${src}?${Date.now()}` : '';
        }

        const base64DataOrCachePath = await this.getThumbnail(asset, size);
        if (!base64DataOrCachePath || base64DataOrCachePath.startsWith('data:image')) {
            return base64DataOrCachePath;
        }

        const src = this.getLibraryImageSrc(asset.library, fileExt);

        const cacheSrc = await this.setThumbnail(`${src}?${Date.now()}`, base64DataOrCachePath);
        if (cacheSrc === false) {
            console.warn(`Load thumbnail failed: ${asset.url}`);
        }
        return cacheSrc;
    },

    /**
     * 找到 subAsset 图片资源的缩略图
     * @param asset 资源
     * @param size 是否指定了输出缩略图的大小 如 '100, 100' 或 '50, 100'
     */
    async subImage(asset, size) {
        const meta = await Editor.Message.request('asset-db', 'query-asset-meta', asset.uuid);
        if (!meta || !meta.userData) {
            return '';
        }

        let imageUuid = meta.userData.imageUuidOrDatabaseUri;
        if (meta.importer === 'gltf-embeded-image') {
            imageUuid = meta.uuid;
        } else if (meta.importer === 'texture-cube-face') {
            imageUuid = meta.uuid;
        } else if (meta.importer === 'sprite-frame') {
            imageUuid = meta.userData.imageUuidOrDatabaseUri.split('@')[0];
        }

        if (!imageUuid) {
            return '';
        }

        const imageAsset = await Editor.Message.request('asset-db', 'query-asset-info', imageUuid);
        if (!imageAsset) {
            return '';
        }

        const base64DataOrCachePath = await this.getThumbnail(asset, size || `${meta.userData.width},${meta.userData.height}`);
        if (!base64DataOrCachePath || base64DataOrCachePath.startsWith('data:image')) {
            return base64DataOrCachePath;
        }

        const fileExt = extname(imageAsset.name).toLocaleLowerCase();
        const src = this.getLibraryImageSrc(imageAsset.library, fileExt);

        if (!size && src && (!meta.userData.width || !meta.userData.height)) {
            return src;
        }

        const cacheSrc = await this.setThumbnail(`${src}?${Date.now()}`, base64DataOrCachePath, meta.userData);
        if (cacheSrc === false) {
            console.warn(`Load thumbnail failed: ${asset.url}`);
        }
        return cacheSrc;
    },
    /**
     * 工具函数，从 library 属性中找到图片地址
     * @param library 属性
     * @param fileExt 图片后缀
     */
    getLibraryImageSrc(library, fileExt) {
        let src = library[fileExt];
        if (!src) {
            const key = Object.keys(library).find((key) => key !== '.json') || '';
            src = library[key];
        }

        return src;
    },

    /**
     * 模型资源的缩略图
     * @param asset 资源
     */
    async modelImage(asset) {
        let thumbnail = '';

        const src = await Editor.Message.request('scene', 'query-thumbnail', [asset.uuid]);
        if (Array.isArray(src) && src.length) {
            thumbnail = src[0];
        }
        return thumbnail;
    },
};
