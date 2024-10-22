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


  // 尝试解析JSON
  try {
    return JSON.parse(chunk);
  } catch (error) {
    console.error("无法解析JSON，即使在尝试补全后:", error);
    return null;
  }
};
  
