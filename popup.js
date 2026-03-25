/**
 * @fileoverview 弹出设置界面逻辑 - 加载/保存用户设置（含文件名自定义）
 * 支持 i18n 国际化，自动跟随浏览器语言
 * @version 0.0.21
 * @author masclown
 * @license GPL-3.0
 * @copyright 2026 unibox
 *
 * AIchat2doc - AI对话导出为Obsidian笔记
 * Copyright (C) 2026 masclown
 */

/** 默认设置值 */
const DEFAULT_SETTINGS = {
  vaultName: 'Obsidian',
  fileNameMode: 'combined',       // 'combined' | 'template'
  timestampFormat: '12',          // '14' | '12' | '8' | 'none'
  separator: '-',                 // '-' | '_' | ' ' | ''
  sourceMode: 'default',          // 'default' | 'custom'
  customSource: '',               // 自定义来源文本
  fileNameTemplate: '{YYYY}{MM}{DD}{HH}{mm}-{source}' + chrome.i18n.getMessage('chatLog')
};

/**
 * 应用 i18n 国际化翻译到页面所有带 data-i18n 属性的元素
 * - data-i18n：替换元素的 textContent
 * - data-i18n-placeholder：替换元素的 placeholder 属性
 */
function applyI18n() {
  // 翻译 textContent
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const msg = chrome.i18n.getMessage(key);
    if (msg) el.textContent = msg;
  });

  // 翻译 placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const msg = chrome.i18n.getMessage(key);
    if (msg) el.placeholder = msg;
  });

  // 翻译页面标题
  const titleMsg = chrome.i18n.getMessage('settingsTitle');
  if (titleMsg) document.title = titleMsg;
}

/**
 * 根据当前表单设置生成文件名预览字符串
 * @returns {string} 预览文件名
 */
function generatePreview() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const vars = {
    YYYY: String(now.getFullYear()),
    MM: pad(now.getMonth() + 1),
    DD: pad(now.getDate()),
    HH: pad(now.getHours()),
    mm: pad(now.getMinutes()),
    ss: pad(now.getSeconds()),
    source: 'Gemini',  // 预览用示例平台名
    title: chrome.i18n.getMessage('sampleTitle') || '关于AI的探讨'
  };

  const mode = document.getElementById('fileNameMode').value;

  if (mode === 'template') {
    const template = document.getElementById('fileNameTemplate').value || DEFAULT_SETTINGS.fileNameTemplate;
    return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] !== undefined ? vars[key] : `{${key}}`);
  }

  // 组合模式
  const tsFormat = document.getElementById('timestampFormat').value;
  const sourceMode = document.getElementById('sourceMode').value;

  let timestamp = '';
  switch (tsFormat) {
    case '14': timestamp = `${vars.YYYY}${vars.MM}${vars.DD}${vars.HH}${vars.mm}${vars.ss}`; break;
    case '12': timestamp = `${vars.YYYY}${vars.MM}${vars.DD}${vars.HH}${vars.mm}`; break;
    case '8': timestamp = `${vars.YYYY}${vars.MM}${vars.DD}`; break;
    case 'none': timestamp = ''; break;
  }

  const sep = document.getElementById('separator').value;

  let source = '';
  if (sourceMode === 'custom') {
    source = document.getElementById('customSource').value.trim() || chrome.i18n.getMessage('customNamePlaceholder');
  } else if (sourceMode === 'title') {
    source = vars.title;
  } else {
    source = `${vars.source}${chrome.i18n.getMessage('chatLog')}`;
  }

  if (timestamp && source) return `${timestamp}${sep}${source}`;
  if (timestamp) return timestamp;
  return source || chrome.i18n.getMessage('unnamed');
}

/**
 * 更新预览显示
 */
function updatePreview() {
  document.getElementById('fileNamePreview').textContent = generatePreview();
}

/**
 * 根据文件名模式切换显示/隐藏对应的设置区域
 */
function toggleFileNameMode() {
  const mode = document.getElementById('fileNameMode').value;
  document.getElementById('combinedSettings').style.display = mode === 'combined' ? 'block' : 'none';
  document.getElementById('templateSettings').style.display = mode === 'template' ? 'block' : 'none';
  updatePreview();
}

/**
 * 根据来源模式切换自定义输入框的显示
 */
function toggleSourceMode() {
  const sourceMode = document.getElementById('sourceMode').value;
  document.getElementById('customSourceGroup').style.display = sourceMode === 'custom' ? 'flex' : 'none';
  updatePreview();
}

/**
 * 从 chrome.storage.local 加载设置并填充到表单
 */
function loadSettings() {
  chrome.storage.local.get(DEFAULT_SETTINGS, (result) => {
    document.getElementById('vaultName').value = result.vaultName || DEFAULT_SETTINGS.vaultName;
    document.getElementById('fileNameMode').value = result.fileNameMode || DEFAULT_SETTINGS.fileNameMode;
    document.getElementById('timestampFormat').value = result.timestampFormat || DEFAULT_SETTINGS.timestampFormat;
    document.getElementById('separator').value = result.separator !== undefined ? result.separator : DEFAULT_SETTINGS.separator;
    document.getElementById('sourceMode').value = result.sourceMode || DEFAULT_SETTINGS.sourceMode;
    document.getElementById('customSource').value = result.customSource || '';
    document.getElementById('fileNameTemplate').value = result.fileNameTemplate || DEFAULT_SETTINGS.fileNameTemplate;

    toggleFileNameMode();
    toggleSourceMode();
    updatePreview();
  });
}

/**
 * 将表单中的设置保存到 chrome.storage.local
 */
function saveSettings() {
  const vaultName = document.getElementById('vaultName').value.trim();

  if (!vaultName) {
    showStatus(chrome.i18n.getMessage('vaultNameRequired'), 'error');
    return;
  }

  const settings = {
    vaultName,
    fileNameMode: document.getElementById('fileNameMode').value,
    timestampFormat: document.getElementById('timestampFormat').value,
    separator: document.getElementById('separator').value,
    sourceMode: document.getElementById('sourceMode').value,
    customSource: document.getElementById('customSource').value.trim(),
    fileNameTemplate: document.getElementById('fileNameTemplate').value.trim() || DEFAULT_SETTINGS.fileNameTemplate
  };

  chrome.storage.local.set(settings, () => {
    if (chrome.runtime.lastError) {
      showStatus(chrome.i18n.getMessage('saveFailed', [chrome.runtime.lastError.message]), 'error');
    } else {
      showStatus(chrome.i18n.getMessage('saveSuccess'), 'success');
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

// ========== 事件绑定 ==========

// 页面加载时先应用 i18n 翻译，再读取设置
document.addEventListener('DOMContentLoaded', () => {
  applyI18n();
  loadSettings();
});

// 保存按钮
document.getElementById('saveBtn').addEventListener('click', saveSettings);

// 模式切换
document.getElementById('fileNameMode').addEventListener('change', toggleFileNameMode);
document.getElementById('sourceMode').addEventListener('change', toggleSourceMode);

// 实时预览：所有可能影响文件名的输入都触发预览更新
document.getElementById('timestampFormat').addEventListener('change', updatePreview);
document.getElementById('separator').addEventListener('change', updatePreview);
document.getElementById('customSource').addEventListener('input', updatePreview);
document.getElementById('fileNameTemplate').addEventListener('input', updatePreview);
