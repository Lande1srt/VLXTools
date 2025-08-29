/**
 * 音频处理模块：负责音频加载、播放控制等功能
 */
const audioHandler = (() => {
    // 获取音频元素
    const audioElement = document.getElementById('audio-player');
    const previewAudioElement = document.getElementById('preview-audio-player');
    
    // 音频上传处理
    $('#audio-upload').on('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const audioUrl = URL.createObjectURL(file);
            audioElement.src = audioUrl;
            previewAudioElement.src = audioUrl;
            // 显示音频播放器（可选）
            audioElement.hidden = false;
        }
    });
    
    // 播放/暂停控制
    const togglePlayPause = () => {
        if (audioElement.paused) {
            audioElement.play();
            $('#play-pause i').removeClass('fa-play').addClass('fa-pause');
        } else {
            audioElement.pause();
            $('#play-pause i').removeClass('fa-pause').addClass('fa-play');
        }
    };
    
    // 时间调整（前进/后退2秒）
    const adjustTime = (seconds) => {
        audioElement.currentTime = Math.max(0, Math.min(audioElement.duration, audioElement.currentTime + seconds));
        previewAudioElement.currentTime = audioElement.currentTime;
    };
    
    // 绑定播放/暂停按钮事件
    $('#play-pause').on('click', togglePlayPause);
    
    // 绑定时间调整按钮事件
    $('#prev-5s').on('click', () => adjustTime(-2));
    $('#next-5s').on('click', () => adjustTime(2));
    
    // 实时更新当前时间显示
    audioElement.addEventListener('timeupdate', () => {
        $('#current-time').text(timeHandler.formatTime(audioElement.currentTime));
    });
    
    // 预览播放器控制同步
    previewAudioElement.addEventListener('play', () => {
        audioElement.currentTime = previewAudioElement.currentTime;
        audioElement.play();
        $('#play-pause i').removeClass('fa-play').addClass('fa-pause');
    });
    
    previewAudioElement.addEventListener('pause', () => {
        audioElement.pause();
        $('#play-pause i').removeClass('fa-pause').addClass('fa-play');
    });
    
    previewAudioElement.addEventListener('seeked', () => {
        audioElement.currentTime = previewAudioElement.currentTime;
    });
    
    return {
        getAudioElement: () => audioElement,
        getPreviewAudioElement: () => previewAudioElement,
        togglePlayPause,
        adjustTime,
        getCurrentTime: () => audioElement.currentTime,
        setCurrentTime: (time) => {
            audioElement.currentTime = time;
            previewAudioElement.currentTime = time;
        }
    };
})();