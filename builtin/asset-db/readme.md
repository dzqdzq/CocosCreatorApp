# 资源管理器

资源管理器插件内，管理了许多的资源数据库

## 广播消息

被管理的数据库在操作的时候，会出一系列的广播消息

### asset-db:state-changed

资源数据库状态变更，会发送 busy 或者 free 字符串

### asset-db:db-ready

插件内某个 db 启动完成

### asset-db:db-close

插件内某个 db 被关闭
