"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildTemplate = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const global_1 = require("../../../share/global");
class BuildTemplate {
    get isEnable() {
        return !!this._buildTemplateDirs.length;
    }
    constructor(platform, taskName, config) {
        var _a;
        this._buildTemplateDirs = [];
        this.map = {};
        this._versionUser = '';
        this.config = config;
        const { buildTemplateDir } = global_1.BuildGlobalInfo;
        // 初始化不同层级的构建模板地址，按照使用优先级从大到小排布
        const commonDir = (0, path_1.join)(buildTemplateDir, 'common');
        const platformDir = (0, path_1.join)(buildTemplateDir, ((_a = this.config) === null || _a === void 0 ? void 0 : _a.dirname) || platform);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGQtdGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zb3VyY2Uvd29ya2VyL2J1aWxkZXIvbWFuYWdlci9idWlsZC10ZW1wbGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx1Q0FBOEQ7QUFDOUQsK0JBQXNDO0FBRXRDLGtEQUF3RDtBQUd4RCxNQUFhLGFBQWE7SUFRdEIsSUFBSSxRQUFRO1FBQ1IsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQztJQUM1QyxDQUFDO0lBRUQsWUFBWSxRQUFrQixFQUFFLFFBQWdCLEVBQUUsTUFBNEI7O1FBWDlFLHVCQUFrQixHQUFhLEVBQUUsQ0FBQztRQUNsQyxRQUFHLEdBR0UsRUFBRSxDQUFDO1FBQ1IsaUJBQVksR0FBRyxFQUFFLENBQUM7UUFPZCxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixNQUFNLEVBQUUsZ0JBQWdCLEVBQUUsR0FBRyx3QkFBZSxDQUFDO1FBQzdDLCtCQUErQjtRQUMvQixNQUFNLFNBQVMsR0FBRyxJQUFBLFdBQUksRUFBQyxnQkFBZ0IsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNuRCxNQUFNLFdBQVcsR0FBRyxJQUFBLFdBQUksRUFBQyxnQkFBZ0IsRUFBRSxDQUFBLE1BQUEsSUFBSSxDQUFDLE1BQU0sMENBQUUsT0FBTyxLQUFJLFFBQVEsQ0FBQyxDQUFDO1FBQzdFLE1BQU0sT0FBTyxHQUFHLElBQUEsV0FBSSxFQUFDLGdCQUFnQixFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ2pELElBQUksSUFBQSxxQkFBVSxFQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ3JCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDekM7UUFDRCxJQUFJLElBQUEscUJBQVUsRUFBQyxXQUFXLENBQUMsRUFBRTtZQUN6QixJQUFJLENBQUMsa0JBQWtCLENBQUMs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QUMsR0FBRztnQkFDYixJQUFJO2dCQUNKLEdBQUcsRUFBRSxXQUFXO2FBQ25CLENBQUM7WUFDRixPQUFPLElBQUksQ0FBQztTQUNmO0lBQ0wsQ0FBQztJQUVELEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBWTtRQUNyQixjQUFjO1FBQ2QsS0FBSyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEVBQUUsS0FBSyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRTtZQUN4RSxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDM0MsTUFBTSxJQUFBLGVBQUksRUFBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDekI7UUFDRCxtQkFBbUI7UUFDbkIsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ25ELE9BQU8sSUFBQSxpQkFBTSxFQUFDLElBQUEsV0FBSSxFQUFDLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUN4QyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1IsQ0FBQztDQUNKO0FBdEdELHNDQXNHQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGV4aXN0c1N5bmMsIGNvcHksIHJlbW92ZSwgcmVhZEpTT04gfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBiYXNlbmFtZSwgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgQnVpbGRUZW1wbGF0ZUNvbmZpZywgSUJ1aWxkVGVtcGxhdGUsIFBsYXRmb3JtIH0gZnJvbSAnLi4vLi4vLi4vLi4vQHR5cGVzL3Byb3RlY3RlZCc7XG5pbXBvcnQgeyBCdWlsZEdsb2JhbEluZm8gfSBmcm9tICcuLi8uLi8uLi9zaGFyZS9nbG9iYWwnO1xuaW1wb3J0IHsgTkFUSVZFX1BMQVRGT1JNIH0gZnJvbSAnLi4vLi4vLi4vc2hhcmUvcGxhdGZvcm1zLW9wdGlvbnMnO1xuXG5leHBvcnQgY2xhc3MgQnVpbGRUZW1wbGF0ZSBpbXBsZW1lbnRzIElCdWlsZFRlbXBsYXRlIHtcbiAgICBfYnVpbGRUZW1wbGF0ZURpcnM6IHN0cmluZ1tdID0gW107XG4gICAgbWFwOiBSZWNvcmQ8c3RyaW5nLCB7XG4gICAgICAgIHVybDogc3RyaW5nO1xuICAgICAgICBwYXRoOiBzdHJpbmc7XG4gICAgfT4gPSB7fTtcbiAgICBfdmVyc2lvblVzZXIgPSAnJztcbiAgICBjb25maWc/OiBCdWlsZFRlbXBsYXRlQ29uZmlnO1xuICAgIGdldCBpc0VuYWJsZSgpIHtcbiAgICAgICAgcmV0dXJuICEhdGhpcy5fYnVpbGRUZW1wbGF0ZURpcnMubGVuZ3RoO1xuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yKHBsYXRmb3JtOiBQbGF0Zm9ybSwgdGFza05hbWU6IHN0cmluZywgY29uZmlnPzogQnVpbGRUZW1wbGF0ZUNvbmZpZyApIHtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIGNvbnN0IHsgYnVpbGRUZW1wbGF0ZURpciB9ID0gQnVpbGRHbG9iYWxJbmZvO1xuICAgICAgICAvLyDliJ3lp4vljJbkuI3lkIzlsYLnuqfnmoTmnoTlu7rmqKHmnb/lnLDlnYDvvIzmjInnhafkvb/nlKjkvJjlhYjnuqfku47lpKfliLDlsI/mjpLluINcbiAgICAgICAgY29uc3QgY29tbW9uRGlyID0gam9pbihidWlsZFRlbXBsYXRlRGlyLCAnY29tbW9uJyk7XG4gICAgICAgIGNvbnN0IHBsYXRmb3JtRGlyID0gam9pbihidWlsZFRlbXBsYXRlRGlyLCB0aGlzLmNvbmZpZz8uZGlybmFtZSB8fCBwbGF0Zm9ybSk7XG4gICAgICAgIGNvbnN0IHRhc2tEaXIgPSBqb2luKGJ1aWxkVGVtcGxhdGVEaXIsIHRhc2tOYW1lKTtcbiAgICAgICAgaWYgKGV4aXN0c1N5bmModGFza0RpcikpIHtcbiAgICAgICAgICAgIHRoaXMuX2J1aWxkVGVtcGxhdGVEaXJzLnB1c2godGFza0Rpcik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGV4aXN0c1N5bmMocGxhdGZvcm1EaXIpKSB7XG4gICAgICAgICAgICB0aGlzLl9idWlsZFRlbXBsYXRlRGlycy5wdXNoKHBsYXRmb3JtRGlyKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXhpc3RzU3luYyhjb21tb25EaXIpKSB7XG4gICAgICAgICAgICB0aGlzLl9idWlsZFRlbXBsYXRlRGlycy5wdXNoKGNvbW1vbkRpcik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaW50ZXJuYWxUZW1wbGF0ZTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgICAgICAgICAgICdhcHBsaWNhdGlvbic6ICdhcHBsaWNhdGlvbi5lanMnLFxuICAgICAgICB9O1xuICAgICAgICBPYmplY3Qua2V5cyhpbnRlcm5hbFRlbXBsYXRlKS5mb3JFYWNoKChuYW1lKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmluaXRVcmwoaW50ZXJuYWxUZW1wbGF0ZVtuYW1lXSwgbmFtZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIOWIneWni+WMlue8k+WtmOeJiOacrOWPt1xuICAgICAgICB0aGlzLl9pbml0VmVyc2lvbihwbGF0Zm9ybSk7XG4gICAgfVxuXG4gICAgcXVlcnkobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcFtuYW1lXT8ucGF0aDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9pbml0VmVyc2lvbihwbGF0Zm9ybTogc3RyaW5nKSB7XG4gICAgICAgIGlmICghdGhpcy5jb25maWcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8g6buY6K6k5p6E5bu65qih5p2/6ZyA6KaB5pyJ54mI5pys5Y+3XG4gICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZVZlcnNpb25Kc29uID0gam9pbihCdWlsZC5idWlsZFRlbXBsYXRlRGlyLCAndGVtcGxhdGVzLXZlcnNpb24uanNvbicpO1xuICAgICAgICAgICAgLy8g55So5oi35qih5p2/54mI5pys5Y+3XG4gICAgICAgICAgICBpZiAoZXhpc3RzU3luYyh0ZW1wbGF0ZVZlcnNpb25Kc29uKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3ZlcnNpb25Vc2VyID0gKGF3YWl0IHJlYWRKU09OKHRlbXBsYXRlVmVyc2lvbkpzb24pKVtwbGF0Zm9ybV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl92ZXJzaW9uVXNlciA9IHRoaXMuX3ZlcnNpb25Vc2VyIHx8ICcxLjAuMCc7XG4gICAgICAgICAgICAvLyDnlKjmiLfmnoTlu7rmqKHmnb/niYjmnKzlsI/kuo7pu5jorqTmnoTlu7rmqKHmnb/niYjmnKzvvIzorablkYrlu7rorq7mm7TmlrBcbiAgICAgICAgICAgIGlmIChFZGl0b3IuVXRpbHMuUGFyc2UuY29tcGFyZVZlcnNpb24odGhpcy5jb25maWcudmVyc2lvbiwgdGhpcy5fdmVyc2lvblVzZXIpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKEVkaXRvci5JMThuLnQoJ2J1aWxkZXIudGlwcy50ZW1wbGF0ZVZlcnNpb25XYXJuaW5nJywge1xuICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uOiB0aGlzLl92ZXJzaW9uVXNlcixcbiAgICAgICAgICAgICAgICAgICAgaW50ZXJuYWxDb25maWc6IHRoaXMuY29uZmlnLnZlcnNpb24sXG4gICAgICAgICAgICAgICAgICAgIHBsYXRmb3JtLFxuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoZXJyb3IpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZmluZEZpbGUocmVsYXRpdmVVcmw6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fYnVpbGRUZW1wbGF0ZURpcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGRpciA9IHRoaXMuX2J1aWxkVGVtcGxhdGVEaXJzW2ldO1xuICAgICAgICAgICAgY29uc3QgcGF0aCA9IGpvaW4oZGlyLCByZWxhdGl2ZVVybCk7XG4gICAgICAgICAgICBpZiAoZXhpc3RzU3luYyhwYXRoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXRoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG5cbiAgICBpbml0VXJsKHJlbGF0aXZlVXJsOiBzdHJpbmcsIG5hbWU/OiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgcGF0aCA9IHRoaXMuZmluZEZpbGUocmVsYXRpdmVVcmwpO1xuICAgICAgICBuYW1lID0gbmFtZSB8fCBiYXNlbmFtZShyZWxhdGl2ZVVybCk7XG4gICAgICAgIGlmIChwYXRoKSB7XG4gICAgICAgICAgICB0aGlzLm1hcFtuYW1lXSA9IHtcbiAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgIHVybDogcmVsYXRpdmVVcmwsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBjb3B5VG8oZGVzdDogc3RyaW5nKSB7XG4gICAgICAgIC8vIOaMieeFp+S8mOWFiOe6p+aLt+i0neaehOW7uuaooeadv1xuICAgICAgICBmb3IgKGxldCBpbmRleCA9ICh0aGlzLl9idWlsZFRlbXBsYXRlRGlycy5sZW5ndGggLSAxKTsgaW5kZXggPj0gMDsgaW5kZXgtLSkge1xuICAgICAgICAgICAgY29uc3QgZGlyID0gdGhpcy5fYnVpbGRUZW1wbGF0ZURpcnNbaW5kZXhdO1xuICAgICAgICAgICAgYXdhaXQgY29weShkaXIsIGRlc3QpO1xuICAgICAgICB9XG4gICAgICAgIC8vIOenu+mZpOW3sue7j+iiq+WkhOeQhueahOS4gOS6m+eJueauiueahOaWh+S7tuWkuVxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChPYmplY3QudmFsdWVzKHRoaXMubWFwKS5tYXAoKGluZm8pID0+IHtcbiAgICAgICAgICAgIHJldHVybiByZW1vdmUoam9pbihkZXN0LCBpbmZvLnVybCkpO1xuICAgICAgICB9KSk7XG4gICAgfVxufVxuIl19