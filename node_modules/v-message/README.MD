# 信息管理

主要用于不同类型的信息管理
比如用于 i18n 的本地化数据管理

## 使用方法

```javascript
const Message = require('v-message');
let message = new Message();

// 注册信息类型
message.register('zh');
message.register('en');

// 切换当前类型
message.type('zh');
message.append({
    footer: '页脚',
});
message.add('header.title', '头部标题');

// 切换当前类型
message.type('en');
message.append({
    footer: 'footer',
});
message.add('header.title', 'header title');

message.type('zh');
message.get('footer'); // 页脚
message.get('header.title'); // 头部标题

message.type('en');
message.get('footer'); // footer
message.get('header.title'); // header title

message.subtract({
    footer: 'footer',
});
message.remove('header.title');
message.get('footer'); // ''
message.get('header.title'); // ''

```