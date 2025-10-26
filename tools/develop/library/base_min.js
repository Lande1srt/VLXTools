// 常量定义（更新阈值）
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
const LARGE_FILE_THRESHOLD = 1 * 1024 * 1024; // 1MB（文本框显示阈值）
const CHUNKED_PROCESS_THRESHOLD = 10 * 1024 * 1024; // 10MB（大文件分片阈值）
const FORCE_BASE16_FOR_LARGE = 10 * 1024 * 1024; // 10MB（Base64仅支持小文件，超过强制用Base16）
const BASE64_CHUNK_SIZE = 512 * 1024; // 仅Base16大文件分片用
const DECODE_CHUNK_SIZE = 512 * 1024; // 解码分片大小（字符）

// DOM元素引用（保持不变）
const encodeBtn = document.getElementById('encode-btn');
const decodeBtn = document.getElementById('decode-btn');
const stringBtn = document.getElementById('string-btn');
const fileBtn = document.getElementById('file-btn');
const formatSelect = document.getElementById('format-select');
const stringInputArea = document.getElementById('string-input-area');
const fileInputArea = document.getElementById('file-input-area');
const decodeFileInputArea = document.getElementById('decode-file-input-area');
const decodeFileInput = document.getElementById('decode-file-input');
const decodeDropArea = document.getElementById('decode-drop-area');
const decodeFileInfo = document.getElementById('decode-file-info');
const inputText = document.getElementById('input-text');
const inputError = document.getElementById('input-error');
const fileError = document.getElementById('file-error');
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const fileInfo = document.getElementById('file-info');
const stringOutputArea = document.getElementById('string-output-area');
const fileOutputArea = document.getElementById('file-output-area');
const outputText = document.getElementById('output-text');
const outputFileName = document.getElementById('output-file-name');
const outputFileIcon = document.getElementById('output-file-icon');
const originalFilename = document.getElementById('original-filename');
const fileParams = document.getElementById('file-params');
const encodeDownloadLink = document.getElementById('encode-download-link');
const decodeDownloadLink = document.getElementById('decode-download-link');
const processBtn = document.getElementById('process-btn');
const copyBtn = document.getElementById('copy-btn');
const clearBtn = document.getElementById('clear-btn');
const statusMessage = document.getElementById('status-message');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const clearCacheBtn = document.getElementById('clear-cache-btn');
const largeFileNote = document.getElementById('large-file-note');
const abortBtn = document.getElementById('abort-btn');

// 状态变量
let currentMode = 'encode';
let currentTarget = 'string';
let selectedFile = null;
let decodingFile = null;
let processingAborted = false;
let chunkCache = new Map();
let decodedFileBuffer = null;
let decodeTotalChunks = 0;
let decodeCurrentChunk = 0;
let decodeTimeoutId = null;

// 清理分片缓存并重置状态
function clearChunkCache() {
  chunkCache.clear();
  selectedFile = null;
  decodingFile = null;
  decodedFileBuffer = null;
  fileInfo.classList.add('hidden');
  decodeFileInfo.classList.add('hidden');
  encodeDownloadLink.classList.add('hidden');
  decodeDownloadLink.classList.add('hidden');
  fileParams.classList.add('hidden');
  outputFileName.textContent = '处理后文件将显示在这里';
  originalFilename.value = '';
  largeFileNote.classList.add('hidden');
  formatSelect.value = 'base64';
  updateFormatOptionsByTarget(); // 根据当前模式更新格式选项
  inputText.value = '';
  outputText.value = '';
  hideAllErrors();
  updateCopyButtonState();
  updateProgress(0);
  clearTimeout(decodeTimeoutId);
  showStatusMessage('缓存已清理，状态已重置', 'info');
}

// 初始化检查（恢复所有格式，后续通过模式切换限制）
function initElementCheck() {
  if (!originalFilename) console.error('文件名输入框不存在（id="original-filename"）');
  if (!fileParams) console.error('文件名输入区域不存在（id="file-params"）');
  if (!decodeDownloadLink) console.error('解码下载按钮不存在（id="decode-download-link"）');
  // 初始化所有格式（字符串模式需要全部，文件模式后续过滤）
  while (formatSelect.options.length > 0) {
    formatSelect.remove(0);
  }
  formatSelect.add(new Option('Base64', 'base64'));
  formatSelect.add(new Option('Base32', 'base32'));
  formatSelect.add(new Option('Base16', 'base16'));
  formatSelect.add(new Option('二进制', 'base2'));
  formatSelect.value = 'base64';
}

// 根据当前处理目标（字符串/文件）更新格式选项
function updateFormatOptionsByTarget() {
  const originalValue = formatSelect.value;
  
  // 清空选择框
  while (formatSelect.options.length > 0) {
    formatSelect.remove(0);
  }
  
  if (currentTarget === 'file') {
    // 文件模式：仅保留Base64和Base16
    formatSelect.add(new Option('Base64', 'base64'));
    formatSelect.add(new Option('Base16', 'base16'));
    // 确保选中值有效
    formatSelect.value = ['base64', 'base16'].includes(originalValue) ? originalValue : 'base64';
  } else {
    // 字符串模式：显示所有格式
    formatSelect.add(new Option('Base64', 'base64'));
    formatSelect.add(new Option('Base32', 'base32'));
    formatSelect.add(new Option('Base16', 'base16'));
    formatSelect.add(new Option('二进制', 'base2'));
    formatSelect.value = originalValue || 'base64';
  }
}

// 切换按钮状态（保持不变）
function toggleButtonGroup(activeBtn, inactiveBtn) {
  activeBtn.classList.add('neumorphic-btn', 'text-primary');
  activeBtn.classList.remove('text-gray-500');
  inactiveBtn.classList.remove('neumorphic-btn', 'text-primary');
  inactiveBtn.classList.add('text-gray-500');
}

// 显示/隐藏错误（保持不变）
function showInputError(message) {
  hideAllErrors();
  if (currentTarget === 'string') {
    inputError.textContent = message;
    inputError.style.display = 'block';
  } else {
    fileError.textContent = message;
    fileError.style.display = 'block';
  }
  setTimeout(hideAllErrors, 5000);
}

function hideAllErrors() {
  inputError.style.display = 'none';
  fileError.style.display = 'none';
}

// 更新进度条（保持不变）
function updateProgress(percent, statusText) {
  clearTimeout(decodeTimeoutId);
  decodeTimeoutId = setTimeout(() => {
    if (percent < 100 && !processingAborted) {
      processingAborted = true;
      showInputError('解码超时，可能是文件损坏或格式错误');
      updateProgress(0);
    }
  }, 300000);

  progressBar.style.width = `${percent}%`;
  statusMessage.textContent = statusText || `处理中... ${Math.round(percent)}%`;
  statusMessage.classList.remove('hidden', 'bg-green-100', 'text-green-700', 'bg-red-100', 'text-red-700', 'bg-blue-100', 'text-blue-700');
  statusMessage.classList.add('bg-blue-100', 'text-blue-700');

  if (percent > 0 && percent < 100) {
    progressContainer.style.display = 'block';
  } else if (percent >= 100) {
    progressBar.style.width = '100%';
    clearTimeout(decodeTimeoutId);
    setTimeout(() => {
      progressContainer.style.display = 'none';
      progressBar.style.width = '0%';
    }, 500);
  }
}

// 操作类型切换（保持不变）
encodeBtn.addEventListener('click', () => {
  currentMode = 'encode';
  toggleButtonGroup(encodeBtn, decodeBtn);
  hideAllErrors();
  updateUI();
});

decodeBtn.addEventListener('click', () => {
  currentMode = 'decode';
  toggleButtonGroup(decodeBtn, encodeBtn);
  hideAllErrors();
  updateUI();
});

// 处理对象切换（核心：切换时更新格式选项）
stringBtn.addEventListener('click', () => {
  currentTarget = 'string';
  toggleButtonGroup(stringBtn, fileBtn);
  stringInputArea.classList.remove('hidden');
  fileInputArea.classList.add('hidden');
  decodeFileInputArea.classList.add('hidden');
  stringOutputArea.classList.remove('hidden');
  fileOutputArea.classList.add('hidden');
  fileParams.classList.add('hidden');
  decodeDownloadLink.classList.add('hidden');
  hideAllErrors();
  updateFormatOptionsByTarget(); // 字符串模式显示所有格式
  updateCopyButtonState();
});

fileBtn.addEventListener('click', () => {
  currentTarget = 'file';
  toggleButtonGroup(fileBtn, stringBtn);
  hideAllErrors();
  updateUI();
  updateFormatOptionsByTarget(); // 文件模式仅显示Base64/Base16
  // 检查已选文件，限制Base64仅支持小文件
  if (selectedFile) {
    checkFileSizeAndFormatRestriction();
  }
});

// 检查文件大小与格式限制（Base64仅支持小文件）
function checkFileSizeAndFormatRestriction() {
  const format = formatSelect.value;
  if (format === 'base64' && selectedFile.size > CHUNKED_PROCESS_THRESHOLD) {
    // Base64不支持大文件，自动切换到Base16
    formatSelect.value = 'base16';
    showStatusMessage('Base64仅支持10MB以下文件，已自动切换为Base16（支持大文件）', 'info');
  }
}

// 文件选择与拖放（新增格式限制检查）
fileInput.addEventListener('change', (e) => handleFileSelection(e.target.files[0]));
decodeFileInput.addEventListener('change', (e) => handleDecodingFileSelection(e.target.files[0]));

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, preventDefaults, false);
  decodeDropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
  dropArea.addEventListener(eventName, highlight, false);
  decodeDropArea.addEventListener(eventName, highlightDecodeArea, false);
});

['dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, unhighlight, false);
  decodeDropArea.addEventListener(eventName, unhighlightDecodeArea, false);
});

function highlight() {
  dropArea.classList.add('border-primary');
  dropArea.classList.add('bg-primary/5');
}

function unhighlight() {
  dropArea.classList.remove('border-primary');
  dropArea.classList.remove('bg-primary/5');
}

function highlightDecodeArea() {
  decodeDropArea.classList.add('border-primary');
  decodeDropArea.classList.add('bg-primary/5');
}

function unhighlightDecodeArea() {
  decodeDropArea.classList.remove('border-primary');
  decodeDropArea.classList.remove('bg-primary/5');
}

dropArea.addEventListener('drop', (e) => {
  const dt = e.dataTransfer;
  handleFileSelection(dt.files[0]);
});

decodeDropArea.addEventListener('drop', (e) => {
  const dt = e.dataTransfer;
  handleDecodingFileSelection(dt.files[0]);
});

// 文件选择处理（新增格式限制检查）
function handleFileSelection(file) {
  if (file) {
    if (file.size > MAX_FILE_SIZE) {
      showInputError(`文件过大（最大支持${formatFileSize(MAX_FILE_SIZE)}）`);
      return;
    }
    selectedFile = file;
    fileInfo.textContent = `已选择: ${file.name} (${formatFileSize(file.size)})`;
    fileInfo.classList.remove('hidden');
    showStatusMessage(`已选择文件: ${file.name}`, 'success');
    checkFileSizeAndFormatRestriction(); // 检查格式与大小限制
  }
}

function handleDecodingFileSelection(file) {
  if (file) {
    if (file.size > MAX_FILE_SIZE) {
      showInputError(`文件过大（最大支持${formatFileSize(MAX_FILE_SIZE)}）`);
      return;
    }
    decodingFile = file;
    decodeFileInfo.textContent = `已选择解码文件: ${file.name} (${formatFileSize(file.size)})`;
    decodeFileInfo.classList.remove('hidden');
    showStatusMessage(`已选择解码文件: ${file.name}`, 'success');
    decodedFileBuffer = null;
    originalFilename.value = '';
    fileParams.classList.add('hidden');
    decodeDownloadLink.classList.add('hidden');
    decodeTotalChunks = 0;
    decodeCurrentChunk = 0;
    clearTimeout(decodeTimeoutId);
  }
}

// 格式化文件大小（保持不变）
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Base32编码（仅字符串模式用）
function arrayBufferToBase32(uint8Array) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const result = [];
  let bits = 0;
  let value = 0;

  for (const byte of uint8Array) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result.push(chars[(value >>> (bits - 5)) & 0x1F]);
      bits -= 5;
    }
  }

  if (bits > 0) {
    value <<= (5 - bits);
    result.push(chars[value & 0x1F]);
  }

  const paddingNeeded = (8 - (result.length % 8)) % 8;
  for (let i = 0; i < paddingNeeded; i++) {
    result.push('=');
  }

  return result.join('');
}

// Base32解码（仅字符串模式用）
function base32ToArrayBuffer(base32Str) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleaned = base32Str.toUpperCase().replace(/=+$/, '');
  const bytes = [];
  let bits = 0;
  let value = 0;

  for (const char of cleaned) {
    const index = chars.indexOf(char);
    if (index === -1) throw new Error('无效的Base32字符');

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xFF);
      bits -= 8;
    }
  }

  return new Uint8Array(bytes);
}

// Base2编码（仅字符串模式用）
function arrayBufferToBase2(uint8Array) {
  const result = [];
  for (const byte of uint8Array) {
    result.push(byte.toString(2).padStart(8, '0'));
  }
  return result.join('');
}

// Base2解码（仅字符串模式用）
function base2ToArrayBuffer(base2Str) {
  if (base2Str.length % 8 !== 0) {
    throw new Error('二进制字符串长度必须是8的倍数');
  }

  const bytes = [];
  for (let i = 0; i < base2Str.length; i += 8) {
    const byteStr = base2Str.substr(i, 8);
    const byte = parseInt(byteStr, 2);
    if (isNaN(byte) || byte < 0 || byte > 255) {
      throw new Error(`无效的二进制字节: ${byteStr}`);
    }
    bytes.push(byte);
  }

  return new Uint8Array(bytes);
}

// Base64编码（仅小文件和字符串用）
function encodeBase64Safe(uint8Array) {
  const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = [];
  let chunkIndex = 0;

  while (chunkIndex < uint8Array.length) {
    const byte1 = uint8Array[chunkIndex++] || 0;
    const byte2 = chunkIndex < uint8Array.length ? uint8Array[chunkIndex++] : 0;
    const byte3 = chunkIndex < uint8Array.length ? uint8Array[chunkIndex++] : 0;

    const index1 = (byte1 >> 2) & 0x3F;
    const index2 = ((byte1 & 0x03) << 4) | ((byte2 >> 4) & 0x0F);
    const index3 = ((byte2 & 0x0F) << 2) | ((byte3 >> 6) & 0x03);
    const index4 = byte3 & 0x3F;

    if (chunkIndex > uint8Array.length) {
      result.push(base64Chars[index1], base64Chars[index2], base64Chars[index3], '=');
    } else if (chunkIndex > uint8Array.length + 1) {
      result.push(base64Chars[index1], base64Chars[index2], '=', '=');
    } else {
      result.push(base64Chars[index1], base64Chars[index2], base64Chars[index3], base64Chars[index4]);
    }

    if (result.length % 4000 === 0) {
      result = [result.join('')];
    }
  }

  return result.join('');
}

// Base16编码（支持大小文件）
function arrayBufferToBase16(uint8Array) {
  const result = [];
  for (const byte of uint8Array) {
    result.push(byte.toString(16).padStart(2, '0'));
  }
  return result.join('').toUpperCase();
}

// Base16解码（支持大小文件）
function base16ToArrayBuffer(base16Str) {
  if (base16Str.length % 2 !== 0) throw new Error('Base16长度必须为偶数');
  const bytes = [];
  for (let i = 0; i < base16Str.length; i += 2) {
    const byte = parseInt(base16Str.substr(i, 2), 16);
    if (isNaN(byte) || byte < 0 || byte > 255) {
      throw new Error(`无效的Base16字节: ${base16Str.substr(i, 2)}`);
    }
    bytes.push(byte);
  }
  return new Uint8Array(bytes);
}

// 编码文件（仅Base64/Base16，Base64限小文件）
async function encodeFile(file) {
  try {
    updateProgress(10, `读取文件: ${file.name}`);
    const arrayBuffer = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsArrayBuffer(file);
    });

    const format = formatSelect.value;
    const uint8Array = new Uint8Array(arrayBuffer);
    let encodedContent;

    updateProgress(50, `使用${getFormatDisplayName()}编码...`);
    // 仅保留Base64和Base16的文件编码逻辑
    switch (format) {
      case 'base64':
        encodedContent = encodeBase64Safe(uint8Array);
        break;
      case 'base16':
        encodedContent = arrayBufferToBase16(uint8Array);
        break;
      default:
        throw new Error('文件编码仅支持Base64和Base16');
    }

    updateProgress(90, '生成最终编码结果...');
    return encodedContent;
  } catch (error) {
    console.error('编码失败:', error);
    throw error;
  }
}

// 大文件分片编码（仅Base16，移除Base64处理）
async function encodeLargeFile(file) {
  const totalChunks = Math.ceil(file.size / BASE64_CHUNK_SIZE);
  const fileReader = new FileReader();
  let currentChunk = 0;
  clearChunkCache();

  return new Promise((resolve, reject) => {
    function processNextChunk() {
      if (processingAborted) {
        clearChunkCache();
        reject(new Error('操作已中止'));
        return;
      }

      if (currentChunk >= totalChunks) {
        updateProgress(80, '合并分片...');
        const rawEncoded = mergeChunks(totalChunks);
        clearChunkCache();
        updateProgress(90, '生成最终编码结果...');
        resolve(rawEncoded);
        return;
      }

      const progress = (currentChunk / totalChunks) * 70;
      updateProgress(10 + progress, `编码分片 ${currentChunk + 1}/${totalChunks}`);

      const start = currentChunk * BASE64_CHUNK_SIZE;
      const end = Math.min(start + BASE64_CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      fileReader.onload = function(e) {
        try {
          const uint8Array = new Uint8Array(e.target.result);
          // 仅Base16处理大文件
          const encodedChunk = arrayBufferToBase16(uint8Array);

          chunkCache.set(currentChunk, encodedChunk);
          currentChunk++;
          setTimeout(processNextChunk, 100);
        } catch (error) {
          clearChunkCache();
          reject(error);
        }
      };

      fileReader.onerror = () => {
        clearChunkCache();
        reject(fileReader.error);
      };

      fileReader.readAsArrayBuffer(chunk);
    }

    updateProgress(10, `准备编码大文件: ${file.name}`);
    processNextChunk();
  });
}

// 合并分片（仅Base16大文件用）
function mergeChunks(totalChunks) {
  const chunks = [];
  for (let i = 0; i < totalChunks; i++) {
    const chunk = chunkCache.get(i);
    if (chunk) chunks.push(chunk);
  }
  return chunks.join('');
}

// 分片解码（仅Base64/Base16，移除Base32/Base2）
async function decodeInChunks(encodedContent, format) {
  const totalLength = encodedContent.length;
  decodeTotalChunks = Math.ceil(totalLength / DECODE_CHUNK_SIZE);
  decodeCurrentChunk = 0;
  const decodedChunks = [];
  const chunkSizes = [];
  let lastProgressTime = Date.now();

  const progressChecker = setInterval(() => {
    const now = Date.now();
    if (now - lastProgressTime > 30000) {
      processingAborted = true;
      throw new Error(`分片${decodeCurrentChunk + 1}处理超时（30秒无响应）`);
    }
  }, 30000);

  try {
    return await new Promise((resolve, reject) => {
      function mergeChunks() {
        if (processingAborted) {
          reject(new Error('解码已中止'));
          return;
        }

        const totalSize = chunkSizes.reduce((sum, size) => sum + size, 0);
        const combinedArray = new Uint8Array(totalSize);
        let offset = 0;
        let batchStart = 0;
        const batchSize = 20;

        function mergeBatch() {
          if (batchStart >= decodedChunks.length) {
            clearInterval(progressChecker);
            updateProgress(95, '合并完成...');
            resolve(combinedArray.buffer);
            return;
          }

          const batchEnd = Math.min(batchStart + batchSize, decodedChunks.length);
          for (let i = batchStart; i < batchEnd; i++) {
            combinedArray.set(decodedChunks[i], offset);
            offset += chunkSizes[i];
          }

          const mergeProgress = (batchEnd / decodedChunks.length) * 10;
          updateProgress(80 + mergeProgress, `合并分片 ${batchEnd}/${decodedChunks.length}`);

          batchStart = batchEnd;
          setTimeout(mergeBatch, 10);
        }

        mergeBatch();
      }

      function processNextDecodeChunk() {
        if (processingAborted) {
          clearInterval(progressChecker);
          reject(new Error('解码已中止'));
          return;
        }

        if (decodeCurrentChunk >= decodeTotalChunks) {
          updateProgress(80, '开始合并解码结果...');
          mergeChunks();
          return;
        }

        const progress = (decodeCurrentChunk / decodeTotalChunks) * 70;
        updateProgress(20 + progress, `解码分片 ${decodeCurrentChunk + 1}/${decodeTotalChunks}`);
        lastProgressTime = Date.now();

        const start = decodeCurrentChunk * DECODE_CHUNK_SIZE;
        const end = Math.min(start + DECODE_CHUNK_SIZE, totalLength);
        const chunkContent = encodedContent.slice(start, end);

        try {
          let chunkBuffer;
          // 仅保留Base64和Base16的文件解码逻辑
          switch (format) {
            case 'base64':
              const padLength = (4 - (chunkContent.length % 4)) % 4;
              const paddedChunk = chunkContent + '='.repeat(padLength);
              chunkBuffer = new Uint8Array(atob(paddedChunk).split('').map(c => c.charCodeAt(0)));
              break;
            case 'base16':
              // 修复：移除分片截断逻辑（整体已确保合法）
              chunkBuffer = base16ToArrayBuffer(chunkContent);
              break;
            default:
              throw new Error(`文件解码仅支持Base64和Base16`);
          }

          decodedChunks.push(chunkBuffer);
          chunkSizes.push(chunkBuffer.length);
          decodeCurrentChunk++;
          setTimeout(processNextDecodeChunk, 10);
        } catch (error) {
          clearInterval(progressChecker);
          reject(new Error(`分片${decodeCurrentChunk + 1}解码失败: ${error.message}`));
        }
      }

      processNextDecodeChunk();
    });
  } catch (error) {
    clearInterval(progressChecker);
    throw error;
  }
}

// 解码文件（仅Base64/Base16，新增Base16非法字符过滤）
async function decodeFile(encodedStr, format) {
  const decodeStartTime = Date.now();

  try {
    updateProgress(20, '准备解码内容...');
    const maxDecodeTime = 15 * 60 * 1000;
    const decodeTimeout = setTimeout(() => {
      processingAborted = true;
      throw new Error(`总解码超时（已超过15分钟）`);
    }, maxDecodeTime);

    // 新增：Base16解码前过滤非法字符并修正长度
    if (format === 'base16') {
      // 保留所有十六进制字符（大小写兼容）
      encodedStr = encodedStr.replace(/[^0-9A-Fa-f]/g, '');
      // 确保总长度为偶数（Base16要求）
      if (encodedStr.length % 2 !== 0) {
        encodedStr = encodedStr.slice(0, -1); // 移除最后一个字符
        showStatusMessage('Base16字符串长度为奇数，已自动修正', 'info');
      }
    }

    let decodedBuffer;
    try {
      decodedBuffer = await decodeInChunks(encodedStr, format);
      clearTimeout(decodeTimeout);
    } catch (error) {
      clearTimeout(decodeTimeout);
      throw error;
    }

    const totalTime = Math.round((Date.now() - decodeStartTime) / 1000);
    updateProgress(100, `解码完成（耗时${totalTime}秒）`);
    return decodedBuffer;
  } catch (error) {
    updateProgress(0, `解码失败: ${error.message}`);
    console.error('解码错误:', error);
    throw new Error(`解码失败: ${error.message}`);
  }
}

// 处理文件（核心：Base64仅小文件，Base16支持大小文件）
async function processFile() {
  if (currentMode === 'encode') {
    if (!selectedFile) {
      showInputError('请选择文件');
      return;
    }

    try {
      let result;
      const format = formatSelect.value;
      const fileName = selectedFile.name;

      // Base64仅支持小文件（≤10MB），Base16支持所有大小
      if (format === 'base64') {
        if (selectedFile.size > CHUNKED_PROCESS_THRESHOLD) {
          throw new Error('Base64仅支持10MB以下文件，请选择Base16编码大文件');
        }
        result = await encodeFile(selectedFile); // 小文件直接编码
      } else if (format === 'base16') {
        if (selectedFile.size > CHUNKED_PROCESS_THRESHOLD) {
          result = await encodeLargeFile(selectedFile); // 大文件分片编码
        } else {
          result = await encodeFile(selectedFile); // 小文件直接编码
        }
      } else {
        throw new Error('文件编码仅支持Base64和Base16');
      }

      // 文本框仅显示≤1MB的结果
      const resultSize = new TextEncoder().encode(result).length;
      const isLargeResult = resultSize > LARGE_FILE_THRESHOLD;
      outputText.value = isLargeResult ? '' : result;
      largeFileNote.classList.toggle('hidden', !isLargeResult);
      if (isLargeResult) {
        largeFileNote.textContent = '编码结果超过1MB，已自动隐藏，仅提供下载';
      }

      if (encodeDownloadLink) {
        const blob = new Blob([result], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        encodeDownloadLink.href = url;
        encodeDownloadLink.download = `${fileName}.${format}.bin`;
        encodeDownloadLink.classList.remove('hidden');
        showStatusMessage(`编码成功，可下载文件`, 'success');
      }

      updateCopyButtonState();
    } catch (error) {
      showInputError(`编码失败: ${error.message}`);
      console.error(error);
      updateProgress(0);
    } finally {
      setTimeout(() => updateProgress(100), 500);
    }
  } else {
    // 解码逻辑（仅Base64/Base16）
    if (!decodingFile) {
      showInputError('请选择要解码的文件');
      return;
    }

    processingAborted = false;
    decodedFileBuffer = null;
    decodeTotalChunks = 0;
    decodeCurrentChunk = 0;
    clearTimeout(decodeTimeoutId);

    try {
      updateProgress(0, '准备解码...');
      const encodedStr = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('编码文件读取失败：' + reader.error?.message));
        reader.readAsText(decodingFile);
      });

      const format = formatSelect.value;
      if (!['base64', 'base16'].includes(format)) {
        throw new Error('文件解码仅支持Base64和Base16');
      }
      decodedFileBuffer = await decodeFile(encodedStr, format);

      if (fileParams) fileParams.classList.remove('hidden');
      originalFilename.value = '';
      decodeDownloadLink.classList.add('hidden');
      outputFileName.textContent = '请输入原始文件名以下载';
      outputFileIcon.className = 'fa fa-file-text-o text-4xl text-primary mb-3';
      showStatusMessage('解码成功，请输入原始文件名', 'success');
    } catch (error) {
      showInputError(`解码失败: ${error.message}`);
      fileParams.classList.add('hidden');
      decodeDownloadLink.classList.add('hidden');
      decodedFileBuffer = null;
      updateProgress(0);
    }
  }
}

// 编码小文件（字符串模式支持所有格式）
function encodeSmallFile(file, format) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const uint8Array = new Uint8Array(e.target.result);
        let result;

        // 字符串模式支持所有格式
        switch (format) {
          case 'base64':
            result = encodeBase64Safe(uint8Array);
            break;
          case 'base32':
            result = arrayBufferToBase32(uint8Array);
            break;
          case 'base16':
            result = arrayBufferToBase16(uint8Array);
            break;
          case 'base2':
            result = arrayBufferToBase2(uint8Array);
            break;
          default:
            throw new Error('不支持的编码格式');
        }
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

// 解码为Uint8Array（字符串模式支持所有格式）
function decodeToUint8Array(str, format) {
  switch (format) {
    case 'base64':
      return new Uint8Array(atob(str).split('').map(c => c.charCodeAt(0)));
    case 'base32':
      return base32ToArrayBuffer(str);
    case 'base16':
      return base16ToArrayBuffer(str);
    case 'base2':
      return base2ToArrayBuffer(str);
    default:
      throw new Error('不支持的解码格式');
  }
}

// 编码字符串（支持所有格式）
function encodeString(str, format) {
  const encoder = new TextEncoder();
  const uint8Array = encoder.encode(str);
  
  switch (format) {
    case 'base64':
      return encodeBase64Safe(uint8Array);
    case 'base32':
      return arrayBufferToBase32(uint8Array);
    case 'base16':
      return arrayBufferToBase16(uint8Array);
    case 'base2':
      return arrayBufferToBase2(uint8Array);
    default:
      throw new Error('不支持的编码格式');
  }
}

// 解码字符串（支持所有格式）
function decodeString(str, format) {
  const uint8Array = decodeToUint8Array(str, format);
  const decoder = new TextDecoder();
  return decoder.decode(uint8Array);
}

// 更新UI（保持不变）
function updateUI() {
  if (currentTarget === 'file') {
    if (currentMode === 'encode') {
      stringInputArea.classList.add('hidden');
      fileInputArea.classList.remove('hidden');
      decodeFileInputArea.classList.add('hidden');
      stringOutputArea.classList.remove('hidden');
      fileOutputArea.classList.add('hidden');
      encodeDownloadLink.classList.add('hidden');
    } else {
      stringInputArea.classList.add('hidden');
      fileInputArea.classList.add('hidden');
      decodeFileInputArea.classList.remove('hidden');
      stringOutputArea.classList.add('hidden');
      fileOutputArea.classList.remove('hidden');
      fileParams.classList.add('hidden');
      decodeDownloadLink.classList.add('hidden');
    }
  } else {
    inputText.placeholder = currentMode === 'encode'
      ? `请输入要编码为${getFormatDisplayName()}的字符串...`
      : `请输入要解码的${getFormatDisplayName()}字符串...`;
  }
}

function getFormatDisplayName() {
  const format = formatSelect.value;
  const names = { 'base64': 'Base64', 'base32': 'Base32', 'base16': 'Base16', 'base2': '二进制' };
  return names[format] || format;
}

// 处理数据入口（保持不变）
async function processData() {
  hideAllErrors();
  processingAborted = false;
  
  if (currentTarget === 'string') {
    processString();
  } else {
    try {
      await processFile();
    } catch (error) {
      showInputError(`处理失败: ${error.message}`);
      updateProgress(0);
    }
  }
}

// 处理字符串（支持所有格式）
function processString() {
  const input = inputText.value.trim();
  if (!input) {
    showInputError('请输入内容');
    return;
  }
  
  try {
    let result;
    const format = formatSelect.value;
    
    if (currentMode === 'encode') {
      updateProgress(30, `编码为${getFormatDisplayName()}...`);
      result = encodeString(input, format);
      outputText.value = result;
      updateCopyButtonState();
      updateProgress(100);
      showStatusMessage('字符串编码成功', 'success');
    } else {
      updateProgress(30, `解码${getFormatDisplayName()}...`);
      result = decodeString(input, format);
      outputText.value = result;
      updateCopyButtonState();
      updateProgress(100);
      showStatusMessage('字符串解码成功', 'success');
    }
  } catch (error) {
    showInputError(`处理失败: ${error.message}`);
    updateProgress(0);
  }
}

// 按钮事件绑定（保持不变）
processBtn.addEventListener('click', processData);

copyBtn.addEventListener('click', () => {
  if (outputText.value) {
    outputText.select();
    document.execCommand('copy');
    showStatusMessage('已复制到剪贴板', 'success');
  }
});

clearBtn.addEventListener('click', () => {
  inputText.value = '';
  outputText.value = '';
  selectedFile = null;
  decodingFile = null;
  decodedFileBuffer = null;
  fileInfo.classList.add('hidden');
  decodeFileInfo.classList.add('hidden');
  encodeDownloadLink.classList.add('hidden');
  decodeDownloadLink.classList.add('hidden');
  fileParams.classList.add('hidden');
  outputFileName.textContent = '处理后文件将显示在这里';
  originalFilename.value = '';
  largeFileNote.classList.add('hidden');
  hideAllErrors();
  formatSelect.value = 'base64';
  updateFormatOptionsByTarget();
  updateCopyButtonState();
  updateProgress(0);
  clearTimeout(decodeTimeoutId);
  showStatusMessage('已清空内容', 'info');
});

clearCacheBtn.addEventListener('click', clearChunkCache);

abortBtn.addEventListener('click', () => {
  processingAborted = true;
  clearTimeout(decodeTimeoutId);
  decodedFileBuffer = null;
  showStatusMessage('处理已中止', 'error');
  updateProgress(0);
});

originalFilename.addEventListener('input', () => {
  if (decodedFileBuffer && originalFilename.value.trim()) {
    const blob = new Blob([decodedFileBuffer]);
    const url = URL.createObjectURL(blob);
    decodeDownloadLink.href = url;
    decodeDownloadLink.download = originalFilename.value.trim();
    decodeDownloadLink.classList.remove('hidden');
  } else {
    decodeDownloadLink.classList.add('hidden');
  }
});

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}

function updateCopyButtonState() {
  if (outputText.value) {
    copyBtn.disabled = false;
    copyBtn.classList.add('text-primary');
  } else {
    copyBtn.disabled = true;
    copyBtn.classList.remove('text-primary');
  }
}

function showStatusMessage(text, type = 'info') {
  statusMessage.textContent = text;
  statusMessage.classList.remove('hidden', 'bg-green-100', 'text-green-700', 'bg-red-100', 'text-red-700', 'bg-blue-100', 'text-blue-700');
  
  switch (type) {
    case 'success':
      statusMessage.classList.add('bg-green-100', 'text-green-700');
      break;
    case 'error':
      statusMessage.classList.add('bg-red-100', 'text-red-700');
      break;
    default:
      statusMessage.classList.add('bg-blue-100', 'text-blue-700');
  }
  
  clearTimeout(window.statusTimeout);
  window.statusTimeout = setTimeout(() => {
    if (!progressContainer.classList.contains('hidden')) return;
    statusMessage.classList.add('hidden');
  }, 3000);
}

// 页面卸载清理（保持不变）
window.addEventListener('beforeunload', () => {
  clearChunkCache();
  clearTimeout(decodeTimeoutId);
  if (encodeDownloadLink && encodeDownloadLink.href.startsWith('blob:')) {
    URL.revokeObjectURL(encodeDownloadLink.href);
  }
  if (decodeDownloadLink && decodeDownloadLink.href.startsWith('blob:')) {
    URL.revokeObjectURL(decodeDownloadLink.href);
  }
});

// 初始化（保持不变）
window.addEventListener('load', () => {
  initElementCheck();
  updateCopyButtonState();
  updateUI();
});

// 格式选择框变化时更新UI
formatSelect.addEventListener('change', () => {
  updateUI();
  // 更新输入框提示文本
  if (currentTarget === 'string') {
    inputText.placeholder = currentMode === 'encode'
      ? `请输入要编码为${getFormatDisplayName()}的字符串...`
      : `请输入要解码的${getFormatDisplayName()}字符串...`;
  }
});