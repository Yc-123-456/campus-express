# 🚀 校园快递代取系统 - 快速启动指南

## ✅ 项目已完成创建!

恭喜!你的校园快递代取系统前端项目已经搭建完成。

## 📋 已创建的文件清单

### HTML 页面 (7个)
- ✅ `index.html` - 登录页面
- ✅ `dashboard.html` - 仪表盘
- ✅ `create_order.html` - 创建订单
- ✅ `orders.html` - 订单列表
- ✅ `order_detail.html` - 订单详情
- ✅ `profile.html` - 个人中心
- ✅ `admin.html` - 管理后台

### CSS 文件 (1个)
- ✅ `css/style.css` - 全局样式

### JavaScript 文件 (8个)
- ✅ `js/auth.js` - 认证模块
- ✅ `js/common.js` - 公共工具
- ✅ `js/dashboard.js` - 仪表盘
- ✅ `js/create_order.js` - 创建订单
- ✅ `js/orders.js` - 订单列表
- ✅ `js/order_detail.js` - 订单详情
- ✅ `js/profile.js` - 个人中心
- ✅ `js/admin.js` - 管理后台

### 文档 (2个)
- ✅ `README.md` - 项目说明
- ✅ `STRUCTURE.md` - 结构说明

## 🎯 下一步操作

### 方式一:使用 Live Server 预览(推荐)

1. **安装 Live Server 插件**
   - 打开 VS Code
   - 点击左侧扩展图标
   - 搜索 "Live Server"
   - 安装 by Ritwick Dey 的版本

2. **启动服务器**
   - 在 `index.html` 上右键
   - 选择 "Open with Live Server"
   - 浏览器会自动打开页面

3. **访问地址**
   ```
   http://127.0.0.1:5500/index.html
   ```

### 方式二:直接打开 HTML 文件

1. 双击任意 HTML 文件
2. 用浏览器打开
3. ⚠️ 注意:部分功能可能受跨域限制影响

## 🔧 配置后端 API

### 修改 API 地址

打开 `js/auth.js`,找到第 4 行:

```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

修改为你的后端服务地址,例如:
```javascript
const API_BASE_URL = 'http://your-domain.com/api';
```

### API 接口列表

需要实现的后端接口:

#### 认证接口
```
POST /api/auth/login          # 用户登录
POST /api/auth/register       # 用户注册
```

#### 订单接口
```
GET  /api/orders              # 获取订单列表
GET  /api/orders/:id          # 获取订单详情
POST /api/orders              # 创建订单
POST /api/orders/:id/accept   # 接单
POST /api/orders/:id/cancel   # 取消订单
POST /api/orders/:id/complete # 完成订单
```

#### 用户接口
```
GET  /api/user/profile              # 获取用户资料
PUT  /api/user/profile              # 更新用户资料
POST /api/user/change-password      # 修改密码
GET  /api/user/statistics           # 获取用户统计
```

#### 管理员接口
```
GET  /api/admin/statistics          # 获取统计数据
GET  /api/admin/users               # 获取用户列表
GET  /api/admin/orders              # 获取所有订单
POST /api/admin/users/:id/toggle-status  # 切换用户状态
DELETE /api/admin/users/:id         # 删除用户
```

## 🧪 测试当前功能

由于还未连接后端,你可以先测试以下功能:

### ✅ 可以立即测试的功能
- 页面布局和样式
- 响应式设计(调整浏览器窗口大小)
- 表单验证(部分)
- 页面跳转
- UI 交互效果

### ⚠️ 需要后端支持的功能
- 登录认证
- 订单 CRUD
- 数据加载
- 用户管理

## 📝 开发建议

### 第一阶段:页面测试
1. 打开 `index.html` 查看登录页面
2. 浏览所有页面,确认布局正常
3. 测试响应式(在手机/平板/桌面视图切换)

### 第二阶段:模拟数据测试
1. 查看各个 JS 文件中的模拟数据
2. 理解数据结构和流程
3. 根据需求调整模拟数据

### 第三阶段:API 对接
1. 完成后端服务搭建
2. 修改 `API_BASE_URL`
3. 逐步替换 TODO 标记的模拟数据
4. 测试每个功能的真实 API 调用

### 第四阶段:功能增强
1. 添加注册页面
2. 实现文件上传
3. 添加消息通知
4. 优化用户体验

## 🎨 自定义修改

### 修改主题颜色

编辑 `css/style.css` 第 3-9 行:

```css
:root {
    --primary-color: #0d6efd;      /* 主色调 */
    --secondary-color: #6c757d;    /* 次要色 */
    --success-color: #198754;      /* 成功色 */
    --danger-color: #dc3545;       /* 危险色 */
    --warning-color: #ffc107;      /* 警告色 */
    --info-color: #0dcaf0;         /* 信息色 */
}
```

### 修改网站标题

在每个 HTML 文件的 `<title>` 标签中修改:

```html
<title>你的网站名称</title>
```

### 修改导航菜单

在每个页面的 `<nav>` 部分修改菜单项。

## 🐛 常见问题

### Q1: 页面显示空白?
**A:** 检查浏览器控制台(F12),查看是否有错误信息。

### Q2: 样式没有生效?
**A:** 清除浏览器缓存(Ctrl+Shift+Delete),或使用无痕模式。

### Q3: JavaScript 报错 "getToken is not defined"?
**A:** 确保所有 JS 文件都正确引入,顺序不能错。

### Q4: Bootstrap 样式不生效?
**A:** 检查网络连接,确保能访问 CDN。

### Q5: 如何调试代码?
**A:** 在浏览器中按 F12 打开开发者工具,使用 Console 和 Network 面板。

## 📚 学习资源

- [Bootstrap 5 文档](https://getbootstrap.com/docs/5.3/)
- [Axios 文档](https://axios-http.com/)
- [Day.js 文档](https://day.js.org/)
- [MDN Web 文档](https://developer.mozilla.org/)

## 💬 获取帮助

遇到问题时:
1. 查看浏览器控制台的错误信息
2. 检查网络请求是否成功
3. 确认 API 地址配置正确
4. 参考 README.md 和 STRUCTURE.md

## 🎉 开始你的开发之旅!

一切准备就绪!现在你可以:
- 打开浏览器预览页面
- 开始设计和实现后端 API
- 根据需求调整前端功能
- 添加更多创意特性

祝你开发顺利! 🚀

---

**提示**: 建议先用模拟数据开发,理解整个流程后再对接真实 API。
