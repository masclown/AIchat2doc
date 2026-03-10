// 核心配置：Obsidian 库名称
const VAULT_NAME = "Obsidian";  // 更改为Obsidian库的名称

function init() {
    // 持续监听：处理后续通过对话新生成的元素，以及被其他插件重写的 DOM
    const observer = new MutationObserver(() => {
        // 放宽匹配规则，抓取所有可能的操作栏容器
        const actionBars = document.querySelectorAll('[class*="buttons-container"]');

        actionBars.forEach(actionBar => {
            // 核心修改：检查容器内是否真实存在我们的按钮
            // 如果不存在（初始状态，或者被 Voyager 覆盖抹除了），则执行注入
            if (!actionBar.querySelector('.obsidian-icon-btn')) {
                injectSaveButton(actionBar);
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

function injectSaveButton(actionBar) {
    const btn = document.createElement('button');
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

    // 直接追加到操作栏的最末端（会在 Voyager 的按钮之后）
    actionBar.appendChild(btn);
}

function saveToObsidian(content) {
    const fileName = `Gemini_${new Date().getTime()}`;
    const encodedContent = encodeURIComponent(content);
    const url = `obsidian://new?vault=${VAULT_NAME}&name=${fileName}&content=${encodedContent}`;

    window.location.href = url;
}

// 启动脚本
init();