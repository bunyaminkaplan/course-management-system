import os
import re

src_dir = r"c:/Users/erdem/Desktop/dershane_otomasyonu/course-management-system-main/mobile/src"

replacements = {
    'colors.amberSoft': 'colors.accentSoft',
    'colors.amber': 'colors.accent',
    'colors.mint': 'colors.submitted',
    'colors.coral': 'colors.overdue',
    
    # Fonts
    "'Sora_700Bold'": 'fonts.headingBold',
    "'Sora_600SemiBold'": 'fonts.headingSemibold',
    "'Inter_400Regular'": 'fonts.body',
    "'Inter_500Medium'": 'fonts.bodyMedium',
    "'Inter_600SemiBold'": 'fonts.bodySemibold',
}

skip_files = ['tokens.ts', 'GlassBadge.tsx', 'GradientBackground.tsx']

for root, _, files in os.walk(src_dir):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            new_content = content
            for old, new in replacements.items():
                new_content = new_content.replace(old, new)
            
            if file not in skip_files:
                if file == 'GlassSurface.tsx':
                    new_content = new_content.replace("'rgba(255,255,255,0.05)'", "colors.glassBg")
                    new_content = new_content.replace("'rgba(255,255,255,0.10)'", "colors.glassBorder")
                    new_content = new_content.replace("'rgba(255,255,255,0.11)'", "colors.glassBg")
                    new_content = new_content.replace("'rgba(255,255,255,0.20)'", "colors.glassBorder")
                    
                new_content = new_content.replace("'rgba(255,255,255,0.03)'", "colors.glassBg")
                new_content = new_content.replace("'rgba(129,140,248,0.1)'", "colors.glassBg")
                new_content = new_content.replace("'rgba(129,140,248,0.15)'", "colors.glassBg")
                new_content = new_content.replace("'rgba(129,140,248,0.3)'", "colors.glassBorder")
                new_content = new_content.replace("'rgba(0,0,0,0.2)'", "colors.bg3")
                new_content = new_content.replace("'rgba(0,0,0,0.6)'", "colors.bg1")
                new_content = new_content.replace("'rgba(2,6,23,0.5)'", "colors.bg2")
                new_content = new_content.replace("'rgba(21,15,46,0.95)'", "colors.bg2")
                new_content = new_content.replace("'rgba(52,211,153,0.8)'", "colors.submitted")
                new_content = new_content.replace("'rgba(52,211,153,0.15)'", "colors.glassBg")
                new_content = new_content.replace("'rgba(52,211,153,0.3)'", "colors.glassBorder")
                new_content = new_content.replace("'rgba(245,166,35,0.15)'", "colors.glassBg")
                new_content = new_content.replace("'rgba(245,166,35,0.3)'", "colors.glassBorder")
                new_content = new_content.replace("'rgba(255,107,107,0.15)'", "colors.glassBg")
                new_content = new_content.replace("'rgba(255,107,107,0.3)'", "colors.glassBorder")
                new_content = new_content.replace("'rgba(79,70,229,0.3)'", "colors.glassBg")
                new_content = new_content.replace("'rgba(79,70,229,0.5)'", "colors.glassBorder")
                
                new_content = new_content.replace("variant='amber'", "variant='pending'")
                new_content = new_content.replace('variant="amber"', 'variant="pending"')
                new_content = new_content.replace("variant='mint'", "variant='submitted'")
                new_content = new_content.replace('variant="mint"', 'variant="submitted"')
                new_content = new_content.replace("variant='coral'", "variant='overdue'")
                new_content = new_content.replace('variant="coral"', 'variant="overdue"')
                
                new_content = new_content.replace("color: colors.bg2, fontSize: 16", "color: colors.ink, fontSize: 16")
                new_content = new_content.replace("color: colors.bg1, fontSize: 15", "color: colors.ink, fontSize: 15")

            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated: {filepath}")

print("Done")
