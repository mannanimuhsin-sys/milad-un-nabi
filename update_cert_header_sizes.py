import sys
sys.stdout.reconfigure(encoding='utf-8')

file_path = r'd:\MILAD UN NABI\milad\src\App.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# -------------------------------------------------------------
# 1. Update generateBulkCertificates template in App.js
# -------------------------------------------------------------
# Find generateBulkCertificates block and replace header & vector calligraphy
svg_vector_calligraphy_html = '''      <!-- ARTISTIC CALLIGRAPHY GROUP: "میلاد النبي" -->
      <g transform="translate(195, 50) scale(0.78)" filter="url(#glow)">
        <path d="M15 65 C-20 40 -15 0 25 -15 C60 -25 90 5 70 30 C55 45 35 30 45 15" stroke="#ffffff" stroke-width="2.2" fill="none" opacity="0.8" stroke-linecap="round"/>
        <circle cx="45" cy="15" r="3.5" fill="#ffffff" opacity="0.9"/>
        <circle cx="10" cy="70" r="3" fill="#ffffff" opacity="0.85"/>

        <path d="M165 45 C195 20 215 50 190 75 C170 90 150 70 170 50 C180 40 195 50 188 60" stroke="#ffffff" stroke-width="2.2" fill="none" opacity="0.8" stroke-linecap="round"/>
        <circle cx="188" cy="60" r="3.5" fill="#ffffff" opacity="0.9"/>

        <path d="M-15 140 C-45 165 -35 205 0 215 C25 220 15 245 -5 255" stroke="#ffffff" stroke-width="2.2" fill="none" opacity="0.7" stroke-linecap="round"/>
        <path d="M210 160 C245 185 235 225 200 240 C175 250 190 275 210 285" stroke="#ffffff" stroke-width="2.2" fill="none" opacity="0.7" stroke-linecap="round"/>
        <circle cx="215" cy="148" r="3.5" fill="#ffffff" opacity="0.9"/>

        <path d="M10 270 Q95 305 185 265" stroke="#ffffff" stroke-width="2.8" fill="none" opacity="0.85" stroke-linecap="round"/>
        <circle cx="97" cy="292" r="5" fill="#ffffff" opacity="0.95"/>
        <path d="M82 305 Q97 312 112 305" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.8"/>

        <g fill="#ffffff" opacity="0.98">
          <path d="M35 125 C30 115 35 102 48 102 C62 102 68 114 62 124 C56 132 42 132 35 125 Z M42 112 C38 116 42 121 48 121 C54 121 58 116 54 112 C50 108 44 108 42 112 Z"/>
          <path d="M48 128 C65 128 80 120 95 105 L104 114 C85 133 65 142 45 140 Z"/>
          <path d="M92 110 C98 90 102 65 106 40 L118 42 C114 68 109 95 102 116 Z"/>
          <path d="M106 40 C115 25 125 15 135 10 L140 18 C132 23 123 32 116 45 Z"/>
          <path d="M125 35 C132 15 142 0 152 -10 L159 -3 C148 8 138 24 132 42 Z"/>
          <path d="M120 125 C140 125 160 115 175 95 C185 80 180 65 165 65 C150 65 145 80 152 92 C158 100 168 98 165 90 C162 85 155 88 155 92 C155 105 135 115 120 114 Z"/>
          <path d="M125 122 C145 122 170 135 190 155 L182 163 C165 145 142 133 122 133 Z"/>
        </g>

        <g fill="#ffffff" opacity="0.98">
          <path d="M145 150 C155 125 160 95 165 65 L176 68 C171 96 165 128 154 155 Z"/>
          <path d="M130 155 C140 130 146 100 150 70 L161 73 C157 101 150 133 139 160 Z"/>
          <path d="M128 158 C115 165 100 168 85 168 C70 168 58 162 48 152 L56 143 C64 151 74 156 86 156 C98 156 110 153 120 148 Z"/>
          <circle cx="85" cy="138" r="5.5"/>
          <path d="M48 152 C42 165 35 178 25 188 C18 195 8 198 -2 195 L-4 184 C4 187 11 185 17 179 C25 171 31 160 37 148 Z"/>
          <path d="M25 188 C38 185 55 182 72 182 C95 182 118 190 135 205 C155 222 160 245 142 258 C122 272 85 272 50 258 C25 248 5 230 -10 205 L0 197 C13 220 30 236 53 245 C84 258 116 258 132 246 C144 236 140 219 124 205 C110 193 90 186 70 186 C55 186 40 189 28 192 Z"/>
          <circle cx="65" cy="225" r="5.5"/>
          <circle cx="82" cy="223" r="5.5"/>
          <path d="M68 132 Q74 125 78 132 Q82 125 86 132" stroke="#ffffff" stroke-width="3.2" fill="none"/>
          <path d="M72 118 L86 112 L89 116 L75 122 Z"/>
          <path d="M38 135 L50 128 L53 132 L41 139 Z"/>
        </g>
      </g>'''

svg_vector_calligraphy_jsx = svg_vector_calligraphy_html.replace('stroke-width', 'strokeWidth').replace('stroke-linecap', 'strokeLinecap')

# Header CSS styles in bulk cert template
old_header_css = '''.cert-logo-section { display: flex; align-items: center; gap: 14px; }
  .cert-app-logo { width: 62px; height: 62px; object-fit: contain; border-radius: 12px; box-shadow: 0 2px 8px rgba(6,78,59,0.15); }
  .cert-org-details { display: flex; flex-direction: column; }
  .cert-madrasa-name { font-size: 19px; font-weight: 800; color: #064e3b; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2; }
  .cert-madrasa-place { font-size: 15px; font-weight: 700; color: #064e3b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
  .cert-event-section { text-align: left; }
  .cert-event-name { font-size: 20px; font-weight: 800; color: #064e3b; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2; }
  .cert-event-sub { font-size: 11.5px; font-weight: 600; color: #064e3b; letter-spacing: 0.5px; margin-top: 3px; opacity: 0.9; }'''

new_header_css = '''.cert-logo-section { display: flex; align-items: center; gap: 16px; }
  .cert-app-logo { width: 75px; height: 75px; object-fit: contain; border-radius: 14px; box-shadow: 0 3px 10px rgba(6,78,59,0.18); }
  .cert-org-details { display: flex; flex-direction: column; }
  .cert-madrasa-name { font-size: 23px; font-weight: 900; color: #064e3b; text-transform: uppercase; letter-spacing: 0.6px; line-height: 1.15; }
  .cert-madrasa-place { font-size: 17px; font-weight: 800; color: #064e3b; text-transform: uppercase; letter-spacing: 0.6px; margin-top: 3px; opacity: 0.95; }
  .cert-event-section { text-align: left; }
  .cert-event-name { font-size: 24px; font-weight: 900; color: #064e3b; text-transform: uppercase; letter-spacing: 0.6px; line-height: 1.15; }
  .cert-event-sub { font-size: 14px; font-weight: 700; color: #064e3b; letter-spacing: 0.6px; margin-top: 4px; opacity: 0.95; }'''

if old_header_css in content:
    content = content.replace(old_header_css, new_header_css)
    print("Replaced header CSS in bulk cert template!")

# Also update logo inline styles in bulk cert HTML
content = content.replace('style="width:62px; height:62px;', 'style="width:75px; height:75px;')

# -------------------------------------------------------------
# 2. Update activeCertificate modal JSX in App.js
# -------------------------------------------------------------
# Replace old modal JSX text block with vector calligraphy
old_modal_g_jsx = '''                    <g transform="translate(180, 45)">
                      <path d="M-30 40 Q-60 15 -35 -10 Q-10 -25 20 -5" stroke="#ffffff" strokeWidth="1.8" fill="none" opacity="0.8" strokeLinecap="round"/>
                      <circle cx="-42" cy="18" r="2.8" fill="#ffffff" opacity="0.9"/>
                      <path d="M140 25 Q170 -5 145 -25 Q120 -35 105 -10" stroke="#ffffff" strokeWidth="1.8" fill="none" opacity="0.8" strokeLinecap="round"/>
                      <circle cx="152" cy="-2" r="2.8" fill="#ffffff" opacity="0.9"/>

                      <text x="60" y="90" textAnchor="middle" fill="#ffffff" fontFamily="'Amiri', 'Aref Ruqaa', 'Scheherazade New', serif" fontSize="82" fontWeight="bold" letterSpacing="1">
                        ميلاد
                      </text>

                      <path d="M-50 100 Q-75 130 -45 150 Q-15 160 -35 180" stroke="#ffffff" strokeWidth="1.8" fill="none" opacity="0.7" strokeLinecap="round"/>

                      <text x="75" y="195" textAnchor="middle" fill="#ffffff" fontFamily="'Amiri', 'Aref Ruqaa', 'Scheherazade New', serif" fontSize="88" fontWeight="bold" letterSpacing="1">
                        النَّبِيِّ
                      </text>

                      <path d="M165 135 Q200 160 178 195 Q155 220 175 240" stroke="#ffffff" strokeWidth="1.8" fill="none" opacity="0.7" strokeLinecap="round"/>
                      <circle cx="182" cy="172" r="2.8" fill="#ffffff" opacity="0.9"/>

                      <path d="M-15 235 Q65 260 145 235" stroke="#ffffff" strokeWidth="2.2" fill="none" opacity="0.8"/>
                      <circle cx="65" cy="248" r="3.8" fill="#ffffff" opacity="0.95"/>
                    </g>'''

if old_modal_g_jsx in content:
    content = content.replace(old_modal_g_jsx, svg_vector_calligraphy_jsx)
    print("Replaced old modal JSX text calligraphy with SVG vector calligraphy!")

# Update header font sizes in activeCertificate modal JSX & print HTML
content = content.replace("fontSize: '19px', fontWeight: '800'", "fontSize: '23px', fontWeight: '900'")
content = content.replace("fontSize: '15px', fontWeight: '700'", "fontSize: '17px', fontWeight: '800'")
content = content.replace("fontSize: '20px', fontWeight: '800'", "fontSize: '24px', fontWeight: '900'")
content = content.replace("fontSize: '11.5px', fontWeight: '600'", "fontSize: '14px', fontWeight: '700'")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("App.js updated successfully with enlarged header sizes!")
