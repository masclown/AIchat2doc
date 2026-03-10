/**
 * @fileoverview 主模块
 * @version 0.0.6
 * @author masclown
 * @license MIT
 * @copyright 2026 unibox
 */


// 核心配置：Obsidian 库名称
const VAULT_NAME = "Obsidian";  // 更改为Obsidian库的名称，默认是"YourVaultName"

// 初始化 Turndown 实例，并配置常用的 Markdown 风格
const turndownService = new TurndownService({
    headingStyle: 'atx', // 使用 # 作为标题前缀
    codeBlockStyle: 'fenced' // 使用 ``` 作为代码块标记
});

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
            // 核心修改：使用 Turndown 将 HTML 转换为 Markdown
            // 使用 cloneNode 避免在预处理时修改页面上的真实 DOM
            const clone = contentEl.cloneNode(true);
            const markdownContent = turndownService.turndown(clone.innerHTML);

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