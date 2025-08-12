// 常量定义
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024; // 10MB
const CHUNKED_PROCESS_THRESHOLD = 10 * 1024 * 1024; // 10MB以上即分片
const BASE64_CHUNK_SIZE = 512 * 1024; // 编码分片大小（字节）
const DECODE_CHUNK_SIZE = 512 * 1024; // 解码分片大小（字符）

// DOM元素引用
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

// 状态变量（移除哈希相关变量）
let currentMode = 'encode';
let currentTarget = 'string';
let selectedFile = null;
let decodingFile = null;
let processingAborted = false;
let chunkCache = new Map();
let decodedFileBuffer = null;
let decodeTotalChunks = 0;
let decodeCurrentChunk = 0;
let decodeTimeoutId = null; // 解码超时计时器

// 清理分片缓存
function clearChunkCache() {
  chunkCache.clear();
}

// 初始化检查
function initElementCheck() {
  if (!originalFilename) console.error('文件名输入框不存在（id="original-filename"）');
  if (!fileParams) console.error('文件名输入区域不存在（id="file-params"）');
  if (!decodeDownloadLink) console.error('解码下载按钮不存在（id="decode-download-link"）');
}

// 切换按钮状态
function toggleButtonGroup(activeBtn, inactiveBtn) {
  activeBtn.classList.add('neumorphic-btn', 'text-primary');
  activeBtn.classList.remove('text-gray-500');
  inactiveBtn.classList.remove('neumorphic-btn', 'text-primary');
  inactiveBtn.classList.add('text-gray-500');
}

// 显示错误信息
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

// 隐藏所有错误
function hideAllErrors() {
  inputError.style.display = 'none';
  fileError.style.display = 'none';
}

// 更新进度条
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

// 操作类型切换
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

// 处理对象切换
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
  updateCopyButtonState();
});

fileBtn.addEventListener('click', () => {
  currentTarget = 'file';
  toggleButtonGroup(fileBtn, stringBtn);
  hideAllErrors();
  updateUI();
});

// 文件选择与拖放
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

// 文件选择处理
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
    // 重置解码状态
    decodedFileBuffer = null;
    originalFilename.value = '';
    fileParams.classList.add('hidden');
    decodeDownloadLink.classList.add('hidden');
    decodeTotalChunks = 0;
    decodeCurrentChunk = 0;
    clearTimeout(decodeTimeoutId);
  }
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Base32编码
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

// Base32解码
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

// Base2编码
function arrayBufferToBase2(uint8Array) {
  const result = [];
  for (const byte of uint8Array) {
    result.push(byte.toString(2).padStart(8, '0'));
  }
  return result.join('');
}

// Base2解码
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

// Base64编码
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

// Base16编码
function arrayBufferToBase16(uint8Array) {
  const result = [];
  for (const byte of uint8Array) {
    result.push(byte.toString(16).padStart(2, '0'));
  }
  return result.join('').toUpperCase();
}

// Base16解码
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

// 编码文件（移除哈希处理）
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
    switch (format) {
      case 'base64':
        encodedContent = encodeBase64Safe(uint8Array);
        break;
      case 'base32':
        encodedContent = arrayBufferToBase32(uint8Array);
        break;
      case 'base16':
        encodedContent = arrayBufferToBase16(uint8Array);
        break;
      case 'base2':
        encodedContent = arrayBufferToBase2(uint8Array);
        break;
      default:
        throw new Error('不支持的编码格式');
    }

    updateProgress(90, '生成最终编码结果...');
    return encodedContent;
  } catch (error) {
    console.error('编码失败:', error);
    throw error;
  }
}

// 大文件分片编码（移除哈希处理）
async function encodeLargeFile(file, format) {
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
          let encodedChunk;

          switch (format) {
            case 'base64':
              encodedChunk = encodeBase64Safe(uint8Array);
              break;
            case 'base32':
              encodedChunk = arrayBufferToBase32(uint8Array);
              break;
            case 'base16':
              encodedChunk = arrayBufferToBase16(uint8Array);
              break;
            case 'base2':
              encodedChunk = arrayBufferToBase2(uint8Array);
              break;
            default:
              throw new Error('不支持的编码格式');
          }

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

// 合并分片
function mergeChunks(totalChunks) {
  const chunks = [];
  for (let i = 0; i < totalChunks; i++) {
    const chunk = chunkCache.get(i);
    if (chunk) chunks.push(chunk);
  }
  return chunks.join('');
}

// 分片解码（优化版）
async function decodeInChunks(encodedContent, format) {
  const totalLength = encodedContent.length;
  decodeTotalChunks = Math.ceil(totalLength / DECODE_CHUNK_SIZE);
  decodeCurrentChunk = 0;
  const decodedChunks = [];
  const chunkSizes = [];
  let lastProgressTime = Date.now();

  // 超时检查器：每30秒检查一次是否有进展
  const progressChecker = setInterval(() => {
    const now = Date.now();
    if (now - lastProgressTime > 30000) {
      processingAborted = true;
      throw new Error(`分片${decodeCurrentChunk + 1}处理超时（30秒无响应）`);
    }
  }, 30000);

  try {
    return await new Promise((resolve, reject) => {
      // 合并分片：分批合并，避免阻塞主线程
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

      // 处理下一个分片
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
          switch (format) {
            case 'base64':
              const padLength = (4 - (chunkContent.length % 4)) % 4;
              const paddedChunk = chunkContent + '='.repeat(padLength);
              chunkBuffer = new Uint8Array(atob(paddedChunk).split('').map(c => c.charCodeAt(0)));
              break;
            case 'base32':
              const base32PadLength = (8 - (chunkContent.length % 8)) % 8;
              const base32PaddedChunk = chunkContent.toUpperCase() + '='.repeat(base32PadLength);
              chunkBuffer = base32ToArrayBuffer(base32PaddedChunk);
              break;
            case 'base16':
              const evenChunk = chunkContent.length % 2 === 0 ? chunkContent : chunkContent.slice(0, -1);
              chunkBuffer = base16ToArrayBuffer(evenChunk);
              break;
            case 'base2':
              const base2PadLength = (8 - (chunkContent.length % 8)) % 8;
              const base2PaddedChunk = chunkContent + '0'.repeat(base2PadLength);
              chunkBuffer = base2ToArrayBuffer(base2PaddedChunk);
              break;
            default:
              throw new Error(`不支持的解码格式: ${format}`);
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

// 解码文件（移除哈希处理）
async function decodeFile(encodedStr, format) {
  const decodeStartTime = Date.now();

  try {
    updateProgress(20, '准备解码内容...');
    const maxDecodeTime = 15 * 60 * 1000; // 15分钟总超时
    const decodeTimeout = setTimeout(() => {
      processingAborted = true;
      throw new Error(`总解码超时（已超过15分钟）`);
    }, maxDecodeTime);

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

// 处理文件
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

      if (selectedFile.size > CHUNKED_PROCESS_THRESHOLD) {
        result = await encodeLargeFile(selectedFile, format);
      } else {
        result = await encodeFile(selectedFile);
      }

      const isLargeOrBase2 = selectedFile.size > LARGE_FILE_THRESHOLD || format === 'base2';
      outputText.value = isLargeOrBase2 ? '' : result;
      largeFileNote.classList.toggle('hidden', !isLargeOrBase2);

      if (encodeDownloadLink) {
        const blob = new Blob([result], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        encodeDownloadLink.href = url;
        encodeDownloadLink.download = `${fileName}.${format}.bin`;
        encodeDownloadLink.classList.remove('hidden');
        encodeDownloadLink.style.display = 'inline-block';
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
    // 解码逻辑
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
      
      // 读取编码文件
      updateProgress(5, '读取编码文件...');
      const encodedStr = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('编码文件读取失败：' + reader.error?.message));
        reader.readAsText(decodingFile);
      });

      // 执行解码
      const format = formatSelect.value;
      decodedFileBuffer = await decodeFile(encodedStr, format);

      // 显示文件名输入区域
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

// 编码小文件
function encodeSmallFile(file, format) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const uint8Array = new Uint8Array(e.target.result);
        let result;

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

// 解码为Uint8Array
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

// 编码字符串
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

// 解码字符串
function decodeString(str, format) {
  const uint8Array = decodeToUint8Array(str, format);
  const decoder = new TextDecoder();
  return decoder.decode(uint8Array);
}

// 更新UI
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

// 处理数据入口
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

// 处理字符串
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

// 按钮事件绑定
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
  updateCopyButtonState();
  updateProgress(0);
  clearTimeout(decodeTimeoutId);
  showStatusMessage('已清空内容', 'info');
});

clearCacheBtn.addEventListener('click', () => {
  clearChunkCache();
  showStatusMessage('临时缓存已清理', 'info');
});

abortBtn.addEventListener('click', () => {
  processingAborted = true;
  clearTimeout(decodeTimeoutId);
  decodedFileBuffer = null;
  showStatusMessage('处理已中止', 'error');
  updateProgress(0);
});

// 文件名输入控制下载按钮
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

// 页面卸载清理
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

// 初始化
window.addEventListener('load', () => {
  initElementCheck();
  updateCopyButtonState();
  updateUI();
});