/**
 * 快捷获取文档路径
 * @param relativeUrl 
 * @param type 
 */
export function getDocUrl(relativeUrl: string, type: 'manual' | 'api' = 'manual'): string {
    if (!relativeUrl) {
        return '';
    }
    return new URL(relativeUrl, Editor.App.urls[type]).href;
}
