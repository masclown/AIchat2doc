// 核心配置：Obsidian 库名称
const VAULT_NAME = "Obsidian";  // 更改为Obsidian库的名称

// 1. 监听 DOM 变化，确保新生成的对话也能被加上按钮
const observer = new MutationObserver((mutations) => {
    const containers = document.querySelectorAll('structured-content-container:not(.obsidian-btn-added)');
    containers.forEach(container => {
        injectSaveButton(container);
    });
});

observer.observe(document.body, { childList: true, subtree: true });

// 2. 注入按钮逻辑
function injectSaveButton(container) {
    container.classList.add('obsidian-btn-added'); // 防止重复注入

    const btn = document.createElement('button');
    btn.innerText = "Save to Obsidian";
    btn.className = "obsidian-save-btn";

    // 寻找 ID 包含 model-response-message-content 的元素
    btn.onclick = () => {
        const contentEl = container.querySelector('[id*="model-response-message-content"]');
        if (contentEl) {
            saveToObsidian(contentEl.innerText);
        }
    };

    container.appendChild(btn);
}

// 3. 调用 Obsidian URI 协议
function saveToObsidian(content) {
    const fileName = `Gemini_${new Date().getTime()}`;
    const encodedContent = encodeURIComponent(content);
    const url = `obsidian://new?vault=${VAULT_NAME}&name=${fileName}&content=${encodedContent}`;

    window.location.href = url;
}