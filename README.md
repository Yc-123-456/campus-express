# 校园快递代取系统 - 前端项目

## 项目简介
这是一个基于静态 HTML/CSS/JavaScript 开发的校园快递代取系统前端项目,使用 Bootstrap 5 和 Axios 构建。

## 目录结构
```
campus-express-frontend/
├── index.html              # 登录页面
├── dashboard.html          # 仪表盘页面
├── create_order.html       # 创建订单页面
├── orders.html            # 订单列表页面
├── order_detail.html      # 订单详情页面
├── profile.html           # 个人中心页面
├── admin.html             # 管理后台页面
├── css/
│   └── style.css          # 全局样式文件
├── js/
│   ├── auth.js            # 认证模块(登录/登出/权限控制)
│   ├── common.js          # 公共工具函数
│   ├── dashboard.js       # 仪表盘功能
│   ├── create_order.js    # 创建订单功能
│   ├── orders.js          # 订单列表功能
│   ├── order_detail.js    # 订单详情功能
│   ├── profile.js         # 个人中心功能
│   └── admin.js           # 管理后台功能
└── README.md              # 项目说明文档
```

## 技术栈
- **HTML5** - 页面结构
- **CSS3** - 样式设计
- **JavaScript (ES6+)** - 交互逻辑
- **Bootstrap 5.3.0** - 前端 UI 框架
- **Axios** - HTTP 客户端
- **Day.js** - 日期时间处理库

## CDN 依赖
项目使用 CDN 方式引入第三方库,无需下载:
- Bootstrap 5.3.0: `https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/`
- Axios: `https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js`
- Day.js: `https://cdn.jsdelivr.net/npm/dayjs/dayjs.min.js`

## 快速开始

### 1. 打开项目
在 VS Code 中打开此文件夹。

### 2. 预览页面
可以直接用浏览器打开 HTML 文件,或使用 Live Server 插件进行预览。

推荐使用 Live Server:
- 安装 Live Server 插件
- 右键点击 `index.html`
- 选择 "Open with Live Server"

### 3. 配置 API 地址
修改 `js/auth.js` 中的 `API_BASE_URL` 常量:
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

## 页面说明

### 1. 登录页面 (index.html)
- 用户登录功能
- 记住我功能
- 注册入口(待实现)

### 2. 仪表盘 (dashboard.html)
- 订单统计展示
- 最近订单列表
- 快捷导航

### 3. 创建订单 (create_order.html)
- 填写快递信息
- 填写取件和送达信息
- 设置费用

### 4. 订单列表 (orders.html)
- 查看所有订单
- 筛选功能(按状态、日期)
- 分页显示

### 5. 订单详情 (order_detail.html)
- 查看订单详细信息
- 接单/取消订单
- 确认完成

### 6. 个人中心 (profile.html)
- 查看和编辑个人资料
- 修改密码
- 个人统计数据

### 7. 管理后台 (admin.html)
- 用户管理
- 订单管理
- 数据统计

## 功能特性

### 认证系统
- JWT Token 认证
- 自动登录(记住我)
- 登录状态检查
- 请求拦截器

### 工具函数
- 日期时间格式化
- 订单状态管理
- 表单验证
- Toast 提示
- 数据过滤和排序

### UI 组件
- 响应式布局
- 卡片式设计
- 表格展示
- 徽章标签
- 模态框(待实现)

## API 接口说明 (待对接)

### 认证接口
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册

### 订单接口
- `GET /api/orders` - 获取订单列表
- `GET /api/orders/:id` - 获取订单详情
- `POST /api/orders` - 创建订单
- `POST /api/orders/:id/accept` - 接单
- `POST /api/orders/:id/cancel` - 取消订单
- `POST /api/orders/:id/complete` - 完成订单

### 用户接口
- `GET /api/user/profile` - 获取用户资料
- `PUT /api/user/profile` - 更新用户资料
- `POST /api/user/change-password` - 修改密码
- `GET /api/user/statistics` - 获取用户统计

### 管理员接口
- `GET /api/admin/statistics` - 获取统计数据
- `GET /api/admin/users` - 获取用户列表
- `GET /api/admin/orders` - 获取所有订单
- `POST /api/admin/users/:id/toggle-status` - 切换用户状态
- `DELETE /api/admin/users/:id` - 删除用户

## 开发说明

### 代码规范
- 使用 ES6+ 语法
- 采用异步函数 (async/await)
- 统一的命名规范
- 模块化组织代码

### 样式规范
- 使用 CSS 变量
- BEM 命名规范(推荐)
- 响应式设计

### 注意事项
1. 所有需要认证的页面都会检查登录状态
2. API 请求会自动携带 Token
3. 错误统一处理和提示
4. 模拟数据仅用于演示,需替换为真实 API 调用

## 后续优化建议

1. **功能增强**
   - 添加注册页面
   - 实现文件上传功能
   - 添加即时通讯功能
   - 实现消息通知

2. **性能优化**
   - 图片懒加载
   - 虚拟滚动(大数据列表)
   - 缓存策略优化

3. **用户体验**
   - 添加加载动画
   - 骨架屏
   - PWA 支持

4. **安全性**
   - XSS 防护
   - CSRF 防护
   - 输入验证加强

## 浏览器兼容性
- Chrome (推荐)
- Firefox
- Safari
- Edge
- Opera

## 联系方式
如有问题或建议,请联系开发团队。

## 许可证
MIT License
