import re

file_path = r'C:\Users\loru\Desktop\system\school-system\lt.html'
with open(file_path, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if 'id="global-loader"' in line:
            print(f"global-loader found at line {i+1}")
        if 'id="login-overlay"' in line:
            print(f"login-overlay found at line {i+1}")
        if 'id="login-form"' in line:
            print(f"login-form found at line {i+1}")
