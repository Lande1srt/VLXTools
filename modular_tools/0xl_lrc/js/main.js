/**
 * 主入口模块：初始化所有模块，协调各模块工作
 */
$(document).ready(() => {
    // 初始化UI
    uiController.init();
    
    // 初始化歌词预览
    lyricHandler.renderLyricPreview();
    
    // 绑定全局事件
    $(window).on('beforeunload', () => {
        return '您正在编辑歌词，确定要离开吗？';
    });
});