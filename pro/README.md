# JavaScript学习网站

一个功能完整的JavaScript学习平台，提供基础语法学习和Markdown笔记管理功能。

## 功能特性

### 🏠 首页导航
- 现代化的Material Design界面
- 响应式设计，支持移动端
- 清晰的功能模块导航

### 📚 基础语法模块
- **变量和数据类型** - 学习JavaScript的基本数据类型和变量声明
- **函数** - 掌握函数声明、箭头函数和函数表达式
- **控制流程** - 条件语句和循环结构
- **对象和数组** - 对象操作和数组方法
- 每个语法点都包含代码示例和MDN官方文档链接

### 📝 学习笔记管理
- **文件上传** - 支持拖拽上传Markdown文件
- **自动转换** - 将Markdown自动转换为Material Design风格的网页
- **智能搜索** - 支持标题、内容、文件名的全文搜索
- **本地存储** - 使用localStorage保存笔记，无需服务器
- **语法高亮** - 代码块自动语法高亮
- **导出功能** - 支持JSON、Markdown、HTML格式导出

### 🔮 扩展模块预留
- 在线练习题模块（规划中）
- 视频教程模块（规划中）
- 社区讨论模块（规划中）

## 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **样式**: Material Design风格
- **存储**: localStorage（客户端存储）
- **解析**: 自定义Markdown解析器

## 文件结构

```
pro/
├── index.html              # 主页面
├── styles/
│   └── main.css            # 主样式文件
├── scripts/
│   ├── main.js             # 主要JavaScript逻辑
│   ├── markdown-parser.js  # Markdown解析器
│   └── notes-manager.js    # 笔记管理器
└── README.md              # 项目说明
```

## 使用方法

### 启动网站
1. 直接在浏览器中打开 `index.html` 文件
2. 或者使用本地服务器（推荐）：
   ```bash
   # 使用Python
   python -m http.server 8000
   
   # 使用Node.js
   npx serve .
   
   # 使用Live Server (VS Code扩展)
   ```

### 学习基础语法
1. 点击导航栏的"基础语法"模块
2. 浏览不同的语法类别
3. 查看代码示例
4. 点击"MDN文档"链接深入学习

### 管理学习笔记
1. 点击导航栏的"学习笔记"模块
2. 上传Markdown文件：
   - 拖拽文件到上传区域
   - 或点击"选择文件"按钮
3. 查看转换后的笔记
4. 使用搜索功能查找特定笔记
5. 点击笔记查看完整内容

### 搜索功能
- 在搜索框中输入关键词
- 支持搜索笔记标题、内容和文件名
- 实时搜索结果显示
- 按相关性排序

## 特色功能

### Markdown解析器
- 支持标准Markdown语法
- 代码块语法高亮
- 表格渲染
- 列表和引用
- 自动链接转换

### 笔记管理
- 智能搜索索引
- 相关性评分
- 标签系统（可扩展）
- 导入/导出功能
- 统计信息

### 响应式设计
- 移动端友好
- 平板适配
- 桌面端优化

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 开发说明

### 添加新模块
1. 在 `index.html` 中添加新的导航项和内容区域
2. 在 `main.css` 中添加相应样式
3. 在 `main.js` 中添加导航逻辑

### 扩展Markdown解析器
1. 编辑 `markdown-parser.js`
2. 在 `MarkdownParser` 类中添加新的解析规则
3. 更新 `cleanupHtml` 方法处理新元素

### 自定义样式
1. 编辑 `main.css`
2. 遵循Material Design设计原则
3. 保持响应式设计

## 许可证

MIT License - 可自由使用和修改

## 贡献

欢迎提交Issue和Pull Request来改进这个项目！

## 更新日志

### v1.0.0
- 初始版本发布
- 基础语法模块
- Markdown笔记管理
- 搜索功能
- Material Design界面