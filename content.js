// 核心配置：Obsidian 库名称
const VAULT_NAME = "Obsidian";  // 更改为Obsidian库的名称

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
    // 1. 恢复克隆外层组件，以保留原生的 CSS 占位和 Flex 布局
    const btn = copyBtn.cloneNode(true);

    btn.removeAttribute('id');
    btn.setAttribute('data-test-id', 'gemini-to-obsidian-btn');

    const interactive = btn.matches('button') ? btn : (btn.querySelector('button, [role="button"]') || btn);
    interactive.setAttribute('aria-label', "Save to Obsidian");
    interactive.title = "Save to Obsidian";
    interactive.removeAttribute('aria-describedby');

    // 2. 核心修复：只修改属性，清空 textContent，杜绝双图标渲染
    const icon = btn.querySelector('mat-icon');
    if (icon) {
        const iconName = 'book';

        // 修改原生调用的属性
        icon.setAttribute('fonticon', iconName);
        icon.setAttribute('data-mat-icon-name', iconName);

        // 必须清空内部文本，防止 Ligature 连字机制二次渲染
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
            saveToObsidian(contentEl.innerText);
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