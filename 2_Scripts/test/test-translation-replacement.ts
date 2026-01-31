/**
 * Test script for hook translation replacement
 * Run with: npx tsx test/test-translation-replacement.ts
 */

// Mock translation data
const translations = {
  hook: {
    log: {
      matchedPattern: "匹配到模式: {pattern}",
      notificationFailed: "发送通知失败: {error}",
      checkingCommand: "检查子命令: {command}",
      decision: "决策: {decision}",
      extractedPaths: "提取到的路径: {paths}",
      checkingPath: "检查路径: {path}",
      workingDir: "工作目录: {dir}",
      processing: "处理 {event} 事件",
      splitCommands: "拆分为 {count} 个子命令: {commands}",
    }
  }
};

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function replaceHookTranslations(scriptContent: string, translations: any): string {
  let lastIndex = 0;
  const output: string[] = [];

  // 手动解析以处理嵌套括号
  while (lastIndex < scriptContent.length) {
    const tCallStart = scriptContent.indexOf("t('", lastIndex);
    if (tCallStart === -1) {
      // 没有更多的 t() 调用
      output.push(scriptContent.slice(lastIndex));
      break;
    }

    // 添加 t() 之前的内容
    output.push(scriptContent.slice(lastIndex, tCallStart));

    // 检查 t() 是否在 f-string 的 {...} 内部
    // 向后查找最近的 f" 或 f'，以及最近的 { 和 }
    let isInFString = false;
    let searchPos = tCallStart - 1;
    let braceDepth = 0;

    while (searchPos >= 0) {
      const char = scriptContent[searchPos];

      if (char === '}') {
        braceDepth++;
      } else if (char === '{') {
        if (braceDepth === 0) {
          // 找到了包含 t() 的左花括号
          // 继续向前查找是否有 f" 或 f'
          let fStringPos = searchPos - 1;
          while (fStringPos >= 0 && /\s/.test(scriptContent[fStringPos])) {
            fStringPos--;
          }

          // 检查是否是 f" 或 f' 的开始
          if (fStringPos >= 1) {
            const beforeQuote = scriptContent.slice(Math.max(0, fStringPos - 10), fStringPos + 1);
            if (/f["']$/.test(beforeQuote)) {
              isInFString = true;
            }
          }
          break;
        }
        braceDepth--;
      } else if ((char === '"' || char === "'") && braceDepth === 0) {
        // 遇到字符串边界，停止搜索
        break;
      }

      searchPos--;
    }

    // 提取 key（在单引号之间）
    const keyStart = tCallStart + 3; // "t('" 的长度
    const keyEnd = scriptContent.indexOf("'", keyStart);
    if (keyEnd === -1) {
      // 格式错误，保持原样
      output.push(scriptContent.slice(tCallStart));
      break;
    }

    const key = scriptContent.slice(keyStart, keyEnd);

    // 找到匹配的右括号（考虑嵌套）
    let parenCount = 1;
    let pos = keyEnd + 1; // 跳过 key 后的引号
    let foundClosing = false;

    // 跳过可能的逗号和空格
    while (pos < scriptContent.length && /[\s,]/.test(scriptContent[pos])) {
      if (scriptContent[pos] === '(') {
        parenCount++;
      }
      pos++;
    }

    // 查找匹配的右括号
    while (pos < scriptContent.length) {
      if (scriptContent[pos] === '(') {
        parenCount++;
      } else if (scriptContent[pos] === ')') {
        parenCount--;
        if (parenCount === 0) {
          foundClosing = true;
          break;
        }
      }
      pos++;
    }

    if (!foundClosing) {
      // 没找到匹配的右括号，保持原样
      output.push(scriptContent.slice(tCallStart));
      break;
    }

    // 提取参数部分（如果有）
    const afterKey = scriptContent.slice(keyEnd + 1, pos).trim();
    const hasParams = afterKey.startsWith(',');

    // 获取翻译文本
    const translationText = getNestedValue(translations, key);

    if (translationText === undefined) {
      console.warn(`Translation key not found in hook script: ${key}`);
      // 保持原样
      output.push(scriptContent.slice(tCallStart, pos + 1));
      lastIndex = pos + 1;
      continue;
    }

    // 生成替换文本
    if (!hasParams) {
      // 没有参数
      if (isInFString) {
        // 在 f-string 内部，直接返回文本
        output.push(translationText);
      } else {
        // 不在 f-string 内部，用引号包裹
        output.push(`"${translationText}"`);
      }
    } else {
      // 有参数的情况，需要解析参数映射并替换占位符
      const paramsStr = afterKey.slice(1).trim(); // 去掉开头的逗号
      const paramMap: Record<string, string> = {};

      // 简单的参数解析（处理 key=value 格式）
      let paramStart = 0;
      let currentKey = '';
      let currentValue = '';
      let inValue = false;
      let parenDepth = 0;

      for (let i = 0; i < paramsStr.length; i++) {
        const char = paramsStr[i];

        if (char === '(') {
          parenDepth++;
          if (inValue) currentValue += char;
        } else if (char === ')') {
          parenDepth--;
          if (inValue) currentValue += char;
        } else if (char === '=' && parenDepth === 0 && !inValue) {
          currentKey = paramsStr.slice(paramStart, i).trim();
          inValue = true;
          currentValue = '';
        } else if (char === ',' && parenDepth === 0 && inValue) {
          paramMap[currentKey] = currentValue.trim();
          inValue = false;
          paramStart = i + 1;
        } else if (inValue) {
          currentValue += char;
        }
      }

      // 处理最后一个参数
      if (inValue && currentKey) {
        paramMap[currentKey] = currentValue.trim();
      }

      // 替换翻译文本中的占位符
      let result = translationText;
      for (const [paramKey, paramValue] of Object.entries(paramMap)) {
        result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), `{${paramValue}}`);
      }

      // 根据是否在 f-string 内部决定如何包装
      if (isInFString) {
        // 已经在 f-string 内部，直接返回带占位符的文本
        output.push(result);
      } else {
        // 不在 f-string 内部，需要包装成 f-string
        if (result.includes('{')) {
          output.push(`f"${result}"`);
        } else {
          output.push(`"${result}"`);
        }
      }
    }

    lastIndex = pos + 1;
  }

  return output.join('');
}

// Test cases
const testCases = [
  {
    name: "Simple t() without params, not in f-string",
    input: `log_debug(t('hook.log.processing', event='Stop'))`,
    expected: `log_debug(f"处理 {event} 事件")`
  },
  {
    name: "t() with nested function call in params",
    input: `log_debug(t('hook.log.notificationFailed', error=str(e)))`,
    expected: `log_debug(f"发送通知失败: {str(e)}")`
  },
  {
    name: "t() inside f-string with params",
    input: `log_debug(f"  {t('hook.log.matchedPattern', pattern=pattern)}")`,
    expected: `log_debug(f"  匹配到模式: {pattern}")`
  },
  {
    name: "t() inside f-string without params (should not happen but test anyway)",
    input: `log_debug(f"  {t('hook.log.checkingPath', path=normalized_path)}")`,
    expected: `log_debug(f"  检查路径: {normalized_path}")`
  },
  {
    name: "Multiple t() calls in same line",
    input: `log_debug(f"  {t('hook.log.checkingPath', path=normalized_path)}")\n    log_debug(f"  {t('hook.log.workingDir', dir=normalized_workdir)}")`,
    expected: `log_debug(f"  检查路径: {normalized_path}")\n    log_debug(f"  工作目录: {normalized_workdir}")`
  },
  {
    name: "t() with multiple params",
    input: `log_debug(t('hook.log.splitCommands', count=len(sub_commands), commands=str(sub_commands)))`,
    expected: `log_debug(f"拆分为 {len(sub_commands)} 个子命令: {str(sub_commands)}")`
  },
  {
    name: "t() inside nested f-string expression",
    input: `log_debug(f"    {t('hook.log.decision', decision='globalDeny command match = deny')}")`,
    expected: `log_debug(f"    决策: {decision}")`
  }
];

// Run tests
console.log("Running translation replacement tests...\n");

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  const result = replaceHookTranslations(testCase.input, translations);
  const success = result === testCase.expected;

  if (success) {
    console.log(`✓ PASS: ${testCase.name}`);
    passed++;
  } else {
    console.log(`✗ FAIL: ${testCase.name}`);
    console.log(`  Input:    ${testCase.input}`);
    console.log(`  Expected: ${testCase.expected}`);
    console.log(`  Got:      ${result}`);
    console.log();
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
