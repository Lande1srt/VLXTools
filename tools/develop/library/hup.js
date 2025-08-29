        // 全局存储原始代码（用于复制/下载，避免转义影响使用）
        let originalCode = null;

        // 1. 元素获取
        const htmlInput = document.getElementById('html-input');
        const encodeModeSelect = document.getElementById('encode-mode');
        const generateBtn = document.getElementById('generate-btn');
        const copyBtn = document.getElementById('copy-btn');
        const downloadBtn = document.getElementById('download-btn');
        const clearBtn = document.getElementById('clear-btn');
        const outputCodeEl = document.getElementById('output-code');
        const refCodeEl = document.getElementById('ref-code');

        // 2. 工具函数：Base64 编码（支持中文）
        function base64Encode(str) {
            const utf8Bytes = new TextEncoder().encode(str);
            return btoa(String.fromCharCode(...utf8Bytes));
        }

        // 3. 核心逻辑：生成 JS 代码（自动转义特殊字符）
        function generateCode() {
            const inputText = htmlInput.value.trim();
            if (!inputText) return null;

            const encodeMode = encodeModeSelect.value;
            let encodeLogic = '';
            let decodeCode = '';
            let codeComment = '';
            switch (encodeMode) {
                case 'url-decode':
                    // 转义 " 为 \"，避免 JS 字符串提前结束
                    const urlEncoded = encodeURIComponent(inputText).replace(/"/g, '\\"');
                    codeComment = '// 编码方式：URL编码（decodeURIComponent）\n// 默认 document.write 渲染整个页面';
                    decodeCode = `const decodedHtml = decodeURIComponent("${urlEncoded}");`;
                    break;

                case 'unescape':
                    const unescapeEncoded = encodeURIComponent(inputText).replace(/"/g, '\\"');
                    codeComment = '// 【警告】unescape已废弃！不支持中文，仅兼容极旧场景\n// 默认 document.write 渲染整个页面';
                    decodeCode = `const decodedHtml = unescape("${unescapeEncoded}");`;
                    break;

                case 'base64':
                    const base64Encoded = base64Encode(inputText).replace(/"/g, '\\"');
                    codeComment = '// 编码方式：Base64（支持中文）\n// 默认 document.write 渲染整个页面';
                    encodeLogic = `// Base64 解码函数（含UTF-8处理，避免中文乱码）
function base64Decode(base64Str) {
    const binaryStr = atob(base64Str);
    const utf8Bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
        utf8Bytes[i] = binaryStr.charCodeAt(i);
    }
    return new TextDecoder().decode(utf8Bytes);
}`;
                    decodeCode = `const decodedHtml = base64Decode("${base64Encoded}");`;
                    break;
            }

            // 固定 document.write 渲染
            const renderCode = 'document.write(decodedHtml); // 渲染整个页面，覆盖当前文档流';

            // 组合原始代码（未转义 HTML 特殊字符，用于复制/下载）
            return `${codeComment}\n${encodeLogic ? encodeLogic + '\n' : ''}${decodeCode}\n${renderCode}`;
        }

        // 4. 生成代码 + 高亮 + 转义显示
        generateBtn.addEventListener('click', () => {
            originalCode = generateCode();
            if (!originalCode) {
                alert('请先输入需要转码的 HTML 内容！');
                outputCodeEl.innerHTML = '';
                copyBtn.disabled = true;
                downloadBtn.disabled = true;
                return;
            }

            // --------------- 关键：转义 HTML 特殊字符（避免 <script> 提前终止）---------------
            // 将 < 转成 &lt;，> 转成 &gt;，确保在页面中正常显示
            const displayCode = originalCode.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            
            // 插入代码并触发 highlight.js 高亮
            outputCodeEl.innerHTML = displayCode;
            hljs.highlightAll(); // 高亮 JavaScript 代码（githubdark 风格）

            // 启用按钮
            copyBtn.disabled = false;
            downloadBtn.disabled = false;
        });

        // 5. 复制原始代码（不包含 HTML 转义，确保可用）
        copyBtn.addEventListener('click', () => {
            if (!originalCode) return;

            navigator.clipboard.writeText(originalCode)
                .then(() => {
                    copyBtn.textContent = '复制成功！';
                    setTimeout(() => copyBtn.textContent = '2. 复制 JS 代码', 1500);
                })
                .catch(err => alert('复制失败：' + err));
        });

        // 6. 下载原始代码（hup.js）
        downloadBtn.addEventListener('click', () => {
            if (!originalCode) return;

            const blob = new Blob([originalCode], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.download = 'hup.js';
            a.href = url;
            a.click();
            URL.revokeObjectURL(url);

            downloadBtn.textContent = '下载成功！';
            setTimeout(() => downloadBtn.textContent = '3. 下载 hup.js', 1500);
        });

        // 7. 一键复制引用代码
        refCodeEl.addEventListener('click', () => {
            const refCode = '<script src="hup.js"></script>';
            navigator.clipboard.writeText(refCode)
                .then(() => {
                    const originalText = refCodeEl.innerHTML;
                    refCodeEl.innerHTML = '复制成功！';
                    refCodeEl.style.color = '#10b981';
                    setTimeout(() => {
                        refCodeEl.innerHTML = originalText;
                        refCodeEl.style.color = '#3b82f6';
                    }, 1500);
                })
                .catch(err => alert('引用代码复制失败：' + err));
        });

        // 8. 清空内容
        clearBtn.addEventListener('click', () => {
            htmlInput.value = '';
            outputCodeEl.innerHTML = '';
            originalCode = null;
            copyBtn.disabled = true;
            downloadBtn.disabled = true;
            encodeModeSelect.value = 'url-decode';
            copyBtn.textContent = '2. 复制 JS 代码';
            downloadBtn.textContent = '3. 下载 hup.js';
            refCodeEl.innerHTML = '&lt;script src="hup.js"&gt;&lt;/script&gt;';
            refCodeEl.style.color = '#3b82f6';
        });