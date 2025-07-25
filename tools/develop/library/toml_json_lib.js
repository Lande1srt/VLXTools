// 精简版 TOML 解析与序列化库
        const TOML = (function() {
            // 解析 TOML 为 JavaScript 对象
            function parse(tomlString) {
                const result = {};
                const lines = tomlString.split('\n');
                
                lines.forEach((line, index) => {
                    const trimmedLine = line.trim();
                    // 跳过空行和注释
                    if (!trimmedLine || trimmedLine.startsWith('#')) return;
                    
                    // 查找键值对分隔符
                    const equalsIndex = trimmedLine.indexOf('=');
                    if (equalsIndex === -1) {
                        throw new Error(`第 ${index + 1} 行格式错误，缺少等号`);
                    }
                    
                    // 提取键和值
                    const key = trimmedLine.substring(0, equalsIndex).trim();
                    let value = trimmedLine.substring(equalsIndex + 1).trim();
                    
                    // 处理字符串引号
                    if ((value.startsWith("'") && value.endsWith("'")) || 
                        (value.startsWith('"') && value.endsWith('"'))) {
                        value = value.substring(1, value.length - 1);
                    }
                    // 转换基本数据类型
                    else if (value === 'true') value = true;
                    else if (value === 'false') value = false;
                    else if (!isNaN(value)) value = Number(value);
                    else if (value === 'null') value = null;
                    
                    result[key] = value;
                });
                
                return result;
            }
            
            // 将 JavaScript 对象序列化为 TOML
            function stringify(obj) {
                let toml = '';
                
                Object.entries(obj).forEach(([key, value]) => {
                    let valueStr;
                    
                    // 根据值类型格式化
                    if (typeof value === 'string') {
                        valueStr = `"${value}"`;
                    } else if (typeof value === 'boolean') {
                        valueStr = value ? 'true' : 'false';
                    } else if (value === null) {
                        valueStr = 'null';
                    } else if (typeof value === 'number') {
                        valueStr = value.toString();
                    } else {
                        valueStr = String(value);
                    }
                    
                    toml += `${key} = ${valueStr}\n`;
                });
                
                return toml;
            }
            
            return { parse, stringify };
        })();