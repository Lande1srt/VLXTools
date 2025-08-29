/**
 * 歌词处理模块：负责歌词管理、解析、渲染等功能
 */
const lyricHandler = (() => {
    // 歌词数据数组
    let lyrics = [];
    // 当前处理的歌词索引
    let currentLyricIndex = -1;
    // 预览界面当前歌词索引
    let previewCurrentLyricIndex = -1;
    
    // 分割歌词（按空格、逗号、句号）
    const splitLyrics = () => {
        const text = $('#lyric-textarea').val().trim();
        if (!text) {
            alert('请输入歌词内容');
            return;
        }
        
        // 按标点和空格分割，但保留空行作为分隔符
        const lines = text.split(/[\n,，.。\s]+/).filter(line => line.trim() !== '');
        
        if (lines.length === 0) {
            alert('未检测到有效歌词内容');
            return;
        }
        
        // 重置歌词数据
        lyrics = lines.map(text => ({ text, time: null }));
        currentLyricIndex = 0;
        
        // 更新预览和上下文
        renderLyricPreview();
        uiController.updateLyricContext();
    };
    
    // 导入LRC文件
    const importLRC = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const lrcLines = content.split('\n');
            lyrics = [];
            
            // 解析LRC格式：[mm:ss.ms]歌词
            const lrcRegex = /\[(\d+):(\d+\.\d+)\](.*)/;
            
            lrcLines.forEach(line => {
                const match = line.match(lrcRegex);
                if (match) {
                    const minutes = parseInt(match[1]);
                    const seconds = parseFloat(match[2]);
                    const time = minutes * 60 + seconds;
                    const text = match[3].trim();
                    if (text) {
                        lyrics.push({ text, time });
                    }
                } else if (line.trim()) {
                    // 没有时间标签的歌词
                    lyrics.push({ text: line.trim(), time: null });
                }
            });
            
            // 按时间排序（有时间的在前，无时间的在后）
            lyrics.sort((a, b) => {
                if (a.time === null && b.time === null) return 0;
                if (a.time === null) return 1;
                if (b.time === null) return -1;
                return a.time - b.time;
            });
            
            currentLyricIndex = 0;
            renderLyricPreview();
            uiController.updateLyricContext();
        };
        reader.readAsText(file);
    };
    
    // 渲染编辑界面的歌词预览
    const renderLyricPreview = () => {
        const $preview = $('#lyric-preview');
        $preview.empty();
        
        if (lyrics.length === 0) {
            $preview.html('<div class="placeholder-text">请输入歌词并分割，或导入LRC文件</div>');
            return;
        }
        
        lyrics.forEach((lyric, index) => {
            const $line = $('<div class="lyric-line"></div>');
            $line.addClass(index === currentLyricIndex ? 'current' : '');
            
            let timeText = '未标记';
            if (lyric.time !== null) {
                timeText = timeHandler.formatTime(lyric.time);
            }
            
            $line.html(`<span class="lyric-time">[${timeText}]</span><span class="lyric-content">${lyric.text}</span>`);
            $preview.append($line);
        });
    };
    
    // 标记当前歌词时间
    const markCurrentLyricTime = () => {
        if (currentLyricIndex < 0 || currentLyricIndex >= lyrics.length) return;
        
        const currentTime = audioHandler.getCurrentTime();
        lyrics[currentLyricIndex].time = currentTime;
        
        // 自动跳到下一句
        if (currentLyricIndex < lyrics.length - 1) {
            currentLyricIndex++;
            uiController.updateLyricContext();
        }
        
        renderLyricPreview();
    };
    
    // 导航到上一句/下一句歌词
    const navigateLyric = (direction) => {
        if (lyrics.length === 0) return;
        
        const newIndex = currentLyricIndex + direction;
        if (newIndex >= 0 && newIndex < lyrics.length) {
            currentLyricIndex = newIndex;
            uiController.updateLyricContext();
            renderLyricPreview();
        }
    };
    
    // 添加空白歌词
    const addBlankLyric = () => {
        lyrics.splice(currentLyricIndex + 1, 0, { text: '[空白]', time: null });
        renderLyricPreview();
        uiController.updateLyricContext();
    };
    
    // 应用时间调整（整体偏移）
    const applyTimeAdjustment = (adjustment) => {
        if (isNaN(adjustment) || lyrics.length === 0) return;
        
        lyrics.forEach(lyric => {
            if (lyric.time !== null) {
                lyric.time = Math.max(0, lyric.time + adjustment);
            }
        });
        
        renderLyricPreview();
        renderPreviewLyrics(); // 同时更新预览界面
    };
    
    // 切换到预览界面
    const switchToPreviewInterface = () => {
        if (lyrics.length === 0 || !audioHandler.getAudioElement().src) {
            alert('请先上传音频并完成歌词时间标记');
            return;
        }
        
        $('#edit-interface').addClass('hidden');
        $('#preview-interface').removeClass('hidden');
        renderPreviewLyrics();
    };
    
    // 切换回编辑界面
    const switchToEditInterface = () => {
        $('#preview-interface').addClass('hidden');
        $('#edit-interface').removeClass('hidden');
        audioHandler.getPreviewAudioElement().pause();
    };
    
    // 渲染预览界面歌词
    const renderPreviewLyrics = () => {
        const $display = $('#sync-lyric-display');
        $display.empty();
        
        if (lyrics.length === 0) {
            $display.html('<div class="placeholder-text">无歌词数据</div>');
            return;
        }
        
        // 按时间排序歌词（确保顺序正确）
        const sortedLyrics = [...lyrics].filter(l => l.time !== null).sort((a, b) => a.time - b.time);
        
        sortedLyrics.forEach((lyric, index) => {
            const $line = $('<div class="sync-lyric-line"></div>');
            $line.data('time', lyric.time);
            $line.html(`<span class="sync-time">${timeHandler.formatTime(lyric.time)}</span><span class="sync-text">${lyric.text || '[空白]'}</span>`);
            $display.append($line);
        });
        
        // 绑定预览音频的时间更新事件
        audioHandler.getPreviewAudioElement().off('timeupdate').on('timeupdate', syncLyricWithAudio);
    };
    
    // 歌词与音频同步
    const syncLyricWithAudio = function() {
        const currentTime = this.currentTime;
        const $lines = $('.sync-lyric-line');
        if ($lines.length === 0) return;
        
        // 找到当前播放时间对应的歌词
        let targetIndex = -1;
        for (let i = 0; i < $lines.length; i++) {
            const lineTime = $lines.eq(i).data('time');
            if (lineTime <= currentTime) {
                targetIndex = i;
            } else {
                break;
            }
        }
        
        // 更新高亮和滚动
        if (targetIndex !== -1 && targetIndex !== previewCurrentLyricIndex) {
            $lines.removeClass('current');
            $lines.eq(targetIndex).addClass('current');
            previewCurrentLyricIndex = targetIndex;
            
            // 滚动到当前歌词（居中显示）
            const container = $('.sync-lyric-container')[0];
            const lineTop = $lines.eq(targetIndex).position().top;
            container.scrollTop = lineTop - container.clientHeight / 2;
        }
    };
    
    // 导出LRC文件
    const exportLRC = () => {
        if (lyrics.length === 0) return;
        
        let lrcContent = '';
        // 按时间排序歌词
        const sortedLyrics = [...lyrics].filter(l => l.time !== null && l.text.trim() !== '').sort((a, b) => a.time - b.time);
        
        sortedLyrics.forEach(lyric => {
            lrcContent += `[${timeHandler.formatTime(lyric.time).replace('.', ':')}]${lyric.text}\n`;
        });
        
        const blob = new Blob([lrcContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'lyrics.lrc';
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    };
    
    // 编辑歌词内容
    const editLyricsContent = () => {
        // 将歌词内容转换为文本
        const textContent = lyrics.map(lyric => lyric.text).join('\n');
        $('#edit-lyric-textarea').val(textContent);
        // 显示模态框
        $('.modal-overlay').addClass('active');
    };
    
    // 保存编辑后的歌词
    const saveEditedLyrics = () => {
        const text = $('#edit-lyric-textarea').val().trim();
        if (!text) {
            alert('歌词内容不能为空');
            return;
        }
        
        const lines = text.split('\n').map(line => line.trim()).filter(line => line !== '');
        // 更新歌词文本（保留时间信息）
        lines.forEach((text, index) => {
            if (index < lyrics.length) {
                lyrics[index].text = text;
            } else {
                lyrics.push({ text, time: null });
            }
        });
        
        // 如果新歌词数量少于原数量，删除多余的
        if (lines.length < lyrics.length) {
            lyrics.splice(lines.length);
        }
        
        // 更新界面
        renderLyricPreview();
        renderPreviewLyrics();
        uiController.updateLyricContext();
        // 关闭模态框
        $('.modal-overlay').removeClass('active');
    };
    
    // 绑定事件
    $('#split-lyric-btn').on('click', splitLyrics);
    $('#lrc-upload').on('change', function(e) {
        const file = e.target.files[0];
        if (file) importLRC(file);
    });
    $('#set-time').on('click', markCurrentLyricTime);
    $('#prev-lyric').on('click', () => navigateLyric(-1));
    $('#next-lyric').on('click', () => navigateLyric(1));
    $('#add-blank-btn').on('click', addBlankLyric);
    $('#apply-adjustment').on('click', () => {
        const adjustment = parseFloat($('#time-adjust').val());
        applyTimeAdjustment(adjustment);
    });
    $('#next-step-btn').on('click', switchToPreviewInterface);
    $('#back-to-edit').on('click', switchToEditInterface);
    $('#view-edit-lrc').on('click', () => {
        switchToEditInterface();
        editLyricsContent();
    });
    $('#export-lrc').on('click', exportLRC);
    $('#start-timing-btn').on('click', () => {
        if (lyrics.length > 0) {
            currentLyricIndex = 0;
            uiController.updateLyricContext();
            renderLyricPreview();
            audioHandler.togglePlayPause();
        } else {
            alert('请先分割歌词或导入LRC文件');
        }
    });
    $('#stop-btn').on('click', () => {
        audioHandler.getAudioElement().pause();
        $('#play-pause i').removeClass('fa-pause').addClass('fa-play');
    });
    $('#text-input-btn').on('click', function() {
        $(this).addClass('active');
        $('#lrc-upload-btn').removeClass('active');
        $('#text-input-container').removeClass('hidden');
        $('#lrc-upload-container').addClass('hidden');
    });
    $('#lrc-upload-btn').on('click', function() {
        $(this).addClass('active');
        $('#text-input-btn').removeClass('active');
        $('#lrc-upload-container').removeClass('hidden');
        $('#text-input-container').addClass('hidden');
    });
    $('#cancel-edit').on('click', () => $('.modal-overlay').removeClass('active'));
    $('#save-edit').on('click', saveEditedLyrics);
    
    return {
        getLyrics: () => [...lyrics],
        getCurrentLyricIndex: () => currentLyricIndex,
        getCurrentLyric: () => lyrics[currentLyricIndex],
        getPreviousLyric: () => currentLyricIndex > 0 ? lyrics[currentLyricIndex - 1] : null,
        getNextLyric: () => currentLyricIndex < lyrics.length - 1 ? lyrics[currentLyricIndex + 1] : null,
        renderLyricPreview
    };
})();