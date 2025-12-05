"use strict";module.exports={title:"程序管理器",description:"第三方应用程序管理器",defaultProgram:"默认程序",customProgram:"自定义程序",label:{script_editor:"默认脚本编辑器",picture_editor:"默认图片编辑器",browser:"默认浏览器",commandArgument:"命令行参数"},tips:{quickArguments:"点击右侧按钮，选择快捷参数"},console:{noProgram:"应用程序（{program}）未在配置中配置。请检查并确保已正确添加应用程序到配置中。",noProgramPath:"配置的{program}路径不存在，请前往 偏好设置 -> 程序管理器 -> {program} 进行配置。",programPathErr:"应用程序（{program}）配置的路径（{path}）无效，请前往 偏好设置 -> 程序管理器 -> {program} 进行确认。",programErr:"无法找到请求的应用程序。",urlErr:"无效的 URL 协议，请确保使用正确的URL协议。"},messages:{description:{queryProgramInfo:"查询应用程序信息",execute:"启动应用程序"},doc:{queryProgramInfo:`
- program {string} 启动的应用程序的 key

@returns {IProgramInfo} 返回应用程序信息，不传参数获取所有应用程序的信息
            `,execute:`
- program {string} 启动的应用程序的 key
- args {Record<string, any>} 启动应用程序的参数集合
            `}}};