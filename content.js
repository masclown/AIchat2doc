// 核心配置：Obsidian 库名称
const VAULT_NAME = "Obsidian";  // 更改为Obsidian库的名称

function init() {
    const observer = new MutationObserver(() => {
        // 精准定位：只寻找原生对话下方的“复制”按钮组件
        const copyButtons = document.querySelectorAll('copy-button');

        copyButtons.forEach(copyBtn => {
            // 获取复制按钮所在的父容器（即真正的操作栏）
            const actionBar = copyBtn.parentElement;

            // 核心修改：使用专属的 data-test-id 进行唯一性检查
            if (actionBar && !actionBar.querySelector('[data-test-id="gemini-to-obsidian-btn"]')) {
                injectSaveButton(actionBar);
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

function injectSaveButton(actionBar) {
    const btn = document.createElement('button');
    // 添加类似 Voyager 的自定义属性，用于精准识别
    btn.setAttribute('data-test-id', 'gemini-to-obsidian-btn');
    btn.className = "obsidian-icon-btn";
    btn.title = "Save to Obsidian";

    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>`;

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

    // 追加到操作栏的末端
    actionBar.appendChild(btn);
}

function saveToObsidian(content) {
    const fileName = `Gemini_${new Date().getTime()}`;
    const encodedContent = encodeURIComponent(content);
    const url = `obsidian://new?vault=${VAULT_NAME}&name=${fileName}&content=${encodedContent}`;

    window.location.href = url;
}

init();