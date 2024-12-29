export const completeJson = (chunk: string) => {
  // 计算左右括号和引号的数量
  const leftBraces = (chunk.match(/{/g) || []).length;
  const rightBraces = (chunk.match(/}/g) || []).length;
  const quotes = (chunk.match(/"/g) || []).length;

// 如果引号数量为奇数，添加一个引号到末尾
if (quotes % 2 !== 0) {
    chunk += '"';
    }

  // 如果左括号多于右括号，添加缺少的右括号
  if (leftBraces > rightBraces) {
    chunk += '}'.repeat(leftBraces - rightBraces);
  }
  // 如果右括号多于左括号，在开头添加缺少的左括号
  else if (rightBraces > leftBraces) {
    chunk = '{'.repeat(rightBraces - leftBraces) + chunk;
  }

  // chunk中最后一个}，如果前面有,则移除
  chunk = chunk.replace(/\,\s*}$/g, '}');
  // 在:后面直接跟}的情况下，补充""
  chunk = chunk.replace(/:(?=\s*})/g, ':""');

  // 处理只有键名的情况，补充:""
  // chunk = chunk.replace(/"(\w+)"(?=\s*})/g, '"$1":""');

  // 尝试解析JSON
  try {
    return JSON.parse(chunk);
  } catch (error) {
    console.error("chunk",chunk,"无法解析JSON，即使在尝试补全后:", error);
    return null;
  }
};
  
