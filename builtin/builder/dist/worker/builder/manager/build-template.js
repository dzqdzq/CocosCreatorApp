"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildTemplate = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const global_1 = require("../../../share/global");
const platforms_options_1 = require("../../../share/platforms-options");
class BuildTemplate {
    get isEnable() {
        return !!this._buildTemplateDirs.length;
    }
    constructor(platform, taskName, config) {
        this._buildTemplateDirs = [];
        this.map = {};
        this._versionUser = '';
        this.config = config;
        const { buildTemplateDir } = global_1.BuildGlobalInfo;
        // 初始化不同层级的构建模板地址，按照使用优先级从大到小排布
        const commonDir = (0, path_1.join)(buildTemplateDir, 'common');
        // Temp 原生平台由于构建模式的特殊性，通用的模板地址是固定 native
        const platformDir = (0, path_1.join)(buildTemplateDir, platforms_options_1.NATIVE_PLATFORM.includes(platform) ? 'native' : platform);
        const taskDir = (0, path_1.join)(buildTemplateDir, taskName);
        if ((0, fs_extra_1.existsSync)(taskDir)) {
            this._buildTemplateDirs.push(taskDir);
        }
        if ((0, fs_extra_1.existsSync)(platformDir)) {
            this._buildTemplateDirs.push(platformDir);
        }
        if ((0, fs_extra_1.existsSync)(commonDir)) {
            this._buildTemplateDirs.push(commonDir);
        }
        const internalTemplate = {
            'application': 'application.ejs',
        };
        Object.keys(internalTemplate).forEach((name) => {
            this.initUrl(internalTemplate[name], name);
        });
        // 初始化缓存版本号
        this._initVersion(platform);
    }
    query(name) {
        var _a;
        return (_a = this.map[name]) === null || _a === void 0 ? void 0 : _a.path;
    }
    async _initVersion(platform) {
        if (!this.config) {
            return;
        }
        try {
            // 默认构建模板需要有版本号
            const templateVersionJson = (0, path_1.join)(Build.buildTemplateDir, 'templates-version.json');
            // 用户模板版本号
            if ((0, fs_extra_1.existsSync)(templateVersionJson)) {
                this._versionUser = (await (0, fs_extra_1.readJSON)(templateVersionJson))[platform];
            }
            this._versionUser = this._versionUser || '1.0.0';
            // 用户构建模板版本小于默认构建模板版本，警告建议更新
            if (Editor.Utils.Parse.compareVersion(this.config.version, this._versionUser)) {
                console.warn(Editor.I18n.t('builder.tips.templateVersionWarning', {
                    version: this._versionUser,
                    internalConfig: this.config.version,
                    platform,
                }));
            }
        }
        catch (error) {
            console.debug(error);
        }
    }
    findFile(relativeUrl) {
        for (let i = 0; i < this._buildTemplateDirs.length; i++) {
            const dir = this._buildTemplateDirs[i];
            const path = (0, path_1.join)(dir, relativeUrl);
            if ((0, fs_extra_1.existsSync)(path)) {
                return path;
            }
        }
        return '';
    }
    initUrl(relativeUrl, name) {
        const path = this.findFile(relativeUrl);
        name = name || (0, path_1.basename)(relativeUrl);
        if (path) {
            this.map[name] = {
                path,
                url: relativeUrl,
            };
            return path;
        }
    }
    async copyTo(dest) {
        // 按照优先级拷贝构建模板
        for (let index = (this._buildTemplateDirs.length - 1); index >= 0; index--) {
            const dir = this._buildTemplateDirs[index];
            await (0, fs_extra_1.copy)(dir, dest);
        }
        // 移除已经被处理的一些特殊的文件夹
        await Promise.all(Object.values(this.map).map((info) => {
            return (0, fs_extra_1.remove)((0, path_1.join)(dest, info.url));
        }));
    }
}
exports.BuildTemplate = BuildTemplate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGQtdGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zb3VyY2Uvd29ya2VyL2J1aWxkZXIvbWFuYWdlci9idWlsZC10ZW1wbGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx1Q0FBOEQ7QUFDOUQsK0JBQXNDO0FBRXRDLGtEQUF3RDtBQUN4RCx3RUFBbUU7QUFFbkUsTUFBYSxhQUFhO0lBUXRCLElBQUksUUFBUTtRQUNSLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUM7SUFDNUMsQ0FBQztJQUVELFlBQVksUUFBa0IsRUFBRSxRQUFnQixFQUFFLE1BQTRCO1FBWDlFLHVCQUFrQixHQUFhLEVBQUUsQ0FBQztRQUNsQyxRQUFHLEdBR0UsRUFBRSxDQUFDO1FBQ1IsaUJBQVksR0FBRyxFQUFFLENBQUM7UUFPZCxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixNQUFNLEVBQUUsZ0JBQWdCLEVBQUUsR0FBRyx3QkFBZSxDQUFDO1FBQzdDLCtCQUErQjtRQUMvQixNQUFNLFNBQVMsR0FBRyxJQUFBLFdBQUksRUFBQyxnQkFBZ0IsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNuRCx3Q0FBd0M7UUFDeEMsTUFBTSxXQUFXLEdBQUcsSUFBQSxXQUFJLEVBQUMsZ0JBQWdCLEVBQUUsbUNBQWUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDckcsTUFBTSxPQUFPLEdBQUcsSUFBQSxXQUFJLEVBQUMsZ0JBQWdCLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDakQsSUFBSSxJQUFBLHFCQUFVLEVBQUMsT0FBTyxDQUFDLEVBQUU7WUFDckIsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUN6QztRQUNELElBQUksSUFBQSxxQkFB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ckMsSUFBSSxJQUFJLEVBQUU7WUFDTixJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHO2dCQUNiLElBQUk7Z0JBQ0osR0FBRyxFQUFFLFdBQVc7YUFDbkIsQ0FBQztZQUNGLE9BQU8sSUFBSSxDQUFDO1NBQ2Y7SUFDTCxDQUFDO0lBRUQsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFZO1FBQ3JCLGNBQWM7UUFDZCxLQUFLLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsRUFBRSxLQUFLLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFO1lBQ3hFLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMzQyxNQUFNLElBQUEsZUFBSSxFQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUN6QjtRQUNELG1CQUFtQjtRQUNuQixNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDbkQsT0FBTyxJQUFBLGlCQUFNLEVBQUMsSUFBQSxXQUFJLEVBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3hDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDUixDQUFDO0NBQ0o7QUF2R0Qsc0NBdUdDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXhpc3RzU3luYywgY29weSwgcmVtb3ZlLCByZWFkSlNPTiB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IGJhc2VuYW1lLCBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBCdWlsZFRlbXBsYXRlQ29uZmlnLCBJQnVpbGRUZW1wbGF0ZSwgUGxhdGZvcm0gfSBmcm9tICcuLi8uLi8uLi8uLi9AdHlwZXMvcHJvdGVjdGVkJztcbmltcG9ydCB7IEJ1aWxkR2xvYmFsSW5mbyB9IGZyb20gJy4uLy4uLy4uL3NoYXJlL2dsb2JhbCc7XG5pbXBvcnQgeyBOQVRJVkVfUExBVEZPUk0gfSBmcm9tICcuLi8uLi8uLi9zaGFyZS9wbGF0Zm9ybXMtb3B0aW9ucyc7XG5cbmV4cG9ydCBjbGFzcyBCdWlsZFRlbXBsYXRlIGltcGxlbWVudHMgSUJ1aWxkVGVtcGxhdGUge1xuICAgIF9idWlsZFRlbXBsYXRlRGlyczogc3RyaW5nW10gPSBbXTtcbiAgICBtYXA6IFJlY29yZDxzdHJpbmcsIHtcbiAgICAgICAgdXJsOiBzdHJpbmc7XG4gICAgICAgIHBhdGg6IHN0cmluZztcbiAgICB9PiA9IHt9O1xuICAgIF92ZXJzaW9uVXNlciA9ICcnO1xuICAgIGNvbmZpZz86IEJ1aWxkVGVtcGxhdGVDb25maWc7XG4gICAgZ2V0IGlzRW5hYmxlKCkge1xuICAgICAgICByZXR1cm4gISF0aGlzLl9idWlsZFRlbXBsYXRlRGlycy5sZW5ndGg7XG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IocGxhdGZvcm06IFBsYXRmb3JtLCB0YXNrTmFtZTogc3RyaW5nLCBjb25maWc/OiBCdWlsZFRlbXBsYXRlQ29uZmlnICkge1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgY29uc3QgeyBidWlsZFRlbXBsYXRlRGlyIH0gPSBCdWlsZEdsb2JhbEluZm87XG4gICAgICAgIC8vIOWIneWni+WMluS4jeWQjOWxgue6p+eahOaehOW7uuaooeadv+WcsOWdgO+8jOaMieeFp+S9v+eUqOS8mOWFiOe6p+S7juWkp+WIsOWwj+aOkuW4g1xuICAgICAgICBjb25zdCBjb21tb25EaXIgPSBqb2luKGJ1aWxkVGVtcGxhdGVEaXIsICdjb21tb24nKTtcbiAgICAgICAgLy8gVGVtcCDljp/nlJ/lubPlj7DnlLHkuo7mnoTlu7rmqKHlvI/nmoTnibnmrormgKfvvIzpgJrnlKjnmoTmqKHmnb/lnLDlnYDmmK/lm7rlrpogbmF0aXZlXG4gICAgICAgIGNvbnN0IHBsYXRmb3JtRGlyID0gam9pbihidWlsZFRlbXBsYXRlRGlyLCBOQVRJVkVfUExBVEZPUk0uaW5jbHVkZXMocGxhdGZvcm0pID8gJ25hdGl2ZScgOiBwbGF0Zm9ybSk7XG4gICAgICAgIGNvbnN0IHRhc2tEaXIgPSBqb2luKGJ1aWxkVGVtcGxhdGVEaXIsIHRhc2tOYW1lKTtcbiAgICAgICAgaWYgKGV4aXN0c1N5bmModGFza0RpcikpIHtcbiAgICAgICAgICAgIHRoaXMuX2J1aWxkVGVtcGxhdGVEaXJzLnB1c2godGFza0Rpcik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGV4aXN0c1N5bmMocGxhdGZvcm1EaXIpKSB7XG4gICAgICAgICAgICB0aGlzLl9idWlsZFRlbXBsYXRlRGlycy5wdXNoKHBsYXRmb3JtRGlyKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXhpc3RzU3luYyhjb21tb25EaXIpKSB7XG4gICAgICAgICAgICB0aGlzLl9idWlsZFRlbXBsYXRlRGlycy5wdXNoKGNvbW1vbkRpcik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaW50ZXJuYWxUZW1wbGF0ZTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgICAgICAgICAgICdhcHBsaWNhdGlvbic6ICdhcHBsaWNhdGlvbi5lanMnLFxuICAgICAgICB9O1xuICAgICAgICBPYmplY3Qua2V5cyhpbnRlcm5hbFRlbXBsYXRlKS5mb3JFYWNoKChuYW1lKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmluaXRVcmwoaW50ZXJuYWxUZW1wbGF0ZVtuYW1lXSwgbmFtZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIOWIneWni+WMlue8k+WtmOeJiOacrOWPt1xuICAgICAgICB0aGlzLl9pbml0VmVyc2lvbihwbGF0Zm9ybSk7XG4gICAgfVxuXG4gICAgcXVlcnkobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcFtuYW1lXT8ucGF0aDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9pbml0VmVyc2lvbihwbGF0Zm9ybTogc3RyaW5nKSB7XG4gICAgICAgIGlmICghdGhpcy5jb25maWcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8g6buY6K6k5p6E5bu65qih5p2/6ZyA6KaB5pyJ54mI5pys5Y+3XG4gICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZVZlcnNpb25Kc29uID0gam9pbihCdWlsZC5idWlsZFRlbXBsYXRlRGlyLCAndGVtcGxhdGVzLXZlcnNpb24uanNvbicpO1xuICAgICAgICAgICAgLy8g55So5oi35qih5p2/54mI5pys5Y+3XG4gICAgICAgICAgICBpZiAoZXhpc3RzU3luYyh0ZW1wbGF0ZVZlcnNpb25Kc29uKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3ZlcnNpb25Vc2VyID0gKGF3YWl0IHJlYWRKU09OKHRlbXBsYXRlVmVyc2lvbkpzb24pKVtwbGF0Zm9ybV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl92ZXJzaW9uVXNlciA9IHRoaXMuX3ZlcnNpb25Vc2VyIHx8ICcxLjAuMCc7XG4gICAgICAgICAgICAvLyDnlKjmiLfmnoTlu7rmqKHmnb/niYjmnKzlsI/kuo7pu5jorqTmnoTlu7rmqKHmnb/niYjmnKzvvIzorablkYrlu7rorq7mm7TmlrBcbiAgICAgICAgICAgIGlmIChFZGl0b3IuVXRpbHMuUGFyc2UuY29tcGFyZVZlcnNpb24odGhpcy5jb25maWcudmVyc2lvbiwgdGhpcy5fdmVyc2lvblVzZXIpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKEVkaXRvci5JMThuLnQoJ2J1aWxkZXIudGlwcy50ZW1wbGF0ZVZlcnNpb25XYXJuaW5nJywge1xuICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uOiB0aGlzLl92ZXJzaW9uVXNlcixcbiAgICAgICAgICAgICAgICAgICAgaW50ZXJuYWxDb25maWc6IHRoaXMuY29uZmlnLnZlcnNpb24sXG4gICAgICAgICAgICAgICAgICAgIHBsYXRmb3JtLFxuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoZXJyb3IpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZmluZEZpbGUocmVsYXRpdmVVcmw6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fYnVpbGRUZW1wbGF0ZURpcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGRpciA9IHRoaXMuX2J1aWxkVGVtcGxhdGVEaXJzW2ldO1xuICAgICAgICAgICAgY29uc3QgcGF0aCA9IGpvaW4oZGlyLCByZWxhdGl2ZVVybCk7XG4gICAgICAgICAgICBpZiAoZXhpc3RzU3luYyhwYXRoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXRoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG5cbiAgICBpbml0VXJsKHJlbGF0aXZlVXJsOiBzdHJpbmcsIG5hbWU/OiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgcGF0aCA9IHRoaXMuZmluZEZpbGUocmVsYXRpdmVVcmwpO1xuICAgICAgICBuYW1lID0gbmFtZSB8fCBiYXNlbmFtZShyZWxhdGl2ZVVybCk7XG4gICAgICAgIGlmIChwYXRoKSB7XG4gICAgICAgICAgICB0aGlzLm1hcFtuYW1lXSA9IHtcbiAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgIHVybDogcmVsYXRpdmVVcmwsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBjb3B5VG8oZGVzdDogc3RyaW5nKSB7XG4gICAgICAgIC8vIOaMieeFp+S8mOWFiOe6p+aLt+i0neaehOW7uuaooeadv1xuICAgICAgICBmb3IgKGxldCBpbmRleCA9ICh0aGlzLl9idWlsZFRlbXBsYXRlRGlycy5sZW5ndGggLSAxKTsgaW5kZXggPj0gMDsgaW5kZXgtLSkge1xuICAgICAgICAgICAgY29uc3QgZGlyID0gdGhpcy5fYnVpbGRUZW1wbGF0ZURpcnNbaW5kZXhdO1xuICAgICAgICAgICAgYXdhaXQgY29weShkaXIsIGRlc3QpO1xuICAgICAgICB9XG4gICAgICAgIC8vIOenu+mZpOW3sue7j+iiq+WkhOeQhueahOS4gOS6m+eJueauiueahOaWh+S7tuWkuVxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChPYmplY3QudmFsdWVzKHRoaXMubWFwKS5tYXAoKGluZm8pID0+IHtcbiAgICAgICAgICAgIHJldHVybiByZW1vdmUoam9pbihkZXN0LCBpbmZvLnVybCkpO1xuICAgICAgICB9KSk7XG4gICAgfVxufVxuIl19