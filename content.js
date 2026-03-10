/**
 * @fileoverview 主模块
 * @version 0.0.8
 * @author masclown
 * @license MIT
 * @copyright 2026 unibox
 */


// 核心配置：Obsidian 库名称
const VAULT_NAME = "Obsidian";  // 更改为Obsidian库的名称，默认是"YourVaultName"

// 1. 初始化 Turndown 实例
const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
});

// 2. 挂载 GFM 插件以支持表格
const gfm = turndownPluginGfm.gfm;
turndownService.use(gfm);

function init() {
    let timeout = null;

    const observer = new MutationObserver(() => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            const copyButtons = document.querySelectorAll('copy-button');

            copyButtons.forEach(copyBtn => {
                const actionBar = copyBtn.parentElement;

                if (actionBar && !actionBar.querySelector('[data-test-id="gemini-to-obsidian-btn"]')) {
                    injectSaveButton(copyBtn, actionBar);
                }
            });
        }, 300);
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

function injectSaveButton(copyBtn, actionBar) {
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

        let currentEl = actionBar;
        let contentEl = null;

        while (currentEl && currentEl !== document.body) {
            contentEl = currentEl.parentElement ? currentEl.parentElement.querySelector('[id*="model-response-message-content"]') : null;
            if (contentEl) break;
            currentEl = currentEl.parentElement;
        }

        if (contentEl) {
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
            markdownContent = parts.join('```');

            saveToObsidian(markdownContent);
        } else {
            console.error("未能定位到对应的文本内容节点。");
        }
    };

    copyBtn.insertAdjacentElement('afterend', btn);
}

function saveToObsidian(content) {
    const fileName = `Gemini_${new Date().getTime()}`;
    const encodedContent = encodeURIComponent(content);
    const url = `obsidian://new?vault=${VAULT_NAME}&name=${fileName}&content=${encodedContent}`;

    window.location.href = url;
}

init();