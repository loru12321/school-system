import os

file_path = r'C:\Users\loru\Desktop\system\school-system\lt.html'
with open(file_path, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f, 1):
        if 'id="login-overlay"' in line:
            print(f"Found on line {i}")
            # print(line[:500] + "...") # Print first 500 chars
