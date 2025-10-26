// 算法配置列表 - 所有算法将同时计算
            const algorithms = [
                { id: 'md5', name: 'MD5' },
                { id: 'sha1', name: 'SHA1' },
                { id: 'sha224', name: 'SHA224' },
                { id: 'sha256', name: 'SHA256' },
                { id: 'sha384', name: 'SHA384' },
                { id: 'sha512', name: 'SHA512' },
                { id: 'sha3', name: 'SHA3' },
                { id: 'ripemd160', name: 'RIPEMD160' }
            ];
            
            // DOM元素
            const inputText = document.getElementById('input-text');
            const compareHash = document.getElementById('compare-hash');
            const encoding = document.getElementById('encoding');
            const hashResults = document.getElementById('hash-results');
            const comparisonResult = document.getElementById('comparison-result');
            const textInputBtn = document.getElementById('text-input-btn');
            const fileInputBtn = document.getElementById('file-input-btn');
            const textInputArea = document.getElementById('text-input-area');
            const fileInputArea = document.getElementById('file-input-area');
            const fileDropArea = document.getElementById('file-drop-area');
            const fileInput = document.getElementById('file-input');
            const fileInfo = document.getElementById('file-info');
            const fileName = document.getElementById('file-name');
            const fileSize = document.getElementById('file-size');
            const fileProgress = document.getElementById('file-progress');
            const progressBar = document.getElementById('progress-bar');
            
            // 初始化结果区域
            function initResultArea() {
                hashResults.innerHTML = '';
                algorithms.forEach(alg => {
                    const resultItem = document.createElement('div');
                    resultItem.id = `result-${alg.id}`;
                    resultItem.className = 'neumorphic-inset rounded-xl p-4 hash-result-item';
                    resultItem.innerHTML = `
                        <div class="font-medium mb-2 flex justify-between">
                            <span>${alg.name}</span>
                            <span class="text-sm text-gray-500">点击复制</span>
                        </div>
                        <div class="algorithm-result font-mono break-all text-sm text-gray-500">等待输入...</div>
                    `;
                    hashResults.appendChild(resultItem);
                });
            }
            
            // 计算单个文本Hash值
            function calculateTextHash(text, algorithm) {
                if (!text) return '';
                
                let hash;
                switch (algorithm) {
                    case 'md5':
                        hash = CryptoJS.MD5(text);
                        break;
                    case 'sha1':
                        hash = CryptoJS.SHA1(text);
                        break;
                    case 'sha224':
                        hash = CryptoJS.SHA224(text);
                        break;
                    case 'sha256':
                        hash = CryptoJS.SHA256(text);
                        break;
                    case 'sha384':
                        hash = CryptoJS.SHA384(text);
                        break;
                    case 'sha512':
                        hash = CryptoJS.SHA512(text);
                        break;
                    case 'sha3':
                        hash = CryptoJS.SHA3(text);
                        break;
                    case 'ripemd160':
                        hash = CryptoJS.RIPEMD160(text);
                        break;
                    default:
                        hash = CryptoJS.MD5(text);
                }
                return hash;
            }
            
            // 计算文件Hash值
            function calculateFileHash(file) {
                // 显示进度
                fileProgress.classList.remove('hidden');
                progressBar.style.width = '0%';
                
                // 为每个算法创建哈希计算器
                const hashCalculators = {};
                algorithms.forEach(alg => {
                    switch (alg.id) {
                        case 'md5':
                            hashCalculators[alg.id] = CryptoJS.algo.MD5.create();
                            break;
                        case 'sha1':
                            hashCalculators[alg.id] = CryptoJS.algo.SHA1.create();
                            break;
                        case 'sha224':
                            hashCalculators[alg.id] = CryptoJS.algo.SHA224.create();
                            break;
                        case 'sha256':
                            hashCalculators[alg.id] = CryptoJS.algo.SHA256.create();
                            break;
                        case 'sha384':
                            hashCalculators[alg.id] = CryptoJS.algo.SHA384.create();
                            break;
                        case 'sha512':
                            hashCalculators[alg.id] = CryptoJS.algo.SHA512.create();
                            break;
                        case 'sha3':
                            hashCalculators[alg.id] = CryptoJS.algo.SHA3.create();
                            break;
                        case 'ripemd160':
                            hashCalculators[alg.id] = CryptoJS.algo.RIPEMD160.create();
                            break;
                    }
                });
                
                const reader = new FileReader();
                const chunkSize = 1024 * 1024; // 1MB块
                let offset = 0;
                
                reader.onload = function(e) {
                    if (e.target.error) {
                        console.error('文件读取错误:', e.target.error);
                        return;
                    }
                    
                    // 将二进制数据转换为WordArray
                    const wordArray = CryptoJS.lib.WordArray.create(e.target.result);
                    
                    // 更新所有哈希计算器
                    Object.values(hashCalculators).forEach(calculator => {
                        calculator.update(wordArray);
                    });
                    
                    offset += chunkSize;
                    
                    // 更新进度
                    const percent = Math.min((offset / file.size) * 100, 100);
                    progressBar.style.width = `${percent}%`;
                    
                    if (offset < file.size) {
                        readNextChunk();
                    } else {
                        // 完成计算，获取结果
                        const encodingType = encoding.value;
                        algorithms.forEach(alg => {
                            const hash = hashCalculators[alg.id].finalize();
                            const encodedHash = encodeHash(hash, encodingType);
                            
                            const resultEl = document.querySelector(`#result-${alg.id} .algorithm-result`);
                            resultEl.textContent = encodedHash;
                            resultEl.classList.remove('text-gray-500');
                        });
                        
                        // 如有对比值则自动对比
                        if (compareHash.value.trim()) {
                            compareHashes();
                        }
                    }
                };
                
                function readNextChunk() {
                    const fileSlice = file.slice(offset, offset + chunkSize);
                    reader.readAsArrayBuffer(fileSlice);
                }
                
                readNextChunk();
            }
            
            // 编码转换 (所有算法共用选定的编码)
            function encodeHash(hash, encodingType) {
                if (!hash) return '';
                
                switch (encodingType) {
                    case 'hex':
                        return hash.toString(CryptoJS.enc.Hex);
                    case 'base32':
                        return hash.toString(CryptoJS.enc.Base32);
                    case 'base64':
                        return hash.toString(CryptoJS.enc.Base64);
                    case 'base64url':
                        return hash.toString(CryptoJS.enc.Base64)
                            .replace(/\+/g, '-')
                            .replace(/\//g, '_')
                            .replace(/=+$/, '');
                    default:
                        return hash.toString(CryptoJS.enc.Hex);
                }
            }
            
            // 自动计算所有算法的哈希值（文本）
            function autoCalculateTextHashes() {
                const text = inputText.value.trim();
                const encodingType = encoding.value;
                
                // 清除匹配样式
                clearHashHighlights();
                
                if (!text) {
                    // 清空结果
                    algorithms.forEach(alg => {
                        const resultEl = document.querySelector(`#result-${alg.id} .algorithm-result`);
                        resultEl.textContent = '等待输入...';
                        resultEl.classList.add('text-gray-500');
                    });
                    return;
                }
                
                // 计算所有算法的哈希值（共用选定的编码）
                algorithms.forEach(alg => {
                    const hash = calculateTextHash(text, alg.id);
                    const encodedHash = encodeHash(hash, encodingType);
                    
                    const resultEl = document.querySelector(`#result-${alg.id} .algorithm-result`);
                    resultEl.textContent = encodedHash;
                    resultEl.classList.remove('text-gray-500');
                });
                
                // 如有对比值则自动对比
                if (compareHash.value.trim()) {
                    compareHashes();
                }
            }
            
            // 清除哈希高亮和对比结果
            function clearHashHighlights() {
                algorithms.forEach(alg => {
                    document.getElementById(`result-${alg.id}`).classList.remove('hash-match');
                });
                comparisonResult.classList.add('hidden');
            }
            
            // 对比哈希值（检查是否存在匹配的算法结果）
            function compareHashes() {
                const targetHash = compareHash.value.trim().toLowerCase();
                let matchCount = 0;
                
                if (!targetHash) {
                    clearHashHighlights();
                    return;
                }
                
                // 检查每个算法结果
                algorithms.forEach(alg => {
                    const resultEl = document.querySelector(`#result-${alg.id} .algorithm-result`);
                    const currentHash = resultEl.textContent.toLowerCase();
                    const resultItem = document.getElementById(`result-${alg.id}`);
                    
                    if (currentHash === targetHash && currentHash) {
                        resultItem.classList.add('hash-match');
                        matchCount++;
                    } else {
                        resultItem.classList.remove('hash-match');
                    }
                });
                
                // 显示对比结果
                comparisonResult.classList.remove('hidden');
                if (matchCount > 0) {
                    comparisonResult.innerHTML = `已找到 ${matchCount} 个匹配结果（已高亮显示）`;
                    comparisonResult.className = 'py-3 rounded-xl text-center font-medium bg-success/20 text-success';
                } else {
                    comparisonResult.textContent = '没有找到匹配的哈希值';
                    comparisonResult.className = 'py-3 rounded-xl text-center font-medium bg-danger/20 text-danger';
                }
            }
            
            // 切换输入模式
            function switchToTextInput() {
                textInputArea.classList.remove('hidden');
                fileInputArea.classList.add('hidden');
                textInputBtn.className = 'neumorphic-btn px-6 py-3 rounded-lg bg-primary/10 text-primary font-medium';
                fileInputBtn.className = 'neumorphic-btn px-6 py-3 rounded-lg bg-gray-100 font-medium';
                
                // 清除文件信息
                fileInput.value = '';
                fileInfo.classList.add('hidden');
                fileProgress.classList.add('hidden');
                progressBar.style.width = '0%';
                
                // 如果有文本则计算
                if (inputText.value.trim()) {
                    autoCalculateTextHashes();
                } else {
                    // 重置结果
                    algorithms.forEach(alg => {
                        const resultEl = document.querySelector(`#result-${alg.id} .algorithm-result`);
                        resultEl.textContent = '等待输入...';
                        resultEl.classList.add('text-gray-500');
                    });
                    clearHashHighlights();
                }
            }
            
            function switchToFileInput() {
                textInputArea.classList.add('hidden');
                fileInputArea.classList.remove('hidden');
                textInputBtn.className = 'neumorphic-btn px-6 py-3 rounded-lg bg-gray-100 font-medium';
                fileInputBtn.className = 'neumorphic-btn px-6 py-3 rounded-lg bg-primary/10 text-primary font-medium';
                
                // 清除文本输入
                inputText.value = '';
                
                // 重置结果
                algorithms.forEach(alg => {
                    const resultEl = document.querySelector(`#result-${alg.id} .algorithm-result`);
                    resultEl.textContent = '等待文件上传...';
                    resultEl.classList.add('text-gray-500');
                });
                clearHashHighlights();
            }
            
            // 处理文件选择
            function handleFileSelect(file) {
                if (!file) return;
                
                // 检查文件大小限制 (1GB)
                const maxFileSize = 1024 * 1024 * 1024; // 1GB
                if (file.size > maxFileSize) {
                    alert('文件大小超过限制（1GB），请选择较小的文件');
                    fileInput.value = '';
                    return;
                }
                
                // 显示文件信息
                fileName.textContent = file.name;
                fileSize.textContent = formatFileSize(file.size);
                fileInfo.classList.remove('hidden');
                fileProgress.classList.remove('hidden');
                progressBar.style.width = '0%';
                
                // 计算文件哈希
                calculateFileHash(file);
            }
            
            // 格式化文件大小
            function formatFileSize(bytes) {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            }
            
            // 清除缓存函数
            function clearCache() {
                // 清除文件输入
                fileInput.value = '';
                fileInfo.classList.add('hidden');
                fileProgress.classList.add('hidden');
                progressBar.style.width = '0%';
                
                // 清除文本输入
                inputText.value = '';
                
                // 重置结果
                algorithms.forEach(alg => {
                    const resultEl = document.querySelector(`#result-${alg.id} .algorithm-result`);
                    resultEl.textContent = '等待输入...';
                    resultEl.classList.add('text-gray-500');
                });
                
                // 清除对比结果
                compareHash.value = '';
                clearHashHighlights();
                
                // 释放内存
                if (window.gc) window.gc();
            }
            
            // 初始化页面
            function init() {
                initResultArea();
                
                // 添加页面刷新事件监听器，清除缓存
                window.addEventListener('beforeunload', clearCache);
                
                // 事件监听 - 文本输入
                inputText.addEventListener('input', autoCalculateTextHashes);
                
                // 事件监听 - 编码变更
                encoding.addEventListener('change', () => {
                    if (textInputArea.classList.contains('hidden')) {
                        // 文件模式，重新计算
                        if (fileInput.files.length > 0) {
                            handleFileSelect(fileInput.files[0]);
                        }
                    } else {
                        // 文本模式，重新计算
                        autoCalculateTextHashes();
                    }
                });
                
                // 事件监听 - 哈希对比
                compareHash.addEventListener('input', compareHashes);
                
                // 事件监听 - 输入模式切换
                textInputBtn.addEventListener('click', switchToTextInput);
                fileInputBtn.addEventListener('click', switchToFileInput);
                
                // 事件监听 - 文件上传
                fileDropArea.addEventListener('click', () => fileInput.click());
                fileInput.addEventListener('change', () => {
                    if (fileInput.files.length > 0) {
                        handleFileSelect(fileInput.files[0]);
                    }
                });
                
                // 文件拖放事件
                ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                    fileDropArea.addEventListener(eventName, preventDefaults, false);
                });
                
                function preventDefaults(e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                
                ['dragenter', 'dragover'].forEach(eventName => {
                    fileDropArea.addEventListener(eventName, highlight, false);
                });
                
                ['dragleave', 'drop'].forEach(eventName => {
                    fileDropArea.addEventListener(eventName, unhighlight, false);
                });
                
                function highlight() {
                    fileDropArea.classList.add('file-drop-active');
                }
                
                function unhighlight() {
                    fileDropArea.classList.remove('file-drop-active');
                }
                
                fileDropArea.addEventListener('drop', handleDrop, false);
                
                function handleDrop(e) {
                    const dt = e.dataTransfer;
                    const file = dt.files[0];
                    if (file) {
                        handleFileSelect(file);
                    }
                }
                
                // 点击复制功能
                hashResults.addEventListener('click', (e) => {
                    const resultItem = e.target.closest('.hash-result-item');
                    if (resultItem) {
                        const resultEl = resultItem.querySelector('.algorithm-result');
                        const hashText = resultEl.textContent;
                        
                        if (hashText && !hashText.includes('等待')) {
                            navigator.clipboard.writeText(hashText).then(() => {
                                // 复制反馈
                                const originalText = resultEl.textContent;
                                resultEl.textContent = '已复制!';
                                setTimeout(() => {
                                    resultEl.textContent = originalText;
                                }, 1500);
                            });
                        }
                    }
                });
            }
            
            // 初始化
            init();