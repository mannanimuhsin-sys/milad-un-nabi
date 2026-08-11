import subprocess

# Reset App.js from HEAD
subprocess.run(['git', 'checkout', 'HEAD', '--', 'src/App.js'], cwd=r'd:\MILAD UN NABI\milad')

file_path = r'd:\MILAD UN NABI\milad\src\App.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace Calligraphy group in generateBulkCertificates with App Logo Watermark
old_calligraphy_bulk = '''      <!-- Arabic Calligraphy "ميلاد" (top) and "النبي" (bottom) with decorative flourishes -->
      <g transform="translate(195, 50) scale(0.78)">'''

watermark_group_bulk = '''      <!-- LIGHT WATERMARK OF APP LOGO INSIDE GREEN BANNER -->
      <g transform="translate(195, 130)">
        <circle cx="75" cy="75" r="85" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.35"/>
        <circle cx="75" cy="75" r="77" stroke="#fef08a" stroke-width="1.5" fill="none" opacity="0.3"/>
        <circle cx="75" cy="75" r="69" stroke="#ffffff" stroke-width="1" stroke-dasharray="4 4" fill="none" opacity="0.4"/>
        <image href="${logoUrl}" x="10" y="10" width="130" height="130" opacity="0.4" />
      </g>'''

# Replace calligraphy paths inside SVG banner
idx_bulk = content.find(old_calligraphy_bulk)
if idx_bulk != -1:
    end_g = content.find('</g>', idx_bulk + 400)
    # Find the main closing </g> for calligraphy
    # Let's search for the end of calligraphy group before </svg>
    end_svg = content.find('</svg>', idx_bulk)
    content = content[:idx_bulk] + watermark_group_bulk + '\n' + content[end_svg:]
    print("Bulk watermark applied.")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
