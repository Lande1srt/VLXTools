/**
 * UI控制模块：负责界面元素更新、交互反馈等功能
 */
const uiController = (() => {
    // 更新歌词上下文显示（上一句、当前、下一句）
    const updateLyricContext = () => {
        const currentIndex = lyricHandler.getCurrentLyricIndex();
        const lyrics = lyricHandler.getLyrics();
        
        if (lyrics.length === 0) {
            $('#previous-lyric-text').text('无');
            $('#current-lyric-text').text('无');
            $('#next-lyric-text').text('无');
            return;
        }
        
        // 上一句
        const prevLyric = lyricHandler.getPreviousLyric();
        $('#previous-lyric-text').text(prevLyric ? prevLyric.text : '无');
        
        // 当前句
        const currentLyric = lyricHandler.getCurrentLyric();
        $('#current-lyric-text').text(currentLyric ? currentLyric.text : '无');
        
        // 下一句
        const nextLyric = lyricHandler.getNextLyric();
        $('#next-lyric-text').text(nextLyric ? nextLyric.text : '无');
    };
    
    // 初始化界面
    const init = () => {
        updateLyricContext();
        // 初始隐藏模态框
        $('.modal-overlay').removeClass('active');
    };
    
    return {
        updateLyricContext,
        init
    };
})();