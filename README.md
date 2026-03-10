# Gemini2Obsidian

## 项目简介
这是一个快速将Gemini某一段对话直接转化为md文件并保存在Obsidian的库里浏览器插件。

### 核心特性
- 快速将 Gemini 的对话页面（包括模型回复的大段文本、标题、代码块等）转换为 Markdown 格式。
- 点击按钮直接跳转到 Obsidian 并新建一条带时间戳的笔记。
- 支持转换 Markdown 表格，且在表格前保留换行。
- 自动清理提取内容中的干扰元素（如“导出到 Google 表格”或“复制”等附属按钮文本）。

### 具体实现
- 利用 MutationObserver 监听页面变化，找到复制按钮（copy-button）并复制出一个新的 "导出到 Obsidian" 按钮。
- 将点击动作拦截，读取到当前 AI 回复块的 HTML，深克隆后利用 TurndownService（与 turndown-plugin-gfm）转换为 Markdown。
- 在转换为 Markdown 前/后，通过正则表达式和 DOM 操作清理多余层级（如列表的 `<p>` 双换行问题、代码框的多余文字、“导出到 Google 表格”等无用元素），以及处理段落间的空行。


### 项目结构
- `manifest.json`: 浏览器插件的配置文件，配置权限等。
- `content.js`: 核心业务逻辑，处理页面 DOM 侦听、元素提取、DOM 洗清以及触发写入到 Obsidian 的协议。
- `styles.css`: 相关样式文件。
- `turndown.js`: 将 HTML 转化为 Markdown 的核心依赖库。
- `turndown-plugin-gfm.js`: Turndown 的插件，专门用于处理 GitHub Flavored Markdown 语法（如表格支持）。

### 安装方式
1. 打开 Chrome 浏览器，在地址栏输入 `chrome://extensions` 并回车，进入扩展程序管理页面。
2. 确保右上角的“开发者模式”已开启。
3. 点击左上角的“加载已解压的扩展程序”按钮。
4. 选择 Gemini2Obsidian 文件夹。
5. 插件安装成功后，Ctrl+F5 刷新 Gemini 页面即可看到效果。

### 使用方式
1. 在 Gemini 页面，找到想要保存的对话。
2. 点击对话块左下角的“导出到 Obsidian”按钮。
3. 插件会自动将对话内容转换为 Markdown 格式，并跳转到 Obsidian。
4. 在 Obsidian 中，插件会自动创建一个新的笔记，并将内容粘贴进笔记中。

### 注意
1. 笔记保存位置与Obsidian“新建笔记存放位置”的设置有关，请在Obsidian的“设置”->“文件与链接”->“新建笔记存放位置”中设置。
2. 对话中的图片在导出时，会在笔记中保存为链接，如需要将图片保存在本地，请使用Obsidian其他插件实现。

# Star History

[![Star History Chart](https://api.star-history.com/svg?repos=masclown/Gemini2Obsidian)](https://star-history.com/#masclown/Gemini2Obsidian&Date)

# 许可证
本项目采用 GPL-3.0 协议开源，具体条款请参见 LICENSE 文件。