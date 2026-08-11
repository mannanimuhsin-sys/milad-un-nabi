import sys
sys.stdout.reconfigure(encoding='utf-8')

file_path = r'd:\MILAD UN NABI\milad\src\App.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# -------------------------------------------------------------
# 1. BULK CERTIFICATES SVG OVERLAY TEMPLATE (HTML String)
# -------------------------------------------------------------
old_bulk_cert_wrapper = '<div class="certificate-wrapper">'

# We search for the SVG block inside generateBulkCertificates
# <div class="cert-right-banner"> ... </div>
# and replace with <div class="cert-bg-overlay"> ... </div>

new_bulk_svg = '''<div class="certificate-wrapper" style="position:relative; width:1050px; height:740px; background:#ffffff; overflow:hidden; page-break-after:always; margin:0 auto 40px auto; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
  <!-- Full Background SVG Overlay with Sweeping Curves & Gold Accents -->
  <div class="cert-bg-overlay" style="position:absolute; top:0; left:0; width:1050px; height:740px; pointer-events:none; z-index:1;">
    <svg width="1050" height="740" viewBox="0 0 1050 740" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="islamicPattern_${result.id || Math.random()}" width="70" height="70" patternUnits="userSpaceOnUse">
          <path d="M35 0 L70 35 L35 70 L0 35 Z" stroke="#0d6e53" stroke-width="0.8" fill="none" opacity="0.35"/>
          <path d="M0 0 L70 70 M70 0 L0 70" stroke="#0d6e53" stroke-width="0.8" fill="none" opacity="0.2"/>
          <circle cx="35" cy="35" r="14" stroke="#0d6e53" stroke-width="0.8" fill="none" opacity="0.25"/>
          <polygon points="35,12 42,27 58,27 44,37 50,53 35,43 20,53 26,37 12,27 28,27" stroke="#0d6e53" stroke-width="0.6" fill="none" opacity="0.25"/>
        </pattern>

        <linearGradient id="goldGradient_${result.id || Math.random()}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fef08a;stop-opacity:1"/>
          <stop offset="25%" style="stop-color:#f59e0b;stop-opacity:1"/>
          <stop offset="65%" style="stop-color:#d97706;stop-opacity:1"/>
          <stop offset="100%" style="stop-color:#b45309;stop-opacity:1"/>
        </linearGradient>

        <linearGradient id="greenGrad_${result.id || Math.random()}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#064e3b;stop-opacity:1"/>
          <stop offset="100%" style="stop-color:#022c22;stop-opacity:1"/>
        </linearGradient>

        <filter id="shadowFilter_${result.id || Math.random()}" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="-2" dy="3" stdDeviation="5" flood-color="#022c22" flood-opacity="0.35"/>
        </filter>
      </defs>

      <!-- Outer Border Frame -->
      <rect x="10" y="10" width="1030" height="720" rx="6" stroke="url(#goldGradient_${result.id || Math.random()})" stroke-width="2.5" fill="none" opacity="0.45"/>

      <!-- TOP-LEFT RIBBON WITH GOLD BADGE MEDAL -->
      <path d="M 45 0 L 105 0 L 105 130 L 75 110 L 45 130 Z" fill="url(#greenGrad_${result.id || Math.random()})" filter="url(#shadowFilter_${result.id || Math.random()})"/>
      <path d="M 45 0 L 105 0 L 105 130 L 75 110 L 45 130 Z" fill="url(#islamicPattern_${result.id || Math.random()})" opacity="0.6"/>
      <path d="M 47 0 L 47 125 L 75 106 L 103 125 L 103 0" stroke="url(#goldGradient_${result.id || Math.random()})" stroke-width="1.8" fill="none" opacity="0.9"/>
      <g transform="translate(75, 62)">
        <polygon points="0,-26 7,-18 18,-18 14,-7 23,2 14,11 18,22 7,22 0,30 -7,22 -18,22 -14,11 -23,2 -14,-7 -18,-18 -7,-18" fill="url(#goldGradient_${result.id || Math.random()})" filter="url(#shadowFilter_${result.id || Math.random()})"/>
        <circle cx="0" cy="2" r="16" fill="#064e3b" stroke="url(#goldGradient_${result.id || Math.random()})" stroke-width="2"/>
        <circle cx="0" cy="2" r="12" fill="none" stroke="url(#goldGradient_${result.id || Math.random()})" stroke-width="1.2" opacity="0.8"/>
        <polygon points="0,-7 2,-2 7,-2 3,1 5,6 0,3 -5,6 -3,1 -7,-2 -2,-2" fill="url(#goldGradient_${result.id || Math.random()})"/>
      </g>

      <!-- BOTTOM-LEFT CORNER ACCENT -->
      <path d="M 0 635 C 100 635, 160 680, 190 740 L 165 740 C 140 690, 85 648, 0 648 Z" fill="url(#goldGradient_${result.id || Math.random()})" filter="url(#shadowFilter_${result.id || Math.random()})"/>
      <path d="M 0 648 C 85 648, 140 690, 165 740 L 0 740 Z" fill="url(#greenGrad_${result.id || Math.random()})"/>
      <path d="M 0 648 C 85 648, 140 690, 165 740 L 0 740 Z" fill="url(#islamicPattern_${result.id || Math.random()})" opacity="0.7"/>

      <!-- RIGHT SIDE SWEEPING BANNER -->
      <path d="M 700 0 C 600 230, 670 510, 1050 630 L 1050 658 C 640 535, 570 230, 676 0 Z" fill="url(#goldGradient_${result.id || Math.random()})" filter="url(#shadowFilter_${result.id || Math.random()})"/>
      <path d="M 700 0 C 600 230, 670 510, 1050 630 L 1050 740 L 1050 0 Z" fill="url(#greenGrad_${result.id || Math.random()})"/>
      <path d="M 700 0 C 600 230, 670 510, 1050 630 L 1050 740 L 1050 0 Z" fill="url(#islamicPattern_${result.id || Math.random()})" opacity="0.85"/>

      <!-- ARABIC VECTOR CALLIGRAPHY: "ميلاد النبي" -->
      <g transform="translate(835, 105) scale(0.78)">
        <path d="M15 65 C-20 40 -15 0 25 -15 C60 -25 90 5 70 30 C55 45 35 30 45 15" stroke="#ffffff" stroke-width="2.2" fill="none" opacity="0.85" stroke-linecap="round"/>
        <circle cx="45" cy="15" r="3.5" fill="#fef08a" opacity="0.95"/>
        <circle cx="10" cy="70" r="3" fill="#ffffff" opacity="0.85"/>
        <path d="M165 45 C195 20 215 50 190 75 C170 90 150 70 170 50 C180 40 195 50 188 60" stroke="#ffffff" stroke-width="2.2" fill="none" opacity="0.85" stroke-linecap="round"/>
        <circle cx="188" cy="60" r="3.5" fill="#fef08a" opacity="0.95"/>
        <path d="M-15 140 C-45 165 -35 205 0 215 C25 220 15 245 -5 255" stroke="#fef08a" stroke-width="2.2" fill="none" opacity="0.8" stroke-linecap="round"/>
        <path d="M210 160 C245 185 235 225 200 240 C175 250 190 275 210 285" stroke="#fef08a" stroke-width="2.2" fill="none" opacity="0.8" stroke-linecap="round"/>
        <circle cx="215" cy="148" r="3.5" fill="#ffffff" opacity="0.9"/>
        <path d="M10 270 Q95 305 185 265" stroke="#ffffff" stroke-width="2.8" fill="none" opacity="0.85" stroke-linecap="round"/>
        <circle cx="97" cy="292" r="5" fill="#fef08a" opacity="0.95"/>
        <path d="M82 305 Q97 312 112 305" stroke="#fef08a" stroke-width="2" fill="none" opacity="0.85"/>

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
      </g>
    </svg>
  </div>
'''

# Also update cert-content padding in CSS in App.js:
# .cert-content { ... padding: 38px 48px 38px 125px; width: 760px; }

# Find generateBulkCertificates start and replace SVG block
bulk_start = content.find('const certificatesPagesHtml = winnerResults.map(result => {')
if bulk_start != -1:
    wrapper_idx = content.find('<div class="certificate-wrapper">', bulk_start)
    content_idx = content.find('<!-- Content Section -->', wrapper_idx)
    content = content[:wrapper_idx] + new_bulk_svg + '  ' + content[content_idx:]
    print("Bulk cert SVG template updated.")

# Also update single cert JSX modal (~line 14350)
single_modal_start = content.find('id="modalCertificateArea"')
if single_modal_start != -1:
    # Find cert-right-banner or cert-bg-overlay inside modal
    banner_idx = content.find('<div class="cert-right-banner">', single_modal_start)
    if banner_idx == -1:
        banner_idx = content.find('<div class="cert-bg-overlay"', single_modal_start)
    
    cert_content_idx = content.find('<div className="cert-content"', banner_idx)
    if cert_content_idx == -1:
        cert_content_idx = content.find('<div class="cert-content"', banner_idx)

    # JSX version of the SVG overlay
    jsx_svg_overlay = '''<div className="cert-bg-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '1050px', height: '740px', pointerEvents: 'none', zIndex: 1 }}>
    <svg width="1050" height="740" viewBox="0 0 1050 740" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="islamicPattern_single" width="70" height="70" patternUnits="userSpaceOnUse">
          <path d="M35 0 L70 35 L35 70 L0 35 Z" stroke="#0d6e53" strokeWidth="0.8" fill="none" opacity="0.35"/>
          <path d="M0 0 L70 70 M70 0 L0 70" stroke="#0d6e53" strokeWidth="0.8" fill="none" opacity="0.2"/>
          <circle cx="35" cy="35" r="14" stroke="#0d6e53" strokeWidth="0.8" fill="none" opacity="0.25"/>
          <polygon points="35,12 42,27 58,27 44,37 50,53 35,43 20,53 26,37 12,27 28,27" stroke="#0d6e53" strokeWidth="0.6" fill="none" opacity="0.25"/>
        </pattern>

        <linearGradient id="goldGradient_single" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor:'#fef08a',stopOpacity:1}}/>
          <stop offset="25%" style={{stopColor:'#f59e0b',stopOpacity:1}}/>
          <stop offset="65%" style={{stopColor:'#d97706',stopOpacity:1}}/>
          <stop offset="100%" style={{stopColor:'#b45309',stopOpacity:1}}/>
        </linearGradient>

        <linearGradient id="greenGrad_single" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor:'#064e3b',stopOpacity:1}}/>
          <stop offset="100%" style={{stopColor:'#022c22',stopOpacity:1}}/>
        </linearGradient>

        <filter id="shadowFilter_single" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="-2" dy="3" stdDeviation="5" floodColor="#022c22" floodOpacity="0.35"/>
        </filter>
      </defs>

      <rect x="10" y="10" width="1030" height="720" rx="6" stroke="url(#goldGradient_single)" strokeWidth="2.5" fill="none" opacity="0.45"/>

      <path d="M 45 0 L 105 0 L 105 130 L 75 110 L 45 130 Z" fill="url(#greenGrad_single)" filter="url(#shadowFilter_single)"/>
      <path d="M 45 0 L 105 0 L 105 130 L 75 110 L 45 130 Z" fill="url(#islamicPattern_single)" opacity="0.6"/>
      <path d="M 47 0 L 47 125 L 75 106 L 103 125 L 103 0" stroke="url(#goldGradient_single)" strokeWidth="1.8" fill="none" opacity="0.9"/>
      <g transform="translate(75, 62)">
        <polygon points="0,-26 7,-18 18,-18 14,-7 23,2 14,11 18,22 7,22 0,30 -7,22 -18,22 -14,11 -23,2 -14,-7 -18,-18 -7,-18" fill="url(#goldGradient_single)" filter="url(#shadowFilter_single)"/>
        <circle cx="0" cy="2" r="16" fill="#064e3b" stroke="url(#goldGradient_single)" strokeWidth="2"/>
        <circle cx="0" cy="2" r="12" fill="none" stroke="url(#goldGradient_single)" strokeWidth="1.2" opacity="0.8"/>
        <polygon points="0,-7 2,-2 7,-2 3,1 5,6 0,3 -5,6 -3,1 -7,-2 -2,-2" fill="url(#goldGradient_single)"/>
      </g>

      <path d="M 0 635 C 100 635, 160 680, 190 740 L 165 740 C 140 690, 85 648, 0 648 Z" fill="url(#goldGradient_single)" filter="url(#shadowFilter_single)"/>
      <path d="M 0 648 C 85 648, 140 690, 165 740 L 0 740 Z" fill="url(#greenGrad_single)"/>
      <path d="M 0 648 C 85 648, 140 690, 165 740 L 0 740 Z" fill="url(#islamicPattern_single)" opacity="0.7"/>

      <path d="M 700 0 C 600 230, 670 510, 1050 630 L 1050 658 C 640 535, 570 230, 676 0 Z" fill="url(#goldGradient_single)" filter="url(#shadowFilter_single)"/>
      <path d="M 700 0 C 600 230, 670 510, 1050 630 L 1050 740 L 1050 0 Z" fill="url(#greenGrad_single)"/>
      <path d="M 700 0 C 600 230, 670 510, 1050 630 L 1050 740 L 1050 0 Z" fill="url(#islamicPattern_single)" opacity="0.85"/>

      <g transform="translate(835, 105) scale(0.78)">
        <path d="M15 65 C-20 40 -15 0 25 -15 C60 -25 90 5 70 30 C55 45 35 30 45 15" stroke="#ffffff" strokeWidth="2.2" fill="none" opacity="0.85" strokeLinecap="round"/>
        <circle cx="45" cy="15" r="3.5" fill="#fef08a" opacity="0.95"/>
        <circle cx="10" cy="70" r="3" fill="#ffffff" opacity="0.85"/>
        <path d="M165 45 C195 20 215 50 190 75 C170 90 150 70 170 50 C180 40 195 50 188 60" stroke="#ffffff" strokeWidth="2.2" fill="none" opacity="0.85" strokeLinecap="round"/>
        <circle cx="188" cy="60" r="3.5" fill="#fef08a" opacity="0.95"/>
        <path d="M-15 140 C-45 165 -35 205 0 215 C25 220 15 245 -5 255" stroke="#fef08a" strokeWidth="2.2" fill="none" opacity="0.8" strokeLinecap="round"/>
        <path d="M210 160 C245 185 235 225 200 240 C175 250 190 275 210 285" stroke="#fef08a" strokeWidth="2.2" fill="none" opacity="0.8" strokeLinecap="round"/>
        <circle cx="215" cy="148" r="3.5" fill="#ffffff" opacity="0.9"/>
        <path d="M10 270 Q95 305 185 265" stroke="#ffffff" strokeWidth="2.8" fill="none" opacity="0.85" strokeLinecap="round"/>
        <circle cx="97" cy="292" r="5" fill="#fef08a" opacity="0.95"/>
        <path d="M82 305 Q97 312 112 305" stroke="#fef08a" strokeWidth="2" fill="none" opacity="0.85"/>

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
          <path d="M68 132 Q74 125 78 132 Q82 125 86 132" stroke="#ffffff" strokeWidth="3.2" fill="none"/>
          <path d="M72 118 L86 112 L89 116 L75 122 Z"/>
          <path d="M38 135 L50 128 L53 132 L41 139 Z"/>
        </g>
      </g>
    </svg>
  </div>
'''
    content = content[:banner_idx] + jsx_svg_overlay + '\n              ' + content[cert_content_idx:]
    print("Single modal SVG overlay updated.")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("App.js updated successfully.")
