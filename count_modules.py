import re

file_path = r'C:\Users\loru\Desktop\system\school-system\lt.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'var APP_MODULES=\[(.*?)\];', content)
if match:
    modules = match.group(1).split(',')
    print(f"Total modules: {len(modules)}")
    for i, m in enumerate(modules):
        print(f"{i}: {m}")
else:
    print("APP_MODULES not found")
