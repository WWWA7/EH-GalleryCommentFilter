// ==UserScript==
// @name         EH Gallery Comment Filter
// @namespace    https://github.com/WWWA7/EH-GalleryCommentFilter
// @version      1.0
// @description  Filters comments in E-Hentai galleries based on usernames and keywords
// @author       WWWA7
// @match        https://e-hentai.org/g/*
// @match        https://exhentai.org/g/*
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.registerMenuCommand
// @grant        GM.addStyle
// ==/UserScript==

(function() {
    'use strict';

    // 添加全局样式
    GM.addStyle(`
        .comment-filter-panel {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            z-index: 9999;
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            overflow: auto;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            border: 1px solid #dee2e6;
            box-sizing: border-box;
        }

        .comment-filter-panel h2 {
            margin-top: 0;
            color: #2c3e50;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
            font-size: 1.5em;
        }

        .filter-section {
            margin-bottom: 20px;
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
            box-sizing: border-box;
        }

        .filter-section label {
            display: flex;
            align-items: center;
            cursor: pointer;
            font-weight: 500;
            margin-bottom: 10px;
        }

        .filter-section input[type="checkbox"] {
            margin-right: 10px;
            width: 18px;
            height: 18px;
        }

        .filter-options {
            margin-left: 25px;
            margin-top: 10px;
            width: calc(100% - 25px);
            box-sizing: border-box;
        }

        .filter-options input[type="text"] {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ced4da;
            border-radius: 4px;
            font-size: 14px;
            transition: border-color 0.15s;
            box-sizing: border-box;
        }

        .filter-options input[type="text"]:focus {
            border-color: #80bdff;
            outline: 0;
            box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        }

        .filter-options div {
            margin-bottom: 5px;
            font-size: 14px;
            color: #6c757d;
        }

        .panel-footer {
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
            gap: 10px;
            flex-wrap: wrap;
        }

        .panel-footer button {
            padding: 8px 20px;
            border-radius: 4px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            box-sizing: border-box;
            white-space: nowrap;
        }

        #saveSettings {
            background-color: #28a745;
            color: white;
        }

        #saveSettings:hover {
            background-color: #218838;
        }

        #cancelSettings {
            background-color: #f8f9fa;
            color: #495057;
            border: 1px solid #ced4da;
        }

        #cancelSettings:hover {
            background-color: #e2e6ea;
        }

        /* 响应式调整 */
        @media (max-width: 480px) {
            .comment-filter-panel {
                padding: 15px;
                width: 95%;
            }

            .filter-section {
                padding: 12px;
            }

            .filter-options {
                margin-left: 15px;
                width: calc(100% - 15px);
            }

            .panel-footer {
                justify-content: center;
            }

            .panel-footer button {
                width: 100%;
            }
        }
    `);

    // 默认设置
    const defaultSettings = {
        commentatorFilterEnabled: false,
        commentatorFilterUsernames: [],
        commentFilterEnabled: false,
        commentFilterKeywords: []
    };

    let settings = {};

    // 初始化设置
    async function initSettings() {
        const savedSettings = await GM.getValue('commentFilterSettings');
        settings = {...defaultSettings, ...(savedSettings || {})};

        // 注册菜单命令
        GM.registerMenuCommand("评论过滤器设置", openSettingsPanel);
    }

    // 应用评论过滤器
    function applyCommentFilters() {
        const commentList = document.getElementById('cdiv');
        if (!commentList) return;

        if (settings.commentatorFilterEnabled) {
            filterCommentsByUsername(commentList);
        }

        if (settings.commentFilterEnabled) {
            filterCommentsByKeyword(commentList);
        }
    }

    // 按用户名过滤评论
    function filterCommentsByUsername(commentList) {
        const commentators = commentList.querySelectorAll('.c3 > a:first-of-type');
        for (const commentator of commentators) {
            if (settings.commentatorFilterUsernames.includes(commentator.textContent)) {
                commentList.removeChild(commentator.closest('.c1'));
            }
        }
    }

    // 按关键词过滤评论
    function filterCommentsByKeyword(commentList) {
        const comments = document.querySelectorAll('.c6');

        for (const comment of comments) {
            for (const keyword of settings.commentFilterKeywords) {
                if (comment.textContent.toLowerCase().includes(keyword.toLowerCase())) {
                    commentList.removeChild(comment.closest('.c1'));
                    break;
                }
            }
        }
    }

    // 打开设置面板
    function openSettingsPanel() {
        const panel = document.createElement('div');
        panel.className = 'comment-filter-panel';

        panel.innerHTML = `
            <h2>评论过滤器设置</h2>

            <div class="filter-section">
                <label>
                    <input type="checkbox" id="commentatorFilterEnabled" ${settings.commentatorFilterEnabled ? 'checked' : ''}>
                    启用用户名过滤
                </label>
                <div class="filter-options">
                    <div>屏蔽以下用户的评论(用英文逗号分隔):</div>
                    <input type="text" id="commentatorFilterUsernames"
                           value="${settings.commentatorFilterUsernames.join(', ')}" placeholder="例如: 用户1,用户2,用户3">
                </div>
            </div>

            <div class="filter-section">
                <label>
                    <input type="checkbox" id="commentFilterEnabled" ${settings.commentFilterEnabled ? 'checked' : ''}>
                    启用关键词过滤
                </label>
                <div class="filter-options">
                    <div>屏蔽包含以下关键词的评论(用英文逗号分隔):</div>
                    <input type="text" id="commentFilterKeywords"
                           value="${settings.commentFilterKeywords.join(', ')}" placeholder="例如: 广告,推广,垃圾">
                </div>
            </div>

            <div class="panel-footer">
                <button id="saveSettings">保存设置</button>
                <button id="cancelSettings">取消</button>
            </div>
        `;

        document.body.appendChild(panel);

        // 保存按钮事件
        panel.querySelector('#saveSettings').addEventListener('click', () => {
            settings.commentatorFilterEnabled = panel.querySelector('#commentatorFilterEnabled').checked;
            settings.commentatorFilterUsernames = panel.querySelector('#commentatorFilterUsernames').value
                .split(',')
                .map(name => name.trim())
                .filter(name => name.length > 0);

            settings.commentFilterEnabled = panel.querySelector('#commentFilterEnabled').checked;
            settings.commentFilterKeywords = panel.querySelector('#commentFilterKeywords').value
                .split(',')
                .map(keyword => keyword.trim().toLowerCase())
                .filter(keyword => keyword.length > 0);

            GM.setValue('commentFilterSettings', settings);
            document.body.removeChild(panel);
            applyCommentFilters(); // 重新应用过滤器
        });

        // 取消按钮事件
        panel.querySelector('#cancelSettings').addEventListener('click', () => {
            document.body.removeChild(panel);
        });
    }

    // 初始化并运行
    initSettings().then(() => {
        // 使用MutationObserver检测评论区域的变化
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length > 0) {
                    applyCommentFilters();
                }
            }
        });

        const commentContainer = document.getElementById('cdiv');
        if (commentContainer) {
            observer.observe(commentContainer, { childList: true, subtree: true });
            applyCommentFilters(); // 初始应用
        }
    });
})();