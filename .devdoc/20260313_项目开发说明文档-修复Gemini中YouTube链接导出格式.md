# 20260313_项目开发说明文档-修复Gemini中YouTube链接导出格式

## 目的
修复在 Gemini 平台中当对话内容包含 YouTube 视频链接（Rich Card/Widget）时，导出为 Markdown 文件后出现的格式错乱问题。确保导出的格式中缩略图显示在对应文字链接的上方，并且过滤掉多余的重复 YouTube logo。

## 当前能够实现
- 在 `getMarkdownContent` 的 Markdown 字符串后处理阶段中正确识别并修复 YouTube 视频卡片转换后的错误格式。
- 移除所有 `gstatic.com` 上的 YouTube logo 图片引用。
- 将被 Turndown 错误解析的复杂链接结构（含图片、标题、作者信息混在一起的多行链接）提取为纯文本标题+链接。
- 确保 `ytimg.com` 缩略图带有正确的 alt 文件名，并与视频链接纵向排列。

## 具体实现 
- 在 `content.js` 中的 `getMarkdownContent` 函数内加入四步后处理逻辑：
  1. **移除 YouTube logo**：用正则移除所有 `![](https://www.gstatic.com/images/branding/productlogos/youtube/...)` 引用。
  2. **修复错误链接块**：匹配被 Turndown 错误包裹的 `[\n...\n](youtube-url)` 多行结构，提取内部纯文本并重建为 `[Title](url)` 标准格式。
  3. **调整缩略图位置**（链接在前）：当 YouTube 链接后紧跟 `ytimg.com` 缩略图时，将两者交换顺序为图片优先。
  4. **调整缩略图位置**（缩略图在前）：当缩略图已在链接前时，确保 alt 文本正确。

## 当前无法实现/未解决问题
暂无

## 路线图 (思路整理)
- ✅ Stage-1: 实现 Gemini 基本功能
- ✅ Stage-2: 适配 DeepSeek 
- ✅ Stage-3: 适配 Kimi 
- ✅ Stage-4: 适配 Doubao 
- ✅ Stage-5: 适配 Qianwen
- ✅ Stage-6: 修复 Gemini 中 YouTube 链接卡片导出格式错乱问题 (2026-03-13)

## AI 讨论记录
1. **首次尝试 DOM 操作方案（失败）**：最初在 `cleanDOM` 中尝试通过 `querySelectorAll('img[src*="ytimg.com/vi/"]')` 定位缩略图后向上追溯父节点进行 DOM 重构，但由于 Gemini 实际运行时的 DOM 结构可能与预期不符（Shadow DOM、动态渲染等因素），该方案未能正确匹配到目标节点。
2. **改为 Markdown 字符串后处理（成功）**：鉴于需求文档中已明确给出了错误和正确的 Markdown 格式，改为直接在 `turndownService.turndown()` 的输出字符串上利用正则进行文本级修复。这种方法不依赖 DOM 结构，只要最终的 Markdown 文本模式匹配即可，是更稳健的方案。
