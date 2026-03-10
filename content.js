// 核心配置：Obsidian 库名称
const VAULT_NAME = "Obsidian";  // 更改为Obsidian库的名称

function init() {
    let timeout = null;

    const observer = new MutationObserver(() => {
        // 防抖机制：延迟执行，避免高频触发导致页面卡顿
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            // 精准定位所有原生“复制”按钮组件
            const copyButtons = document.querySelectorAll('copy-button');

            copyButtons.forEach(copyBtn => {
                const actionBar = copyBtn.parentElement;

                // 检查操作栏是否存在，并且我们自己的按钮还没被添加过
                if (actionBar && !actionBar.querySelector('[data-test-id="gemini-to-obsidian-btn"]')) {
                    injectSaveButton(copyBtn, actionBar);
                }
            });
        }, 300); // 300毫秒内没有新的DOM变化才执行
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

function injectSaveButton(copyBtn, actionBar) {
    const btn = document.createElement('button');
    btn.setAttribute('data-test-id', 'gemini-to-obsidian-btn');

    // 完全复刻 Gemini 原生操作按钮的 CSS 类名
    btn.className = "mdc-button mat-mdc-button-base mat-mdc-tooltip-trigger icon-button mat-mdc-button mat-unthemed";
    btn.title = "Save to Obsidian";
    btn.style.minWidth = "48px"; // 适配原生按钮宽度
    btn.style.padding = "0";

    // 复刻原生内部结构，包裹 SVG 图标
    btn.innerHTML = `
        <span class="mat-mdc-button-persistent-ripple mdc-button__ripple"></span>
        <mat-icon role="img" class="mat-icon notranslate gds-icon-l google-symbols mat-ligature-font mat-icon-no-color" aria-hidden="true" style="display: flex; justify-content: center; align-items: center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
        </mat-icon>
        <span class="mdc-button__label"></span>
        <span class="mat-focus-indicator"></span>
        <span class="mat-mdc-button-touch-target"></span>
    `;

    btn.onclick = (e) => {
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

    // 核心定位：将新按钮直接插入到“复制”按钮的后面（右侧）
    copyBtn.insertAdjacentElement('afterend', btn);
}

function saveToObsidian(content) {
    const fileName = `Gemini_${new Date().getTime()}`;
    const encodedContent = encodeURIComponent(content);
    const url = `obsidian://new?vault=${VAULT_NAME}&name=${fileName}&content=${encodedContent}`;

    window.location.href = url;
}

init();