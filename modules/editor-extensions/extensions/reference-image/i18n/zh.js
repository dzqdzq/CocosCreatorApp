"use strict";module.exports={name:"参考图",description:"参考图",none:"无",none_tips:"点击此处添加参考图",edit:{header:"参考图",position:"偏移",scale:"缩放",opacity:"透明度"},add_image:"添加",del_image:"删除",show_tips:"是否显示参考图",dialog:{add_image_title:"添加参考图",del_image_message:"是否删除 {path} 参考图",yes:"确认",cancel:"取消"},contributions:{messages:{"add-image":{description:"添加参考图",doc:"- paths {string[]} - 参考图资源绝对路径数组",example:`
                    await Editor.Message.request('reference-image', 'add-image', paths);
                `},"remove-image":{description:"删除参考图",doc:"- paths {string[]} - 参考图资源绝对路径（可选）如果不填，删除当前的参考图",example:`
                    await Editor.Message.request('reference-image', 'remove-image', paths);
                `},"switch-image":{description:"切换参考图",doc:`
                - path {string[]} - 参考图资源绝对路径
                - specifySceneUUID - 指定场景 UUID(可选)
                `,example:`
                await Editor.Message.request('reference-image', 'switch-image', path);
                `},"set-image-data":{description:"设置参考图数据",doc:`
                - key {string[]} 参考图数据参数
                    - path: string;    - 参考图绝对路径
                    - x: number;       - x 偏移
                    - y: number;       - y 偏移
                    - sx: number;      - x 缩放
                    - sy: number;      - y 缩放
                    - opacity: number; - 参考图透明度
                `,example:`
                    await Editor.Message.request('reference-image', 'set-image-data', 'x', 10);
                `},"query-config":{description:"请求参考图配置",doc:"@return {IReference}",example:"await Editor.Message.request('reference-image', 'query-config');"},"query-current":{description:"请求当前参考图数据",doc:"@return {IImageData}",example:`
                    await Editor.Message.request('reference-image', 'query-current');
                `},refresh:{description:"刷新参考图",doc:" ",example:`
                    await Editor.Message.request('reference-image', 'refresh');
                `}}}};