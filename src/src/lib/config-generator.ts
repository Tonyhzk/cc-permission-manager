import { invoke } from '@tauri-apps/api/core';
import type { PermissionsConfig } from '@/types';

export type Language = 'zh_CN' | 'en_US';

/**
 * 读取模板文件
 */
async function readTemplateFile(relativePath: string): Promise<string> {
  const path = await invoke<string>('get_resource_path', { relativePath: `templates/${relativePath}` });
  const result = await invoke<{ success: boolean; content?: string; error?: string }>(
    'read_config_file',
    { path }
  );

  if (!result.success || !result.content) {
    throw new Error(result.error || `Failed to read template file: ${relativePath}`);
  }

  return result.content;
}

/**
 * 从嵌套对象中获取值（支持点号路径，如 "notifications.onCompletion.title"）
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * 替换模板中的语言键（如 {{key}} 或 {{nested.key}}）
 */
function replaceTemplateKeys(template: string, translations: any, language: string): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    // 特殊处理 language 键
    if (key === 'language') {
      return language;
    }

    const value = getNestedValue(translations, key);
    if (value === undefined) {
      console.warn(`Translation key not found: ${key}`);
      return match; // 保持原样
    }
    return String(value);
  });
}

/**
 * 生成完整的权限配置
 */
export async function generatePermissionsConfig(language: Language): Promise<PermissionsConfig> {
  // 读取模板配置
  const templateContent = await readTemplateFile('permissions.json');

  // 读取语言翻译
  const localeContent = await readTemplateFile(`locales/${language}.json`);
  const translations = JSON.parse(localeContent);

  // 替换模板中的语言键
  const configContent = replaceTemplateKeys(templateContent, translations, language);

  // 解析并返回
  return JSON.parse(configContent);
}

/**
 * 生成 settings.json 内容（读取模板并替换语言键）
 */
export async function generateSettingsConfig(
  language: Language,
  platform: 'mac' | 'windows'
): Promise<string> {
  // 读取 settings 模板
  const templateContent = await readTemplateFile(`settings_${platform}.json`);

  // 读取语言翻译
  const localeContent = await readTemplateFile(`locales/${language}.json`);
  const translations = JSON.parse(localeContent);

  // 替换模板中的语言键
  return replaceTemplateKeys(templateContent, translations, language);
}

/**
 * 替换 Python hook 脚本中的 t() 调用为硬编码文本
 */
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

    // 检查 t() 是否在 f-string 的 {...} 内部
    let isInFString = false;
    let openingBracePos = -1;
    let searchPos = tCallStart - 1;
    let braceDepth = 0;

    while (searchPos >= 0) {
      const char = scriptContent[searchPos];

      if (char === '}') {
        braceDepth++;
      } else if (char === '{') {
        if (braceDepth === 0) {
          // 找到了包含 t() 的左花括号
          openingBracePos = searchPos;
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

    // 添加 t() 之前的内容（如果在 f-string 内部，则添加到左花括号之前）
    if (isInFString && openingBracePos >= 0) {
      output.push(scriptContent.slice(lastIndex, openingBracePos));
    } else {
      output.push(scriptContent.slice(lastIndex, tCallStart));
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

    // 如果在 f-string 内部，需要跳过 t() 后的右花括号
    let closingBracePos = pos + 1;
    if (isInFString) {
      // 跳过 ) 后的空格
      while (closingBracePos < scriptContent.length && /\s/.test(scriptContent[closingBracePos])) {
        closingBracePos++;
      }
      // 期望一个 }
      if (closingBracePos < scriptContent.length && scriptContent[closingBracePos] === '}') {
        closingBracePos++;
      } else {
        closingBracePos = pos + 1;
      }
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
        // Check if param_value is an f-string
        if (paramValue.startsWith('f"') || paramValue.startsWith("f'")) {
          // Extract content from f-string (remove f" and trailing ")
          const fstringContent = paramValue.slice(2, -1); // Remove f" and "
          // Replace placeholder directly with the f-string content
          result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), fstringContent);
        } else {
          // Normal replacement with {}
          result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), `{${paramValue}}`);
        }
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

    // 更新 lastIndex
    if (isInFString) {
      lastIndex = closingBracePos;
    } else {
      lastIndex = pos + 1;
    }
  }

  return output.join('');
}

/**
 * 生成硬编码的 hook 脚本内容
 */
export async function generateHookScript(language: Language): Promise<string> {
  // 读取 hook 脚本模板
  let scriptContent = await readTemplateFile('hooks/unified-hook.py');

  // 读取语言翻译
  const localeContent = await readTemplateFile(`locales/${language}.json`);
  const translations = JSON.parse(localeContent);

  // 替换所有 t() 调用为硬编码文本
  scriptContent = replaceHookTranslations(scriptContent, translations);

  return scriptContent;
}
