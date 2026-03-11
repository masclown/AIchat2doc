/**
 * @fileoverview 主模块
 * @version 0.0.11
 * @author masclown
 * @license GPL-3.0
 * @copyright 2026 unibox
 * 
 * AIchat2doc - AI对话导出为Obsidian笔记
 * Copyright (C) 2026 masclown
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// 核心配置：Obsidian 库名称
const VAULT_NAME = "Obsidian";  // 更改为Obsidian库的名称

// 1. 初始化 Turndown 实例
const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
});

// 2. 挂载 GFM 插件以支持表格
const gfm = turndownPluginGfm.gfm;
turndownService.use(gfm);

function init() {
    /**
     * @description 初始化插件，监听DOM变化以便在每条回答底部附上我们的自定义按钮
     */
    let timeout = null;

    const observer = new MutationObserver(() => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            const copyButtons = document.querySelectorAll('copy-button');

            copyButtons.forEach(copyBtn => {
                const actionBar = copyBtn.parentElement;

                if (actionBar && !actionBar.querySelector('[data-test-id="gemini-to-obsidian-btn"]')) {
                    const obBtn = injectSaveButton(copyBtn, actionBar);
                    injectDownloadButton(obBtn, actionBar);
                }
            });
        }, 300);
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

function getMarkdownContent(actionBar) {
    /**
     * @description 从页面DOM中获取对应的AI回复并转化为Markdown内容
     * @param {HTMLElement} actionBar - 操作栏元素
     * @returns {string|null} - 转化后的Markdown字符串，若未找到内容节点则返回null
     */
    let currentEl = actionBar;
    let contentEl = null;

    while (currentEl && currentEl !== document.body) {
        contentEl = currentEl.parentElement ? currentEl.parentElement.querySelector('[id*="model-response-message-content"]') : null;
        if (contentEl) break;
        currentEl = currentEl.parentElement;
    }

    if (!contentEl) return null;

    // 深拷贝节点，避免破坏网页原生 DOM
    const clone = contentEl.cloneNode(true);

    // --- DOM 清洗与重组开始 ---

    // 问题3修复：处理代码块
    const preElements = clone.querySelectorAll('pre');
    preElements.forEach(pre => {
        let current = pre.parentElement;
        let header = null;
        // 向上寻找代码块顶部的 header 容器
        while (current && current !== clone) {
            if (current.previousElementSibling) {
                header = current.previousElementSibling;
                break;
            }
            current = current.parentElement;
        }

        if (header) {
            // 提取语言名称（如 "javascript"）
            let lang = header.textContent.trim().split(/\n/)[0].split(/\s+/)[0];
            const codeEl = pre.querySelector('code');
            if (codeEl && lang) {
                // 赋予类名，Turndown 会自动将其放置在 ``` 之后
                codeEl.className = `language-${lang}`;
            }
            // 删除头部，防止语言名称和“复制”字眼变成正文的普通文本
            header.remove();
        }
    });

    // 问题2修复：消除列表间的多余换行
    // 将 <li> 内部的 <p> 标签替换为 <span>，防止 Turndown 为 <p> 强制增加双换行
    const listParagraphs = clone.querySelectorAll('li p');
    listParagraphs.forEach(p => {
        const span = document.createElement('span');
        span.innerHTML = p.innerHTML;
        p.parentNode.replaceChild(span, p);
    });

    // 问题4修复：清除表格后的“导出到 Google 表格”等无用元素
    const elementsToCheck = clone.querySelectorAll('*');
    elementsToCheck.forEach(el => {
        const text = el.textContent.trim();
        if ((text === '导出到 Google 表格' || text === 'Export to Sheets') && el.parentElement) {
            let current = el;
            while (current && current !== clone && current.textContent.trim() === text) {
                const parent = current.parentElement;
                current.remove();
                current = parent;
            }
        }
    });

    // --- DOM 清洗与重组结束 ---

    let markdownContent = turndownService.turndown(clone.innerHTML);

    // 最终的文本清理：去除多余空行，仅保留标题前的空行
    // 通过 '```' 切割字符串，确保不对代码块内部的换行进行误操作
    const parts = markdownContent.split('```');
    for (let i = 0; i < parts.length; i++) {
        // 偶数索引部分是外部正文，奇数索引部分是代码块内部
        if (i % 2 === 0) {
            // 1. 将连续的2个及以上换行，如果紧接着的下一行不是标题(#)和表格(|)，则压缩为0个换行
            parts[i] = parts[i].replace(/\n{1,}(?![ \t]*[#|])/g, '\n');

            // 2. 如果紧接着的下一行是标题(#)或表格(|)，则统一保留1个换行（即专门留出1个空行分隔标题或表格）
            parts[i] = parts[i].replace(/\n{2,}(?=[ \t]*[#|])/g, '\n\n');
        }
    }

    return parts.join('```');
}

function injectSaveButton(copyBtn, actionBar) {
    /**
     * @description 在页面原有复制按钮旁边注入保存至Obsidian按钮
     * @param {HTMLElement} copyBtn - 原有的复制按钮节点
     * @param {HTMLElement} actionBar - 包含按钮的父容器
     * @returns {HTMLElement} - 我们新生成的 Obsidian 按钮
     */
    const btn = copyBtn.cloneNode(true);

    btn.removeAttribute('id');
    btn.setAttribute('data-test-id', 'gemini-to-obsidian-btn');

    const interactive = btn.matches('button') ? btn : (btn.querySelector('button, [role="button"]') || btn);
    interactive.setAttribute('aria-label', "Save to Obsidian");
    interactive.title = "Save to Obsidian";
    interactive.removeAttribute('aria-describedby');

    const icon = btn.querySelector('mat-icon');
    if (icon) {
        const iconName = 'book';
        icon.setAttribute('fonticon', iconName);
        icon.setAttribute('data-mat-icon-name', iconName);
        icon.textContent = '';
    }

    interactive.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const markdownContent = getMarkdownContent(actionBar);
        if (markdownContent) {
            saveToObsidian(markdownContent);
        } else {
            console.error("未能定位到对应的文本内容节点。");
        }
    };

    copyBtn.insertAdjacentElement('afterend', btn);
    return btn;
}

function injectDownloadButton(lastBtn, actionBar) {
    /**
     * @description 在上一个按钮之后注入下载 Markdown 的按钮
     * @param {HTMLElement} lastBtn - 要在其后注入的新按钮的前一个按钮
     * @param {HTMLElement} actionBar - 包含按钮的父容器
     */
    const btn = lastBtn.cloneNode(true);

    btn.removeAttribute('id');
    btn.setAttribute('data-test-id', 'gemini-download-md-btn');

    const interactive = btn.matches('button') ? btn : (btn.querySelector('button, [role="button"]') || btn);
    interactive.setAttribute('aria-label', "Download as Markdown");
    interactive.title = "Download as Markdown";
    interactive.removeAttribute('aria-describedby');

    const icon = btn.querySelector('mat-icon');
    if (icon) {
        const iconName = 'download';
        icon.setAttribute('fonticon', iconName);
        icon.setAttribute('data-mat-icon-name', iconName);
        icon.textContent = '';
    }

    interactive.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const markdownContent = getMarkdownContent(actionBar);
        if (markdownContent) {
            downloadMarkdown(markdownContent);
        } else {
            console.error("未能定位到对应的文本内容节点。");
        }
    };

    lastBtn.insertAdjacentElement('afterend', btn);
}

function getFormattedFileName() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}-Gemini对话记录`;
}

function saveToObsidian(content) {
    /**
     * @description 将内容发送至 Obsidian 协议打开新建笔记
     * @param {string} content - 需要被保存为笔记的 Markdown 字符串
     */
    const fileName = getFormattedFileName();
    const encodedContent = encodeURIComponent(content);
    const url = `obsidian://new?vault=${VAULT_NAME}&name=${encodeURIComponent(fileName)}&content=${encodedContent}`;

    window.location.href = url;
}

function downloadMarkdown(content) {
    /**
     * @description 将 Markdown 内容即刻下载为本地的 .md 文件
     * @param {string} content - 需要被下载的 Markdown 字符串
     */
    const fileName = `${getFormattedFileName()}.md`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;

    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

init();