/**
 * @fileoverview 弹出设置界面逻辑 - 加载/保存用户设置
 * @version 0.0.18
 * @author masclown
 * @license GPL-3.0
 * @copyright 2026 unibox
 *
 * AIchat2doc - AI对话导出为Obsidian笔记
 * Copyright (C) 2026 masclown
 */

/** 默认设置值 */
const DEFAULT_SETTINGS = {
  vaultName: 'Obsidian'
};

/**
 * 从 chrome.storage.local 加载设置并填充到表单
 */
function loadSettings() {
  chrome.storage.local.get(DEFAULT_SETTINGS, (result) => {
    document.getElementById('vaultName').value = result.vaultName || DEFAULT_SETTINGS.vaultName;
  });
}

/**
 * 将表单中的设置保存到 chrome.storage.local
 */
function saveSettings() {
  const vaultName = document.getElementById('vaultName').value.trim();

  if (!vaultName) {
    showStatus('Obsidian 库名称不能为空', 'error');
    return;
  }

  const settings = { vaultName };

  chrome.storage.local.set(settings, () => {
    if (chrome.runtime.lastError) {
      showStatus('保存失败：' + chrome.runtime.lastError.message, 'error');
    } else {
      showStatus('✓ 设置已保存', 'success');
    }
  });
}

/**
 * 显示状态消息，2 秒后自动隐藏
 * @param {string} message - 消息文本
 * @param {string} type - 消息类型（'success' 或 'error'）
 */
function showStatus(message, type) {
  const statusEl = document.getElementById('statusMsg');
  statusEl.textContent = message;
  statusEl.className = `status-msg ${type}`;

  clearTimeout(showStatus._timer);
  showStatus._timer = setTimeout(() => {
    statusEl.className = 'status-msg hidden';
  }, 2000);
}

// 页面加载时读取设置
document.addEventListener('DOMContentLoaded', loadSettings);

// 保存按钮点击事件
document.getElementById('saveBtn').addEventListener('click', saveSettings);

// 支持 Enter 键保存
document.getElementById('vaultName').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    saveSettings();
  }
});
