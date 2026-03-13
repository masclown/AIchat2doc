/**
 * @fileoverview 主模块 - 适配多平台
 * @version 0.0.15
 * @author masclown
 * @license GPL-3.0
 * @copyright 2026 unibox
 * 
 * AIchat2doc - AI对话导出为Obsidian笔记
 * Copyright (C) 2026 masclown
 */

const VAULT_NAME = "Obsidian";

const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
});
const gfm = turndownPluginGfm.gfm;
turndownService.use(gfm);

turndownService.addRule('fencedCodeBlock', {
    filter: function (node) {
        return (
            node.nodeName === 'PRE' &&
            node.firstElementChild &&
            node.firstElementChild.nodeName === 'CODE'
        );
    },
    replacement: function (content, node) {
        const className = node.firstElementChild.className || '';
        const match = className.match(/language-(\S+)/);
        const language = match ? match[1] : '';
        const code = node.firstElementChild.textContent || '';
        return '\n\n```' + language + '\n' + code.trim() + '\n```\n\n';
    }
});

const PLATFORMS = {
    gemini: {
        name: 'Gemini',
        match: () => window.location.hostname.includes('gemini.google.com'),
        getCopyButtons: () => document.querySelectorAll('copy-button'),
        getActionBar: (btn) => btn.parentElement,
        hasInjected: (actionBar) => actionBar.querySelector('[data-test-id="gemini-to-obsidian-btn"]'),
        inject: (copyBtn, actionBar, saveHandler, downloadHandler) => {
            const createBtn = (originalBtn, title, iconName, id) => {
                const btn = originalBtn.cloneNode(true);
                btn.removeAttribute('id');
                btn.setAttribute('data-test-id', id);
                const interactive = btn.matches('button') ? btn : (btn.querySelector('button, [role="button"]') || btn);
                interactive.setAttribute('aria-label', title);
                interactive.title = title;
                interactive.removeAttribute('aria-describedby');
                const icon = btn.querySelector('mat-icon');
                if (icon) {
                    icon.setAttribute('fonticon', iconName);
                    icon.setAttribute('data-mat-icon-name', iconName);
                    icon.textContent = '';
                }
                interactive.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (id === 'gemini-to-obsidian-btn') saveHandler(actionBar);
                    else downloadHandler(actionBar);
                };
                return btn;
            };

            const obBtn = createBtn(copyBtn, "Save to Obsidian", 'book', 'gemini-to-obsidian-btn');
            const dlBtn = createBtn(copyBtn, "Download as Markdown", 'download', 'gemini-download-md-btn');

            copyBtn.insertAdjacentElement('afterend', dlBtn);
            copyBtn.insertAdjacentElement('afterend', obBtn);
        },
        getContentNode: (actionBar) => {
            let currentEl = actionBar;
            while (currentEl && currentEl !== document.body) {
                const contentEl = currentEl.parentElement ? currentEl.parentElement.querySelector('[id*="model-response-message-content"]') : null;
                if (contentEl) return contentEl;
                currentEl = currentEl.parentElement;
            }
            return null;
        },
        cleanDOM: (clone) => {
            const preElements = clone.querySelectorAll('pre');
            preElements.forEach(pre => {
                let current = pre;
                let header = null;
                for (let i = 0; i < 3 && current && current !== clone; i++) {
                    if (current.previousElementSibling) {
                        header = current.previousElementSibling;
                        break;
                    }
                    current = current.parentElement;
                }
                if (header && ['DIV', 'SPAN', 'HEADER'].includes(header.nodeName)) {
                    let firstLine = header.textContent.trim().split(/\n/)[0].trim();
                    if (firstLine.length < 30) {
                        let langMatch = firstLine.match(/^[a-zA-Z0-9_+#-]+/);
                        let lang = langMatch && !/^\d+$/.test(langMatch[0]) ? langMatch[0].toUpperCase() : '';
                        const codeEl = pre.querySelector('code');
                        if (codeEl && lang) {
                            codeEl.className = `language-${lang}`;
                        }
                        header.remove();
                    }
                }
            });

            const listParagraphs = clone.querySelectorAll('li p');
            listParagraphs.forEach(p => {
                const span = document.createElement('span');
                span.innerHTML = p.innerHTML;
                p.parentNode.replaceChild(span, p);
            });

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
        }
    },
    deepseek: {
        name: 'DeepSeek',
        match: () => window.location.hostname.includes('chat.deepseek.com'),
        getCopyButtons: () => {
            const btns = Array.from(document.querySelectorAll('.ds-icon-button'));
            return btns.filter(btn => {
                const svg = btn.querySelector('svg');
                return svg && svg.innerHTML.includes('M6.14923 4.02032');
            });
        },
        getActionBar: (btn) => btn.parentElement,
        hasInjected: (actionBar) => actionBar.querySelector('[data-test-id="ai-to-obsidian-btn"]'),
        inject: (copyBtn, actionBar, saveHandler, downloadHandler) => {
            const createBtn = (originalBtn, title, svgPath, id) => {
                const btn = originalBtn.cloneNode(true);
                btn.removeAttribute('id');
                btn.setAttribute('data-test-id', id);
                btn.title = title;
                btn.setAttribute('aria-label', title);

                const svg = btn.querySelector('svg');
                if (svg) {
                    svg.innerHTML = `<path d="${svgPath}" fill="currentColor"></path>`;
                }

                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (id === 'ai-to-obsidian-btn') saveHandler(actionBar);
                    else downloadHandler(actionBar);
                };
                return btn;
            };

            const obSvgPath = "M2 2v12h10V2H2zm1 1h8v10H3V3zm1 2v1h6V5H4zm0 2v1h6V7H4zm0 2v1h4V9H4z";
            const dlSvgPath = "M8 12l-4-4h2.5V3h3v5H12L8 12zM3 13v2h10v-2H3z";

            const obBtn = createBtn(copyBtn, "Save to Obsidian", obSvgPath, 'ai-to-obsidian-btn');
            const dlBtn = createBtn(copyBtn, "Download as Markdown", dlSvgPath, 'ai-download-md-btn');

            copyBtn.insertAdjacentElement('afterend', dlBtn);
            copyBtn.insertAdjacentElement('afterend', obBtn);
        },
        getContentNode: (actionBar) => {
            let currentEl = actionBar;
            while (currentEl && currentEl !== document.body) {
                const parent = currentEl.parentElement;
                if (!parent) break;
                const mdNodes = Array.from(parent.querySelectorAll('.ds-markdown'));
                if (mdNodes.length > 0) {
                    return mdNodes[mdNodes.length - 1];
                }
                currentEl = parent;
            }
            return null;
        },
        cleanDOM: (clone) => {
            clone.querySelectorAll('button').forEach(btn => btn.remove());
            clone.querySelectorAll('svg').forEach(svg => svg.remove());

            const preElements = clone.querySelectorAll('pre');
            preElements.forEach(pre => {
                let current = pre;
                let header = null;
                for (let i = 0; i < 3 && current && current !== clone; i++) {
                    if (current.previousElementSibling) {
                        header = current.previousElementSibling;
                        break;
                    }
                    current = current.parentElement;
                }

                let lang = '';
                if (header && ['DIV', 'SPAN', 'HEADER'].includes(header.nodeName)) {
                    let firstLine = header.textContent.trim().split(/\n/)[0].trim();
                    if (firstLine.length < 30) {
                        const langMatch = firstLine.match(/^[a-zA-Z0-9_+#-]+/);
                        if (langMatch && !/^\d+$/.test(langMatch[0]) && !['复制', '下载', 'copy'].includes(langMatch[0].toLowerCase())) {
                            lang = langMatch[0].toUpperCase();
                        }
                        header.remove();
                    }
                }

                const rawCode = pre.textContent;
                const codeEl = document.createElement('code');
                if (lang) {
                    codeEl.className = `language-${lang}`;
                }
                codeEl.textContent = rawCode;
                pre.innerHTML = '';
                pre.appendChild(codeEl);
            });

            const listParagraphs = clone.querySelectorAll('li p');
            listParagraphs.forEach(p => {
                const span = document.createElement('span');
                span.innerHTML = p.innerHTML;
                p.parentNode.replaceChild(span, p);
            });

            const links = clone.querySelectorAll('a');
            links.forEach(a => {
                const text = a.textContent.trim();
                if (/^\[?\-?\s*\d+\]?$/.test(text)) {
                    let num = text.replace(/[^0-9]/g, '');
                    a.textContent = `🔗${num}`;
                    if (!a.closest('sup')) {
                        const sup = document.createElement('sup');
                        a.parentNode.insertBefore(sup, a);
                        sup.appendChild(a);
                    }
                }
            });
        }
    },
    kimi: {
        name: 'Kimi',
        match: () => window.location.hostname.includes('kimi.moonshot.cn') || window.location.hostname.includes('kimi.com'),
        getCopyButtons: () => {
            const btns = Array.from(document.querySelectorAll('.segment-assistant-actions .icon-button'));
            return btns.filter(btn => {
                const svg = btn.querySelector('svg');
                return svg && svg.getAttribute('name') === 'Copy';
            });
        },
        getActionBar: (btn) => btn.parentElement,
        hasInjected: (actionBar) => actionBar.querySelector('[data-test-id="kimi-to-obsidian-btn"]'),
        inject: (copyBtn, actionBar, saveHandler, downloadHandler) => {
            const createBtn = (originalBtn, title, svgName, svgPath, id) => {
                const btn = originalBtn.cloneNode(true);
                btn.removeAttribute('id');
                btn.setAttribute('data-test-id', id);
                btn.title = title;
                btn.setAttribute('aria-label', title);
                btn.style.marginLeft = '4px';

                const svg = btn.querySelector('svg');
                if (svg) {
                    svg.setAttribute('name', svgName);
                    svg.setAttribute('viewBox', '0 0 16 16');
                    svg.innerHTML = `<path d="${svgPath}" fill="currentColor"></path>`;
                }

                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (id === 'kimi-to-obsidian-btn') saveHandler(actionBar);
                    else downloadHandler(actionBar);
                };
                return btn;
            };

            const obSvgPath = "M2 2v12h10V2H2zm1 1h8v10H3V3zm1 2v1h6V5H4zm0 2v1h6V7H4zm0 2v1h4V9H4z";
            const dlSvgPath = "M8 12l-4-4h2.5V3h3v5H12L8 12zM3 13v2h10v-2H3z";

            const obBtn = createBtn(copyBtn, "Save to Obsidian", 'Obsidian', obSvgPath, 'kimi-to-obsidian-btn');
            const dlBtn = createBtn(copyBtn, "Download as Markdown", 'DownloadMD', dlSvgPath, 'kimi-download-md-btn');

            copyBtn.insertAdjacentElement('afterend', dlBtn);
            copyBtn.insertAdjacentElement('afterend', obBtn);
        },
        getContentNode: (actionBar) => {
            let currentEl = actionBar;
            while (currentEl && currentEl !== document.body) {
                const parent = currentEl.parentElement;
                if (!parent) break;
                const mdNodes = Array.from(parent.querySelectorAll('.markdown'));
                if (mdNodes.length > 0) {
                    return mdNodes[mdNodes.length - 1]; // 返回最近一级的 markdown 内容节点
                }
                currentEl = parent;
            }
            return null;
        },
        /**
         * 针对 Kimi 特定的 DOM 清理：
         * 1. 移除自定义的代码块标题区 .segment-code-header
         * 2. 移除一些无用的按钮 .simple-button
         * 3. 移除无用的空 div，防止出现过多排版换行
         * 4. 修复 Kimi 中列表中嵌套的 div.paragraph 导致的多余换行
         * 5. 移除表格上方的操作栏（包含“表格”字样和按钮）
         */
        cleanDOM: (clone) => {
            clone.querySelectorAll('.segment-code-header').forEach(header => header.remove());
            clone.querySelectorAll('.simple-button').forEach(btn => btn.remove());
            clone.querySelectorAll('.table-actions').forEach(action => action.remove());
            clone.querySelectorAll('div').forEach(div => {
                if (div.children.length === 0 && div.textContent.trim() === '') {
                    div.remove();
                }
            });
            // 彻底去除列表内的块级元素
            clone.querySelectorAll('li div.paragraph, li p').forEach(p => {
                const span = document.createElement('span');
                span.innerHTML = p.innerHTML;
                p.parentNode.replaceChild(span, p);
            });
        }
    },
    doubao: {
        name: 'Doubao',
        match: () => window.location.hostname.includes('doubao.com'),
        getCopyButtons: () => document.querySelectorAll('button[data-testid="message_action_copy"]'),
        getActionBar: (btn) => btn.parentElement,
        hasInjected: (actionBar) => actionBar.querySelector('[data-test-id="doubao-to-obsidian-btn"]'),
        inject: (copyBtn, actionBar, saveHandler, downloadHandler) => {
            const createBtn = (originalBtn, title, svgPath, id) => {
                const btn = originalBtn.cloneNode(true);
                btn.removeAttribute('id');
                btn.setAttribute('data-test-id', id);
                btn.title = title;
                btn.setAttribute('aria-label', title);
                btn.style.marginLeft = '4px';

                const svg = btn.querySelector('svg');
                if (svg) {
                    svg.setAttribute('viewBox', '0 0 16 16');
                    svg.innerHTML = `<path d="${svgPath}" fill="currentColor"></path>`;
                }

                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (id === 'doubao-to-obsidian-btn') saveHandler(actionBar);
                    else downloadHandler(actionBar);
                };
                return btn;
            };

            const obSvgPath = "M2 2v12h10V2H2zm1 1h8v10H3V3zm1 2v1h6V5H4zm0 2v1h6V7H4zm0 2v1h4V9H4z";
            const dlSvgPath = "M8 12l-4-4h2.5V3h3v5H12L8 12zM3 13v2h10v-2H3z";

            const obBtn = createBtn(copyBtn, "Save to Obsidian", obSvgPath, 'doubao-to-obsidian-btn');
            const dlBtn = createBtn(copyBtn, "Download as Markdown", dlSvgPath, 'doubao-download-md-btn');

            copyBtn.insertAdjacentElement('afterend', dlBtn);
            copyBtn.insertAdjacentElement('afterend', obBtn);
        },
        getContentNode: (actionBar) => {
            let currentEl = actionBar;
            while (currentEl && currentEl !== document.body) {
                const parent = currentEl.parentElement;
                if (!parent) break;
                const contentNodes = Array.from(parent.querySelectorAll('[data-testid="message_text_content"]'));
                if (contentNodes.length > 0) {
                    return contentNodes[contentNodes.length - 1]; // 返回最近一级的文本内容节点
                }
                currentEl = parent;
            }
            return null;
        },
        cleanDOM: (clone) => {
            clone.querySelectorAll('.table-header-qH9Ajf').forEach(header => header.remove());
            clone.querySelectorAll('.header-wrapper-Mbk8s6').forEach(header => header.remove());
            clone.querySelectorAll('.md-box-line-break').forEach(br => br.remove());
            // 处理列表中内嵌的块级元素
            clone.querySelectorAll('li div.paragraph-element, li p').forEach(p => {
                const span = document.createElement('span');
                span.innerHTML = p.innerHTML;
                p.parentNode.replaceChild(span, p);
            });
        }
    },
    qianwen: {
        name: 'Qianwen',
        match: () => window.location.hostname.includes('qianwen.com') || window.location.hostname.includes('tongyi.aliyun.com'),
        getCopyButtons: () => Array.from(document.querySelectorAll('span[data-icon-type="qwpcicon-copy"]')),
        getActionBar: (span) => span.closest('div[class*="leftArea"]') || span.closest('.flex.gap-4') || span.parentElement.parentElement.parentElement,
        hasInjected: (actionBar) => actionBar.querySelector('[data-test-id="qianwen-to-obsidian-btn"]'),
        inject: (copyIconSpan, actionBar, saveHandler, downloadHandler) => {
            const obSvgPath = "M2 2v12h10V2H2zm1 1h8v10H3V3zm1 2v1h6V5H4zm0 2v1h6V7H4zm0 2v1h4V9H4z";
            const dlSvgPath = "M8 12l-4-4h2.5V3h3v5H12L8 12zM3 13v2h10v-2H3z";

            const createBtn = (title, svgPath, id) => {
                const div = document.createElement('div');
                const btn = document.createElement('button');
                btn.className = "relative inline-flex items-center justify-center gap-1 whitespace-nowrap align-middle font-normal transition-[opacity,shadow,transform] duration-200 focus-visible:outline-none ring-none hover:bg-tag py-1.5 text-14 cursor-pointer px-1 size-6 rounded-6 text-secondary";
                btn.setAttribute('data-test-id', id);
                btn.title = title;
                btn.setAttribute('aria-label', title);
                btn.type = 'button';

                btn.innerHTML = `<span data-role="icon" class="size-4" style="display: inline-flex; justify-content: center; align-items: center; text-align: center;"><svg viewBox="0 0 16 16" width="100%" height="100%" style="fill: currentcolor; overflow: hidden; cursor: pointer;"><path d="${svgPath}"></path></svg></span>`;

                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (id === 'qianwen-to-obsidian-btn') saveHandler(actionBar);
                    else downloadHandler(actionBar);
                };

                div.appendChild(btn);
                return div;
            };

            const obBtn = createBtn("Save to Obsidian", obSvgPath, 'qianwen-to-obsidian-btn');
            const dlBtn = createBtn("Download as Markdown", dlSvgPath, 'qianwen-download-md-btn');

            actionBar.appendChild(dlBtn);
            actionBar.appendChild(obBtn);
        },
        getContentNode: (actionBar) => {
            let currentEl = actionBar;
            while (currentEl && currentEl !== document.body) {
                const parent = currentEl.parentElement;
                if (!parent) break;
                const mdNodes = Array.from(parent.querySelectorAll('.tongyi-markdown'));
                if (mdNodes.length > 0) {
                    return mdNodes[mdNodes.length - 1];
                }
                currentEl = parent;
            }
            return null;
        },
        cleanDOM: (clone) => {
            // 移除代码行号
            clone.querySelectorAll('.react-syntax-highlighter-line-number').forEach(node => node.remove());

            const outerPres = clone.querySelectorAll('pre');
            outerPres.forEach(pre => {
                const codeNode = pre.querySelector('code');
                const headerSpan = pre.querySelector('div.bg-primary span');

                let lang = '';
                if (headerSpan && headerSpan.textContent) {
                    lang = headerSpan.textContent.trim().toLowerCase();
                } else {
                    const langMatch = pre.className.match(/language-(\S+)/) || (codeNode && codeNode.className.match(/language-(\S+)/));
                    if (langMatch) lang = langMatch[1];
                }

                if (codeNode) {
                    const cleanCode = document.createElement('code');
                    if (lang) {
                        cleanCode.className = `language-${lang}`;
                    }
                    cleanCode.textContent = codeNode.textContent;

                    pre.innerHTML = '';
                    pre.appendChild(cleanCode);
                }
            });

            // 处理列表中内嵌的段落
            clone.querySelectorAll('li p').forEach(p => {
                const span = document.createElement('span');
                span.innerHTML = p.innerHTML;
                p.parentNode.replaceChild(span, p);
            });
        }
    }
};

let currentPlatform = null;

function getCurrentPlatform() {
    if (currentPlatform) return currentPlatform;
    for (const key in PLATFORMS) {
        if (PLATFORMS[key].match()) {
            currentPlatform = PLATFORMS[key];
            return currentPlatform;
        }
    }
    return null;
}

function init() {
    const platform = getCurrentPlatform();
    if (!platform) return;

    let timeout = null;

    const observer = new MutationObserver(() => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            const copyButtons = platform.getCopyButtons();

            copyButtons.forEach(copyBtn => {
                const actionBar = platform.getActionBar(copyBtn);

                if (actionBar && !platform.hasInjected(actionBar)) {
                    platform.inject(copyBtn, actionBar, saveActionHandler, downloadActionHandler);
                }
            });
        }, 300);
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

function getMarkdownContent(actionBar) {
    const platform = getCurrentPlatform();
    if (!platform) return null;

    const contentEl = platform.getContentNode(actionBar);
    if (!contentEl) return null;

    const clone = contentEl.cloneNode(true);

    platform.cleanDOM(clone);

    let markdownContent = turndownService.turndown(clone.innerHTML);

    // 去除标题中不必要的 ** 符号（例如将 ### **标题** 转换为 ### 标题）
    markdownContent = markdownContent.replace(/^(#+)(.*)$/gm, (match, headingMarks, headingText) => {
        return headingMarks + headingText.replace(/\*\*/g, '');
    });

    // 修复列表项与代码块粘连的问题：强制代码块另起一行并消除代码块被列表错误附加的缩进
    markdownContent = markdownContent.replace(/([^\n]*?)[ \t]*```([^\s]*)\n([\s\S]*?)\n([ \t]*)```/g, (match, before, lang, code, indent) => {
        let cleanBefore = before.trimEnd();
        let prefix = cleanBefore ? cleanBefore + '\n\n' : '';

        let cleanCode = code;
        if (indent.length > 0) {
            const indentRegex = new RegExp('^' + indent, 'gm');
            cleanCode = cleanCode.replace(indentRegex, '');
        }

        return prefix + '```' + lang + '\n' + cleanCode + '\n```';
    });

    // 限制最大连续空行为两个换行符
    markdownContent = markdownContent.replace(/\n{3,}/g, '\n\n');

    // 压缩列表前以及列表项之间的空行，使其表现更紧凑（匹配 `- `, `* `, `+ `, `1. ` 等）
    markdownContent = markdownContent.replace(/\n{2,}([ \t]*[-*+]\s+)/g, '\n$1');
    markdownContent = markdownContent.replace(/\n{2,}([ \t]*\d+\.\s+)/g, '\n$1');

    return markdownContent;
}

function getFormattedFileName() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const platformName = getCurrentPlatform() ? getCurrentPlatform().name : 'AI';
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}-${platformName}对话记录`;
}

function saveActionHandler(actionBar) {
    const markdownContent = getMarkdownContent(actionBar);
    if (markdownContent) {
        saveToObsidian(markdownContent);
    } else {
        console.error("未能定位到对应的文本内容节点。");
    }
}

function downloadActionHandler(actionBar) {
    const markdownContent = getMarkdownContent(actionBar);
    if (markdownContent) {
        downloadMarkdown(markdownContent);
    } else {
        console.error("未能定位到对应的文本内容节点。");
    }
}

function saveToObsidian(content) {
    const fileName = getFormattedFileName();
    const encodedContent = encodeURIComponent(content);
    const url = `obsidian://new?vault=${VAULT_NAME}&name=${encodeURIComponent(fileName)}&content=${encodedContent}`;
    window.location.href = url;
}

function downloadMarkdown(content) {
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