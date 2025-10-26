/**
 * MIME类型与扩展名映射工具库
 */

// 完整标准MIME类型与扩展名映射表
const mimeMap = {
    // 文本类型
    "text/plain": [".txt", ".text", ".log"],
    "text/html": [".html", ".htm", ".shtml"],
    "text/css": [".css"],
    "text/javascript": [".js"],
    "text/csv": [".csv"],
    "text/xml": [".xml"],
    "text/markdown": [".md", ".markdown"],
    "text/rtf": [".rtf"],
    "text/yaml": [".yaml", ".yml"],
    "text/tab-separated-values": [".tsv"],
    "text/calendar": [".ics", ".ical"],
    "text/vcard": [".vcf", ".vcard"],
    "text/x-java-source": [".java"],
    "text/x-c": [".c", ".h"],
    "text/x-c++": [".cpp", ".hpp", ".cc", ".hh"],
    "text/x-csharp": [".cs"],
    "text/x-python": [".py"],
    
    // 图像类型
    "image/jpeg": [".jpg", ".jpeg", ".jpe", ".jif", ".jfif"],
    "image/png": [".png"],
    "image/gif": [".gif"],
    "image/bmp": [".bmp"],
    "image/webp": [".webp"],
    "image/svg+xml": [".svg", ".svgz"],
    "image/tiff": [".tiff", ".tif"],
    "image/vnd.microsoft.icon": [".ico"],
    "image/heic": [".heic"],
    "image/heif": [".heif"],
    "image/avif": [".avif"],
    "image/x-icon": [".ico"],
    "image/x-xcf": [".xcf"],
    "image/x-adobe-dng": [".dng"],
    "image/x-canon-cr2": [".cr2"],
    "image/x-nikon-nef": [".nef"],
    "image/x-sony-arw": [".arw"],
    "image/x-photoshop": [".psd"],
    
    // 音频类型
    "audio/mpeg": [".mp3", ".mpga"],
    "audio/wav": [".wav"],
    "audio/ogg": [".ogg", ".oga"],
    "audio/flac": [".flac"],
    "audio/aac": [".aac"],
    "audio/midi": [".midi", ".mid"],
    "audio/webm": [".weba"],
    "audio/mp4": [".m4a", ".mp4a"],
    "audio/x-ms-wma": [".wma"],
    "audio/opus": [".opus"],
    "audio/amr": [".amr"],
    "audio/x-aiff": [".aif", ".aiff", ".aifc"],
    "audio/basic": [".au", ".snd"],
    
    // 视频类型
    "video/mp4": [".mp4", ".m4v", ".mp4v"],
    "video/mpeg": [".mpeg", ".mpg", ".mpe"],
    "video/quicktime": [".mov", ".qt"],
    "video/x-msvideo": [".avi"],
    "video/x-ms-wmv": [".wmv"],
    "video/ogg": [".ogv"],
    "video/webm": [".webm"],
    "video/3gpp": [".3gp", ".3gpp"],
    "video/3gpp2": [".3g2", ".3gp2"],
    "video/x-flv": [".flv"],
    "video/x-matroska": [".mkv"],
    "video/x-m4v": [".m4v"],
    "video/mp2t": [".ts"],
    "video/x-ms-asf": [".asf", ".asx"],
    
    // 文档类型
    "application/pdf": [".pdf"],
    "application/msword": [".doc", ".dot"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.template": [".dotx"],
    "application/vnd.ms-excel": [".xls", ".xlt", ".xla"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.template": [".xltx"],
    "application/vnd.ms-powerpoint": [".ppt", ".pot", ".pps", ".ppa"],
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
    "application/vnd.openxmlformats-officedocument.presentationml.template": [".potx"],
    "application/vnd.openxmlformats-officedocument.presentationml.slideshow": [".ppsx"],
    "application/vnd.oasis.opendocument.text": [".odt"],
    "application/vnd.oasis.opendocument.spreadsheet": [".ods"],
    "application/vnd.oasis.opendocument.presentation": [".odp"],
    "application/vnd.oasis.opendocument.graphics": [".odg"],
    "application/vnd.oasis.opendocument.chart": [".odc"],
    "application/vnd.oasis.opendocument.formula": [".odf"],
    "application/vnd.oasis.opendocument.database": [".odb"],
    "application/vnd.oasis.opendocument.image": [".odi"],
    "application/vnd.visio": [".vsd", ".vst", ".vsw", ".vss"],
    "application/vnd.ms-visio.drawing": [".vsdx"],
    "application/rtf": [".rtf"],
    "application/epub+zip": [".epub"],
    
    // 压缩文件类型
    "application/zip": [".zip"],
    "application/x-rar-compressed": [".rar"],
    "application/x-7z-compressed": [".7z"],
    "application/gzip": [".gz", ".gzip"],
    "application/x-tar": [".tar"],
    "application/x-bzip": [".bz"],
    "application/x-bzip2": [".bz2"],
    "application/x-xz": [".xz"],
    "application/x-lzip": [".lz"],
    "application/x-lzma": [".lzma"],
    "application/x-lzop": [".lzo"],
    "application/x-compress": [".Z"],
    "application/x-compressed-tar": [".tgz", ".tar.gz"],
    "application/x-bzip-compressed-tar": [".tar.bz2", ".tbz2"],
    "application/x-xz-compressed-tar": [".tar.xz", ".txz"],
    
    // 开发相关类型
    "application/json": [".json"],
    "application/json5": [".json5"],
    "application/javascript": [".js"],
    "application/typescript": [".ts"],
    "application/wasm": [".wasm"],
    "application/x-httpd-php": [".php", ".phtml", ".php3", ".php4", ".php5", ".phps"],
    "application/java-archive": [".jar", ".war", ".ear"],
    "application/x-sh": [".sh"],
    "application/x-csh": [".csh"],
    "application/x-python": [".py", ".pyc", ".pyo", ".pyw"],
    "application/x-perl": [".pl", ".pm", ".t"],
    "application/x-ruby": [".rb", ".erb"],
    "application/x-go": [".go"],
    "application/x-kotlin": [".kt", ".kts"],
    "application/x-swift": [".swift"],
    "application/x-rust": [".rs"],
    "application/x-dart": [".dart"],
    "application/x-lua": [".lua"],
    "application/x-sql": [".sql"],
    "application/xml": [".xml", ".xsl", ".xsd"],
    "application/xaml+xml": [".xaml"],
    "application/x-yaml": [".yaml", ".yml"],
    "application/toml": [".toml"],
    "application/x-web-config": [".config"],
    "application/x-csproj": [".csproj"],
    "application/x-vbproj": [".vbproj"],
    "application/x-sln": [".sln"],
    
    // 二进制和系统文件类型
    "application/octet-stream": [".bin", ".exe", ".dll", ".deb", ".rpm", ".pkg", ".dmg", ".iso", ".img"],
    "application/vnd.android.package-archive": [".apk"],
    "application/vnd.apple.installer+xml": [".mpkg"],
    "application/x-msdownload": [".exe", ".dll", ".com", ".bat", ".msi"],
    "application/x-shockwave-flash": [".swf"],
    "application/x-silverlight-app": [".xap"],
    
    // 字体类型
    "application/x-font-ttf": [".ttf"],
    "application/x-font-woff": [".woff"],
    "application/x-font-woff2": [".woff2"],
    "application/x-font-otf": [".otf"],
    "font/ttf": [".ttf"],
    "font/woff": [".woff"],
    "font/woff2": [".woff2"],
    "font/otf": [".otf"],
    "font/collection": [".ttc"],
    "application/vnd.ms-fontobject": [".eot"],
    
    // 其他应用类型
    "application/vnd.geo+json": [".geojson"],
    "application/x-protobuf": [".proto"],
    "application/graphql": [".graphql", ".gql"],
    "application/ld+json": [".jsonld"],
    "application/manifest+json": [".webmanifest"],
    "application/rss+xml": [".rss"],
    "application/atom+xml": [".atom"],
    "application/xhtml+xml": [".xhtml"],
    "application/vnd.google-earth.kml+xml": [".kml"],
    "application/vnd.google-earth.kmz": [".kmz"],
    "application/x-pkcs12": [".p12", ".pfx"],
    "application/x-pkcs7-certificates": [".p7b", ".spc"],
    "application/x-pkcs7-certreqresp": [".p7r"],
    "application/x-x509-ca-cert": [".der", ".crt", ".pem"],
    "application/pgp-encrypted": [".pgp"],
    "application/pgp-signature": [".asc", ".sig"],
    
    // 3D模型类型
    "model/gltf+json": [".gltf"],
    "model/gltf-binary": [".glb"],
    "model/obj": [".obj"],
    "model/stl": [".stl"],
    "model/x3d+xml": [".x3d"],
    "model/fbx": [".fbx"],
    "model/vnd.collada+xml": [".dae"],
    "model/iges": [".igs", ".iges"],
    "model/step": [".step", ".stp"],
    
    // 化学和科学类型
    "chemical/x-pdb": [".pdb"],
    "chemical/x-xyz": [".xyz"],
    "chemical/x-mdl-molfile": [".mol"],
    "chemical/x-mdl-sdfile": [".sdf"],
    "chemical/x-cif": [".cif"],
    
    // 电子书类型
    "application/vnd.amazon.ebook": [".azw"],
    "application/vnd.amazon.mobi8-ebook": [".azw3"],
    "application/x-mobipocket-ebook": [".mobi"],
    "application/x-fictionbook+xml": [".fb2"]
};

// 反转映射表（扩展名到MIME类型）
const extMap = {};
for (const [mime, exts] of Object.entries(mimeMap)) {
    exts.forEach(ext => {
        const key = ext.toLowerCase();
        if (!extMap[key]) {
            extMap[key] = [];
        }
        extMap[key].push(mime);
    });
}

/**
 * 扩展名转MIME类型
 * @param {string} extension - 文件扩展名
 * @returns {string[]} - 对应的MIME类型数组
 */
function extensionToMime(extension) {
    if (!extension) return null;
    
    // 统一添加前缀点
    const ext = extension.startsWith('.')? extension.toLowerCase() : `.${extension.toLowerCase()}`;
    
    return extMap[ext] || null;
}

/**
 * MIME类型转扩展名
 * @param {string} mimeType - MIME类型
 * @returns {string[]} - 对应的扩展名数组
 */
function mimeToExtension(mimeType) {
    if (!mimeType) return null;
    
    return mimeMap[mimeType.toLowerCase()] || null;
}

/**
 * 获取完整的MIME映射表
 * @returns {Object} - MIME类型到扩展名的映射表
 */
function getMimeMap() {
    return mimeMap;
}

/**
 * 获取完整的扩展名映射表
 * @returns {Object} - 扩展名到MIME类型的映射表
 */
function getExtMap() {
    return extMap;
}