
import re

file_path = r"e:\Projects\CorporatePayTS\src\pages\generated\corporate_pay_global_search.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

stack = []
pairs = {')': '(', '}': '{', ']': '[', '>': '<'}

# Simple parser that ignores strings/comments would be best, but let's try a regex approach to strip them first.
# Removing comments and strings is tricky with regex, but let's try a simple state machine.

code = "".join(lines)

def remove_comments_and_strings(text):
    # This is a simplified remover, might not be perfect for TSX but good enough for balancing check
    output = []
    i = 0
    length = len(text)
    in_string = False
    string_char = ''
    in_comment = False # //
    in_block_comment = False # /* */
    
    while i < length:
        char = text[i]
        
        if in_string:
            if char == string_char:
                # Check for escaped quote
                if text[i-1] != '\\':
                    in_string = False
            output.append(" ") # replace string content with space to keep positions
        elif in_comment:
            if char == '\n':
                in_comment = False
                output.append(char)
            else:
                output.append(" ")
        elif in_block_comment:
            if char == '*' and i+1 < length and text[i+1] == '/':
                in_block_comment = False
                i += 1
                output.append("  ")
            else:
                output.append(" ")
        else:
            # Check for start of string/comment
            if char == '"' or char == "'" or char == "`":
                in_string = True
                string_char = char
                output.append(" ") 
            elif char == '/' and i+1 < length and text[i+1] == '/':
                in_comment = True
                i += 1
                output.append("  ")
            elif char == '/' and i+1 < length and text[i+1] == '*':
                in_block_comment = True
                i += 1
                output.append("  ")
            else:
                output.append(char)
        i += 1
    return "".join(output)

# clean_code = remove_comments_and_strings(code) 
# The above function is imperfect for JSX because <div className="..."> ... 
# In JSX, strings are attributes. But braces content { ... } is code. 
# Also text content in JSX: <div> content </div>. 
# We mainly care about { } ( ) [ ] balance in the code parts.

# Let's simple check strict balance of {, }, (, ), [, ] IGNORING strings/comments if possible 
# or just check line by line for obvious mismatches?

# Actually, the error "Unexpected token. Did you mean {'}'} or &rbrace;?" implies an EXTRA } or a } in text.
# Let's search for "}" that is NOT part of code structure.

def check_balance(text):
    stack = []
    for i, char in enumerate(text):
        if char in '({[':
            stack.append((char, i))
        elif char in ')}]':
            if not stack:
                line_no = text[:i].count('\n') + 1
                return f"Unmatched closing '{char}' at line {line_no}, char {i}"
            
            last_open, idx = stack.pop()
            if pairs[char] != last_open:
                line_no = text[:i].count('\n') + 1
                return f"Mismatched closing '{char}' at line {line_no} (opened by '{last_open}' at index {idx})"
    
    if stack:
        last_open, idx = stack[-1]
        line_no = text[:idx].count('\n') + 1
        return f"Unclosed '{last_open}' at line {line_no}"
    return "Balanced"

print(check_balance(code))

# Also browse specifically line 1936 area
print("Last lines:")
print("".join(lines[-10:]))
