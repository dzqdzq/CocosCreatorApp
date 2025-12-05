# 场景编辑器

## 广播消息

scene 编辑器在执行一些操作的过程中会广播出对应的操作，供其他插件监听并做对应的处理。

### scene:ready

场景准备就绪的时候广播的消息

### scene:close

场景关闭的时候广播的消息

### scene:add-node

场景内创建节点的时候广播的消息

### scene:change-node

场景内节点被修改的时候广播的消息

### scene:remove-node

场景内节点被删除之后广播的消息
