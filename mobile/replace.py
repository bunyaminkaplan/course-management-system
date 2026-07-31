import os
import glob

def replace_lucide():
    src_dir = r"C:\Users\erdem\Desktop\dershane_otomasyonu\course-management-system-main\mobile\src"
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                if "'lucide-react'" in content or '"lucide-react"' in content:
                    content = content.replace("'lucide-react'", "'lucide-react-native'")
                    content = content.replace('"lucide-react"', '"lucide-react-native"')
                    
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"Updated {path}")

if __name__ == "__main__":
    replace_lucide()
