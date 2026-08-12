import re

def update_app_js():
    with open(r'd:\MILAD UN NABI\milad\src\App.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # --- HTML SVG Snippet for template literals (place 1 and 2) ---
    def get_html_banner(suffix):
        pat_id = f"islamicPattern_{suffix}"
        ferrule_id = f"ferruleGrad_{suffix}"
        return f'''    <svg width="380" height="740" viewBox="0 0 380 740" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="{pat_id}" width="70" height="70" patternUnits="userSpaceOnUse">
          <path d="M35 0 L70 35 L35 70 L0 35 Z" stroke="#0d6e53" stroke-width="0.8" fill="none" opacity="0.35"/>
          <path d="M0 0 L70 70 M70 0 L0 70" stroke="#0d6e53" stroke-width="0.8" fill="none" opacity="0.2"/>
          <circle cx="35" cy="35" r="14" stroke="#0d6e53" stroke-width="0.8" fill="none" opacity="0.25"/>
          <polygon points="35,12 42,27 58,27 44,37 50,53 35,43 20,53 26,37 12,27 28,27" stroke="#0d6e53" stroke-width="0.6" fill="none" opacity="0.25"/>
        </pattern>
        <linearGradient id="{ferrule_id}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#94a3b8"/>
          <stop offset="50%" style="stop-color:#f1f5f9"/>
          <stop offset="100%" style="stop-color:#64748b"/>
        </linearGradient>
      </defs>
      
      <!-- Green Polygon Cut Path -->
      <path d="M120 0 L380 0 L380 740 L290 740 L230 540 L270 510 L160 360 L120 0 Z" fill="#064e3b" />
      <path d="M120 0 L380 0 L380 740 L290 740 L230 540 L270 510 L160 360 L120 0 Z" fill="url(#{pat_id})" opacity="0.8" />
      <path d="M120 0 L160 360 L270 510 L230 540 L290 740" stroke="#022c22" stroke-width="4" fill="none"/>

      <!-- WHITE MILAD FEST LOGO (TOP RIGHT) -->
      <g transform="translate(195, 40)">
        <path d="M 90 20 C 45 20 15 55 15 100 C 15 145 45 180 90 180 C 65 170 42 142 42 100 C 42 58 65 30 90 20 Z" fill="#ffffff"/>
        <path d="M 68 85 C 68 62 82 52 90 48 C 98 52 112 62 112 85 Z" fill="#ffffff"/>
        <path d="M 90 41 C 88 41 87 42 87 44 C 87 46 89 47 90 47 C 91 47 93 46 93 44 C 93 42 92 41 90 41 Z M 90 38 L 90 41" stroke="#ffffff" stroke-width="1.8" fill="none"/>
        <path d="M 52 95 L 52 75 L 56 68 L 60 75 L 60 95 Z" fill="#ffffff"/>
        <rect x="54" y="62" width="4" height="6" fill="#ffffff"/>
        <path d="M 120 95 L 120 75 L 124 68 L 128 75 L 128 95 Z" fill="#ffffff"/>
        <rect x="122" y="62" width="4" height="6" fill="#ffffff"/>
        <path d="M 50 95 L 130 95 L 130 120 L 50 120 Z" fill="#ffffff"/>
        <path d="M 83 120 L 83 104 C 83 100 97 100 97 104 L 97 120 Z" fill="#064e3b"/>
        <path d="M 62 120 L 62 108 C 62 105 73 105 73 108 L 73 120 Z" fill="#064e3b"/>
        <path d="M 107 120 L 107 108 C 107 105 118 105 118 108 L 118 120 Z" fill="#064e3b"/>
        <text x="90" y="156" text-anchor="middle" fill="#ffffff" font-family="'Inter', sans-serif" font-weight="900" font-size="18" letter-spacing="1.4">MILAD FEST</text>
      </g>

      <!-- ARTISTIC PAINT BRUSHES & WATERCOLOR SPLASH -->
      <g transform="translate(160, 290)">
        <g opacity="0.85">
          <path d="M 70 170 C 10 110, -20 210, 20 290 C 50 350, 130 390, 180 310 C 220 240, 150 140, 70 170 Z" fill="#0d6e53" opacity="0.35"/>
          <path d="M 90 130 C 30 70, 10 190, 60 250 C 110 310, 200 270, 170 170 C 150 110, 120 100, 90 130 Z" fill="#047857" opacity="0.45"/>
          <path d="M 30 210 C -30 170, -20 270, 40 330 C 100 380, 160 350, 130 270 C 100 210, 60 220, 30 210 Z" fill="#10b981" opacity="0.3"/>
          <circle cx="15" cy="130" r="3.5" fill="#6ee7b7"/>
          <circle cx="10" cy="155" r="2.5" fill="#34d399"/>
          <circle cx="30" cy="100" r="4.5" fill="#10b981"/>
          <circle cx="0" cy="200" r="3" fill="#059669"/>
          <circle cx="-15" cy="240" r="5" fill="#6ee7b7"/>
          <circle cx="-10" cy="275" r="3" fill="#34d399"/>
          <circle cx="20" cy="340" r="3.5" fill="#10b981"/>
          <circle cx="55" cy="370" r="4.5" fill="#059669"/>
          <circle cx="100" cy="400" r="3" fill="#6ee7b7"/>
          <circle cx="135" cy="380" r="3.5" fill="#34d399"/>
          <circle cx="170" cy="350" r="2.5" fill="#10b981"/>
          <circle cx="195" cy="300" r="4" fill="#059669"/>
          <circle cx="205" cy="250" r="3" fill="#6ee7b7"/>
        </g>

        <g transform="rotate(-10, 100, 250)">
          <!-- Brush 1: Flat Wash Brush (Left) -->
          <g transform="translate(20, 30) rotate(-10)">
            <path d="M 30 180 L 44 180 L 40 390 L 34 390 Z" fill="#143023" stroke="#064e3b" stroke-width="1"/>
            <rect x="27" y="130" width="18" height="50" rx="2" fill="url(#{ferrule_id})"/>
            <line x1="27" y1="145" x2="45" y2="145" stroke="#475569" stroke-width="1"/>
            <line x1="27" y1="160" x2="45" y2="160" stroke="#475569" stroke-width="1"/>
            <path d="M 25 45 L 47 45 L 45 130 L 27 130 Z" fill="#064e3b"/>
            <path d="M 25 45 L 47 45 L 46 75 L 26 75 Z" fill="#047857"/>
            <path d="M 25 45 L 47 45 L 47 58 L 25 58 Z" fill="#34d399" opacity="0.85"/>
            <line x1="30" y1="48" x2="31" y2="128" stroke="#022c22" stroke-width="0.8" opacity="0.6"/>
            <line x1="36" y1="48" x2="36" y2="128" stroke="#6ee7b7" stroke-width="0.8" opacity="0.6"/>
            <line x1="42" y1="48" x2="41" y2="128" stroke="#022c22" stroke-width="0.8" opacity="0.6"/>
          </g>

          <!-- Brush 2: Medium Round Brush (Center) -->
          <g transform="translate(70, 10) rotate(4)">
            <path d="M 34 190 L 42 190 L 40 410 L 36 410 Z" fill="#0f291e" stroke="#064e3b" stroke-width="1"/>
            <path d="M 32 140 L 44 140 L 42 190 L 34 190 Z" fill="url(#{ferrule_id})"/>
            <line x1="33" y1="155" x2="43" y2="155" stroke="#475569" stroke-width="1"/>
            <line x1="33" y1="170" x2="43" y2="170" stroke="#475569" stroke-width="1"/>
            <path d="M 38 35 C 30 65, 30 105, 32 140 L 44 140 C 46 105, 46 65, 38 35 Z" fill="#047857"/>
            <path d="M 38 35 C 33 55, 32 75, 33 95 L 43 95 C 44 75, 43 55, 38 35 Z" fill="#10b981"/>
            <path d="M 38 35 C 35 48, 34 60, 35 70 L 41 70 C 42 60, 41 48, 38 35 Z" fill="#6ee7b7"/>
          </g>

          <!-- Brush 3: Fine Detail Brush (Right) -->
          <g transform="translate(110, 50) rotate(14)">
            <path d="M 28 170 L 34 170 L 32 380 L 30 380 Z" fill="#0d241a" stroke="#064e3b" stroke-width="0.8"/>
            <rect x="27" y="130" width="8" height="40" rx="1" fill="url(#{ferrule_id})"/>
            <line x1="27" y1="145" x2="35" y2="145" stroke="#475569" stroke-width="0.8"/>
            <path d="M 31 55 C 26 80, 26 105, 27 130 L 35 130 C 36 105, 36 80, 31 55 Z" fill="#047857"/>
            <path d="M 31 55 C 28 70, 27 85, 28 100 L 34 100 C 35 85, 34 70, 31 55 Z" fill="#34d399"/>
          </g>
        </g>
      </g>
    </svg>'''

    # --- JSX SVG Snippet for React component (place 3) ---
    jsx_banner = '''                  <svg width="380" height="740" viewBox="0 0 380 740" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="islamicPattern_modal" width="70" height="70" patternUnits="userSpaceOnUse">
                        <path d="M35 0 L70 35 L35 70 L0 35 Z" stroke="#0d6e53" strokeWidth="0.8" fill="none" opacity="0.35"/>
                        <path d="M0 0 L70 70 M70 0 L0 70" stroke="#0d6e53" strokeWidth="0.8" fill="none" opacity="0.2"/>
                        <circle cx="35" cy="35" r="14" stroke="#0d6e53" strokeWidth="0.8" fill="none" opacity="0.25"/>
                        <polygon points="35,12 42,27 58,27 44,37 50,53 35,43 20,53 26,37 12,27 28,27" stroke="#0d6e53" strokeWidth="0.6" fill="none" opacity="0.25"/>
                      </pattern>
                      <linearGradient id="ferruleGrad_modal" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{ stopColor: '#94a3b8' }}/>
                        <stop offset="50%" style={{ stopColor: '#f1f5f9' }}/>
                        <stop offset="100%" style={{ stopColor: '#64748b' }}/>
                      </linearGradient>
                    </defs>
                    
                    <path d="M120 0 L380 0 L380 740 L290 740 L230 540 L270 510 L160 360 L120 0 Z" fill="#064e3b" />
                    <path d="M120 0 L380 0 L380 740 L290 740 L230 540 L270 510 L160 360 L120 0 Z" fill="url(#islamicPattern_modal)" opacity="0.8" />
                    <path d="M120 0 L160 360 L270 510 L230 540 L290 740" stroke="#022c22" strokeWidth="4" fill="none"/>

                    {/* WHITE MILAD FEST LOGO (TOP RIGHT) */}
                    <g transform="translate(195, 40)">
                      <path d="M 90 20 C 45 20 15 55 15 100 C 15 145 45 180 90 180 C 65 170 42 142 42 100 C 42 58 65 30 90 20 Z" fill="#ffffff"/>
                      <path d="M 68 85 C 68 62 82 52 90 48 C 98 52 112 62 112 85 Z" fill="#ffffff"/>
                      <path d="M 90 41 C 88 41 87 42 87 44 C 87 46 89 47 90 47 C 91 47 93 46 93 44 C 93 42 92 41 90 41 Z M 90 38 L 90 41" stroke="#ffffff" strokeWidth="1.8" fill="none"/>
                      <path d="M 52 95 L 52 75 L 56 68 L 60 75 L 60 95 Z" fill="#ffffff"/>
                      <rect x="54" y="62" width="4" height="6" fill="#ffffff"/>
                      <path d="M 120 95 L 120 75 L 124 68 L 128 75 L 128 95 Z" fill="#ffffff"/>
                      <rect x="122" y="62" width="4" height="6" fill="#ffffff"/>
                      <path d="M 50 95 L 130 95 L 130 120 L 50 120 Z" fill="#ffffff"/>
                      <path d="M 83 120 L 83 104 C 83 100 97 100 97 104 L 97 120 Z" fill="#064e3b"/>
                      <path d="M 62 120 L 62 108 C 62 105 73 105 73 108 L 73 120 Z" fill="#064e3b"/>
                      <path d="M 107 120 L 107 108 C 107 105 118 105 118 108 L 118 120 Z" fill="#064e3b"/>
                      <text x="90" y="156" textAnchor="middle" fill="#ffffff" fontFamily="'Inter', sans-serif" fontWeight="900" fontSize="18" letterSpacing="1.4">MILAD FEST</text>
                    </g>

                    {/* ARTISTIC PAINT BRUSHES & WATERCOLOR SPLASH */}
                    <g transform="translate(160, 290)">
                      <g opacity="0.85">
                        <path d="M 70 170 C 10 110, -20 210, 20 290 C 50 350, 130 390, 180 310 C 220 240, 150 140, 70 170 Z" fill="#0d6e53" opacity="0.35"/>
                        <path d="M 90 130 C 30 70, 10 190, 60 250 C 110 310, 200 270, 170 170 C 150 110, 120 100, 90 130 Z" fill="#047857" opacity="0.45"/>
                        <path d="M 30 210 C -30 170, -20 270, 40 330 C 100 380, 160 350, 130 270 C 100 210, 60 220, 30 210 Z" fill="#10b981" opacity="0.3"/>
                        <circle cx="15" cy="130" r="3.5" fill="#6ee7b7"/>
                        <circle cx="10" cy="155" r="2.5" fill="#34d399"/>
                        <circle cx="30" cy="100" r="4.5" fill="#10b981"/>
                        <circle cx="0" cy="200" r="3" fill="#059669"/>
                        <circle cx="-15" cy="240" r="5" fill="#6ee7b7"/>
                        <circle cx="-10" cy="275" r="3" fill="#34d399"/>
                        <circle cx="20" cy="340" r="3.5" fill="#10b981"/>
                        <circle cx="55" cy="370" r="4.5" fill="#059669"/>
                        <circle cx="100" cy="400" r="3" fill="#6ee7b7"/>
                        <circle cx="135" cy="380" r="3.5" fill="#34d399"/>
                        <circle cx="170" cy="350" r="2.5" fill="#10b981"/>
                        <circle cx="195" cy="300" r="4" fill="#059669"/>
                        <circle cx="205" cy="250" r="3" fill="#6ee7b7"/>
                      </g>

                      <g transform="rotate(-10, 100, 250)">
                        <g transform="translate(20, 30) rotate(-10)">
                          <path d="M 30 180 L 44 180 L 40 390 L 34 390 Z" fill="#143023" stroke="#064e3b" strokeWidth="1"/>
                          <rect x="27" y="130" width="18" height="50" rx="2" fill="url(#ferruleGrad_modal)"/>
                          <line x1="27" y1="145" x2="45" y2="145" stroke="#475569" strokeWidth="1"/>
                          <line x1="27" y1="160" x2="45" y2="160" stroke="#475569" strokeWidth="1"/>
                          <path d="M 25 45 L 47 45 L 45 130 L 27 130 Z" fill="#064e3b"/>
                          <path d="M 25 45 L 47 45 L 46 75 L 26 75 Z" fill="#047857"/>
                          <path d="M 25 45 L 47 45 L 47 58 L 25 58 Z" fill="#34d399" opacity="0.85"/>
                          <line x1="30" y1="48" x2="31" y2="128" stroke="#022c22" strokeWidth="0.8" opacity="0.6"/>
                          <line x1="36" y1="48" x2="36" y2="128" stroke="#6ee7b7" strokeWidth="0.8" opacity="0.6"/>
                          <line x1="42" y1="48" x2="41" y2="128" stroke="#022c22" strokeWidth="0.8" opacity="0.6"/>
                        </g>

                        <g transform="translate(70, 10) rotate(4)">
                          <path d="M 34 190 L 42 190 L 40 410 L 36 410 Z" fill="#0f291e" stroke="#064e3b" strokeWidth="1"/>
                          <path d="M 32 140 L 44 140 L 42 190 L 34 190 Z" fill="url(#ferruleGrad_modal)"/>
                          <line x1="33" y1="155" x2="43" y2="155" stroke="#475569" strokeWidth="1"/>
                          <line x1="33" y1="170" x2="43" y2="170" stroke="#475569" strokeWidth="1"/>
                          <path d="M 38 35 C 30 65, 30 105, 32 140 L 44 140 C 46 105, 46 65, 38 35 Z" fill="#047857"/>
                          <path d="M 38 35 C 33 55, 32 75, 33 95 L 43 95 C 44 75, 43 55, 38 35 Z" fill="#10b981"/>
                          <path d="M 38 35 C 35 48, 34 60, 35 70 L 41 70 C 42 60, 41 48, 38 35 Z" fill="#6ee7b7"/>
                        </g>

                        <g transform="translate(110, 50) rotate(14)">
                          <path d="M 28 170 L 34 170 L 32 380 L 30 380 Z" fill="#0d241a" stroke="#064e3b" strokeWidth="0.8"/>
                          <rect x="27" y="130" width="8" height="40" rx="1" fill="url(#ferruleGrad_modal)"/>
                          <line x1="27" y1="145" x2="35" y2="145" stroke="#475569" strokeWidth="0.8"/>
                          <path d="M 31 55 C 26 80, 26 105, 27 130 L 35 130 C 36 105, 36 80, 31 55 Z" fill="#047857"/>
                          <path d="M 31 55 C 28 70, 27 85, 28 100 L 34 100 C 35 85, 34 70, 31 55 Z" fill="#34d399"/>
                        </g>
                      </g>
                    </g>
                  </svg>'''

    # Place 1: generateBulkCertificates
    pattern1 = r'<svg width="380" height="740" viewBox="0 0 380 740".*?</svg>'
    
    # We will find matches for `<svg width="380" height="740"...`
    matches = list(re.finditer(pattern1, content, flags=re.DOTALL))
    print(f"Found {len(matches)} SVG banner matches.")

    if len(matches) >= 3:
        m1 = matches[0]
        m2 = matches[1]
        m3 = matches[2]

        new_html1 = get_html_banner("${result.id || Math.random()}")
        new_html2 = get_html_banner("single")
        new_jsx3 = jsx_banner

        # Reconstruct content from back to front
        content = content[:m3.start()] + new_jsx3 + content[m3.end():]
        content = content[:m2.start()] + new_html2 + content[m2.end():]
        content = content[:m1.start()] + new_html1 + content[m1.end():]

        with open(r'd:\MILAD UN NABI\milad\src\App.js', 'w', encoding='utf-8') as f:
            f.write(content)
        print("SUCCESSFULLY REPLACED ALL 3 CERTIFICATE BANNERS IN App.js!")
    else:
        print("Error: Could not find all 3 SVG banner blocks.")

if __name__ == '__main__':
    update_app_js()
