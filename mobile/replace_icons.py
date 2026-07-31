import os
import glob

def replace_icons():
    src_path = "src/**/*.tsx"
    files = glob.glob(src_path, recursive=True)
    
    for file_path in files:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = content.replace('UserCircle', 'CircleUser').replace('AlertCircle', 'CircleAlert')
        
        if new_content != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {file_path}")

if __name__ == "__main__":
    replace_icons()
