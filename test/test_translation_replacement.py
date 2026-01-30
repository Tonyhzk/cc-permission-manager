#!/usr/bin/env python3
"""
Test script for hook translation replacement
Run with: python3 test/test_translation_replacement.py
"""

import re

# Mock translation data
translations = {
    "hook": {
        "log": {
            "matchedPattern": "匹配到模式: {pattern}",
            "notificationFailed": "发送通知失败: {error}",
            "checkingCommand": "检查子命令: {command}",
            "decision": "决策: {decision}",
            "finalDecision": "Final decision: {decision}",
            "extractedPaths": "提取到的路径: {paths}",
            "checkingPath": "检查路径: {path}",
            "workingDir": "工作目录: {dir}",
            "processing": "处理 {event} 事件",
            "splitCommands": "拆分为 {count} 个子命令: {commands}",
        }
    }
}


def get_nested_value(obj, path):
    """Get nested value from dict using dot notation"""
    keys = path.split('.')
    result = obj
    for key in keys:
        if result is None:
            return None
        result = result.get(key)
    return result


def replace_hook_translations(script_content, translations):
    """Replace t() calls with hardcoded translations"""
    last_index = 0
    output = []

    while last_index < len(script_content):
        t_call_start = script_content.find("t('", last_index)
        if t_call_start == -1:
            output.append(script_content[last_index:])
            break

        # Check if t() is inside f-string {...}
        is_in_fstring = False
        opening_brace_pos = -1
        search_pos = t_call_start - 1
        brace_depth = 0

        while search_pos >= 0:
            char = script_content[search_pos]

            if char == '}':
                brace_depth += 1
            elif char == '{':
                if brace_depth == 0:
                    # Found opening brace containing t()
                    opening_brace_pos = search_pos
                    # Look backwards for f" or f'
                    fstring_pos = search_pos - 1
                    while fstring_pos >= 0 and script_content[fstring_pos].isspace():
                        fstring_pos -= 1

                    if fstring_pos >= 1:
                        before_quote = script_content[max(0, fstring_pos - 10):fstring_pos + 1]
                        if re.search(r'f["\']$', before_quote):
                            is_in_fstring = True
                    break
                brace_depth -= 1
            elif char in ('"', "'") and brace_depth == 0:
                break

            search_pos -= 1

        # Add content before t() (or before the opening brace if in f-string)
        if is_in_fstring and opening_brace_pos >= 0:
            output.append(script_content[last_index:opening_brace_pos])
        else:
            output.append(script_content[last_index:t_call_start])

        # Extract key
        key_start = t_call_start + 3  # len("t('")
        key_end = script_content.find("'", key_start)
        if key_end == -1:
            output.append(script_content[t_call_start:])
            break

        key = script_content[key_start:key_end]

        # Find matching closing paren
        paren_count = 1
        pos = key_end + 1
        found_closing = False

        # Skip comma and spaces
        while pos < len(script_content) and script_content[pos] in (' ', '\t', ','):
            if script_content[pos] == '(':
                paren_count += 1
            pos += 1

        # Find matching )
        while pos < len(script_content):
            if script_content[pos] == '(':
                paren_count += 1
            elif script_content[pos] == ')':
                paren_count -= 1
                if paren_count == 0:
                    found_closing = True
                    break
            pos += 1

        if not found_closing:
            output.append(script_content[t_call_start:])
            break

        # If in f-string, we need to skip the closing } after t()
        closing_brace_pos = pos + 1
        if is_in_fstring:
            # Skip whitespace after )
            while closing_brace_pos < len(script_content) and script_content[closing_brace_pos].isspace():
                closing_brace_pos += 1
            # Expect a }
            if closing_brace_pos < len(script_content) and script_content[closing_brace_pos] == '}':
                closing_brace_pos += 1
            else:
                closing_brace_pos = pos + 1

        # Extract params
        after_key = script_content[key_end + 1:pos].strip()
        has_params = after_key.startswith(',')

        # Get translation text
        translation_text = get_nested_value(translations, key)

        if translation_text is None:
            print(f"Warning: Translation key not found: {key}")
            output.append(script_content[t_call_start:pos + 1])
            last_index = pos + 1
            continue

        # Generate replacement
        if not has_params:
            if is_in_fstring:
                output.append(translation_text)
            else:
                output.append(f'"{translation_text}"')
        else:
            # Parse params
            params_str = after_key[1:].strip()  # Remove leading comma
            param_map = {}

            param_start = 0
            current_key = ''
            current_value = ''
            in_value = False
            paren_depth = 0

            for i, char in enumerate(params_str):
                if char == '(':
                    paren_depth += 1
                    if in_value:
                        current_value += char
                elif char == ')':
                    paren_depth -= 1
                    if in_value:
                        current_value += char
                elif char == '=' and paren_depth == 0 and not in_value:
                    current_key = params_str[param_start:i].strip()
                    in_value = True
                    current_value = ''
                elif char == ',' and paren_depth == 0 and in_value:
                    param_map[current_key] = current_value.strip()
                    in_value = False
                    param_start = i + 1
                elif in_value:
                    current_value += char

            # Handle last param
            if in_value and current_key:
                param_map[current_key] = current_value.strip()

            # Replace placeholders
            result = translation_text
            for param_key, param_value in param_map.items():
                # Check if param_value is an f-string
                if param_value.startswith('f"') or param_value.startswith("f'"):
                    # Extract content from f-string (remove f" and trailing ")
                    quote_char = param_value[1]  # " or '
                    fstring_content = param_value[2:-1]  # Remove f" and "
                    # Replace placeholder directly with the f-string content
                    result = result.replace(f'{{{param_key}}}', fstring_content)
                else:
                    # Normal replacement with {}
                    result = result.replace(f'{{{param_key}}}', f'{{{param_value}}}')

            # Wrap based on context
            if is_in_fstring:
                output.append(result)
            else:
                if '{' in result:
                    output.append(f'f"{result}"')
                else:
                    output.append(f'"{result}"')

        # Update last_index
        if is_in_fstring:
            last_index = closing_brace_pos
        else:
            last_index = pos + 1

    return ''.join(output)


# Test cases
test_cases = [
    {
        "name": "Simple t() with params, not in f-string",
        "input": "log_debug(t('hook.log.processing', event='Stop'))",
        "expected": 'log_debug(f"处理 {\'Stop\'} 事件")'
    },
    {
        "name": "t() with nested function call in params",
        "input": "log_debug(t('hook.log.notificationFailed', error=str(e)))",
        "expected": 'log_debug(f"发送通知失败: {str(e)}")'
    },
    {
        "name": "t() inside f-string with params",
        "input": 'log_debug(f"  {t(\'hook.log.matchedPattern\', pattern=pattern)}")',
        "expected": 'log_debug(f"  匹配到模式: {pattern}")'
    },
    {
        "name": "t() inside f-string with path param",
        "input": 'log_debug(f"  {t(\'hook.log.checkingPath\', path=normalized_path)}")',
        "expected": 'log_debug(f"  检查路径: {normalized_path}")'
    },
    {
        "name": "Multiple t() calls",
        "input": 'log_debug(f"  {t(\'hook.log.checkingPath\', path=normalized_path)}")\n    log_debug(f"  {t(\'hook.log.workingDir\', dir=normalized_workdir)}")',
        "expected": 'log_debug(f"  检查路径: {normalized_path}")\n    log_debug(f"  工作目录: {normalized_workdir}")'
    },
    {
        "name": "t() with multiple params",
        "input": "log_debug(t('hook.log.splitCommands', count=len(sub_commands), commands=str(sub_commands)))",
        "expected": 'log_debug(f"拆分为 {len(sub_commands)} 个子命令: {str(sub_commands)}")'
    },
    {
        "name": "t() inside nested f-string with literal decision",
        "input": 'log_debug(f"    {t(\'hook.log.decision\', decision=\'globalDeny command match = deny\')}")',
        "expected": 'log_debug(f"    决策: {\'globalDeny command match = deny\'}")'
    },
    {
        "name": "t() with f-string as parameter value",
        "input": 'log_debug(t(\'hook.log.finalDecision\', decision=f"deny (because sub-command \'{sub_cmd}\' was denied)"))',
        "expected": 'log_debug(f"Final decision: deny (because sub-command \'{sub_cmd}\' was denied)")'
    }
]

# Run tests
print("Running translation replacement tests...\n")

passed = 0
failed = 0

for test_case in test_cases:
    result = replace_hook_translations(test_case["input"], translations)
    success = result == test_case["expected"]

    if success:
        print(f"✓ PASS: {test_case['name']}")
        passed += 1
    else:
        print(f"✗ FAIL: {test_case['name']}")
        print(f"  Input:    {test_case['input']}")
        print(f"  Expected: {test_case['expected']}")
        print(f"  Got:      {result}")
        print()
        failed += 1

print(f"\n{passed} passed, {failed} failed")

if failed > 0:
    exit(1)
