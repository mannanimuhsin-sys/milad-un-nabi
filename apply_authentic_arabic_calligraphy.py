import sys
sys.stdout.reconfigure(encoding='utf-8')

file_path = r'd:\MILAD UN NABI\milad\src\App.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# -------------------------------------------------------------
# 1. Update Bulk Certificates Calligraphy (HTML template string)
# -------------------------------------------------------------
old_bulk_calligraphy_marker = '<!-- Arabic Calligraphy "ميلاد النبي" - Watercolor Executive Style -->'

new_bulk_calligraphy = '''      <!-- AUTHENTIC ARABIC CALLIGRAPHY GROUP: "مِـيـلاَد النَّبِـيّ" -->
      <defs>
        <linearGradient id="goldGrad_${result.id || Math.random()}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1"/>
          <stop offset="50%" style="stop-color:#fef08a;stop-opacity:0.95"/>
          <stop offset="100%" style="stop-color:#f59e0b;stop-opacity:0.9"/>
        </linearGradient>
        <filter id="glow_${result.id || Math.random()}" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#022c22" flood-opacity="0.6"/>
        </filter>
      </defs>

      <g transform="translate(185, 45)" filter="url(#glow_${result.id || Math.random()})">
        <!-- ARTISTIC DECORATIVE ARCS & ORNAMENTS -->
        <path d="M20 40 C25 15 170 15 175 40" stroke="url(#goldGrad_${result.id || Math.random()})" stroke-width="2.5" fill="none" opacity="0.85" stroke-linecap="round"/>
        <circle cx="97.5" cy="18" r="4" fill="#fef08a" opacity="0.95"/>
        <circle cx="25" cy="38" r="3" fill="#ffffff" opacity="0.8"/>
        <circle cx="170" cy="38" r="3" fill="#ffffff" opacity="0.8"/>

        <path d="M15 110 C-10 90 5 60 30 70" stroke="#fef08a" stroke-width="2" fill="none" opacity="0.75" stroke-linecap="round"/>
        <path d="M180 110 C205 90 190 60 165 70" stroke="#fef08a" stroke-width="2" fill="none" opacity="0.75" stroke-linecap="round"/>

        <path d="M30 145 Q97.5 165 165 145" stroke="url(#goldGrad_${result.id || Math.random()})" stroke-width="2" fill="none" opacity="0.8" stroke-linecap="round"/>
        <circle cx="97.5" cy="158" r="3.5" fill="#fef08a" opacity="0.9"/>

        <path d="M20 250 C25 275 170 275 175 250" stroke="url(#goldGrad_${result.id || Math.random()})" stroke-width="2.5" fill="none" opacity="0.85" stroke-linecap="round"/>
        <circle cx="97.5" cy="270" r="4" fill="#fef08a" opacity="0.95"/>

        <!-- TOP WORD: "مِـيـلاَد" -->
        <text x="97.5" y="115" text-anchor="middle" font-family="'Aref Ruqaa', 'Amiri', 'Traditional Arabic', serif" font-size="52" font-weight="700" fill="url(#goldGrad_${result.id || Math.random()})" direction="rtl">مِيلاَد</text>

        <!-- BOTTOM WORD: "النَّبِيِّ" -->
        <text x="97.5" y="215" text-anchor="middle" font-family="'Aref Ruqaa', 'Amiri', 'Traditional Arabic', serif" font-size="56" font-weight="700" fill="url(#goldGrad_${result.id || Math.random()})" direction="rtl">النَّبِيِّ</text>
      </g>'''

# -------------------------------------------------------------
# 2. Update Single Cert Modal Calligraphy (JSX syntax)
# -------------------------------------------------------------
old_single_calligraphy_marker = '{/* ARTISTIC CALLIGRAPHY GROUP: "ميلاد النبي" - Watercolor Executive Style */}'

new_single_calligraphy = '''      {/* AUTHENTIC ARABIC CALLIGRAPHY GROUP: "مِـيـلاَد النَّبِـيّ" */}
      <defs>
        <linearGradient id="goldGrad_single" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor:'#ffffff',stopOpacity:1}}/>
          <stop offset="50%" style={{stopColor:'#fef08a',stopOpacity:0.95}}/>
          <stop offset="100%" style={{stopColor:'#f59e0b',stopOpacity:0.9}}/>
        </linearGradient>
        <filter id="glow_single" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#022c22" floodOpacity="0.6"/>
        </filter>
      </defs>

      <g transform="translate(185, 45)" filter="url(#glow_single)">
        {/* ARTISTIC DECORATIVE ARCS & ORNAMENTS */}
        <path d="M20 40 C25 15 170 15 175 40" stroke="url(#goldGrad_single)" strokeWidth="2.5" fill="none" opacity="0.85" strokeLinecap="round"/>
        <circle cx="97.5" cy="18" r="4" fill="#fef08a" opacity="0.95"/>
        <circle cx="25" cy="38" r="3" fill="#ffffff" opacity="0.8"/>
        <circle cx="170" cy="38" r="3" fill="#ffffff" opacity="0.8"/>

        <path d="M15 110 C-10 90 5 60 30 70" stroke="#fef08a" strokeWidth="2" fill="none" opacity="0.75" strokeLinecap="round"/>
        <path d="M180 110 C205 90 190 60 165 70" stroke="#fef08a" strokeWidth="2" fill="none" opacity="0.75" strokeLinecap="round"/>

        <path d="M30 145 Q97.5 165 165 145" stroke="url(#goldGrad_single)" strokeWidth="2" fill="none" opacity="0.8" strokeLinecap="round"/>
        <circle cx="97.5" cy="158" r="3.5" fill="#fef08a" opacity="0.9"/>

        <path d="M20 250 C25 275 170 275 175 250" stroke="url(#goldGrad_single)" strokeWidth="2.5" fill="none" opacity="0.85" strokeLinecap="round"/>
        <circle cx="97.5" cy="270" r="4" fill="#fef08a" opacity="0.95"/>

        {/* TOP WORD: "مِـيـلاَد" */}
        <text x="97.5" y="115" textAnchor="middle" fontFamily="'Aref Ruqaa', 'Amiri', 'Traditional Arabic', serif" fontSize="52" fontWeight="700" fill="url(#goldGrad_single)" direction="rtl">مِيلاَد</text>

        {/* BOTTOM WORD: "النَّبِيِّ" */}
        <text x="97.5" y="215" textAnchor="middle" fontFamily="'Aref Ruqaa', 'Amiri', 'Traditional Arabic', serif" fontSize="56" fontWeight="700" fill="url(#goldGrad_single)" direction="rtl">النَّبِيِّ</text>
      </g>'''

# Replace bulk calligraphy
start_bulk = content.find(old_bulk_calligraphy_marker)
if start_bulk != -1:
    end_bulk = content.find('</svg>', start_bulk)
    content = content[:start_bulk] + new_bulk_calligraphy + '\n    ' + content[end_bulk:]
    print("Bulk calligraphy updated successfully.")
else:
    print("WARNING: Could not find old_bulk_calligraphy_marker")

# Replace single modal calligraphy
start_single = content.find(old_single_calligraphy_marker)
if start_single != -1:
    end_single = content.find('</svg>', start_single)
    content = content[:start_single] + new_single_calligraphy + '\n    ' + content[end_single:]
    print("Single modal calligraphy updated successfully.")
else:
    print("WARNING: Could not find old_single_calligraphy_marker")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("App.js updated successfully.")
