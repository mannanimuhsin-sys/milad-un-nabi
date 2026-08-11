import sys
sys.stdout.reconfigure(encoding='utf-8')

file_path = r'd:\MILAD UN NABI\milad\src\App.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# -------------------------------------------------------------
# 1. BULK CERTIFICATE TEMPLATE IN APP.JS
# -------------------------------------------------------------
bulk_start_marker = 'const certificatesPagesHtml = winnerResults.map(result => {'
bulk_start_idx = content.find(bulk_start_marker)

if bulk_start_idx != -1:
    wrapper_start = content.find('<div class="certificate-wrapper"', bulk_start_idx)
    content_start = content.find('<!-- Content Section -->', wrapper_start)
    if wrapper_start != -1 and content_start != -1:
        new_bulk_banner = '''<div class="certificate-wrapper" style="position:relative; width:1050px; height:740px; background:#ffffff; overflow:hidden; page-break-after:always; margin:0 auto 40px auto; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
  <!-- Right Green Polygon Banner with App Logo Watermark -->
  <div class="cert-right-banner" style="position:absolute; top:0; right:0; width:380px; height:740px; pointer-events:none; z-index:1;">
    <svg width="380" height="740" viewBox="0 0 380 740" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="islamicPattern_${result.id || Math.random()}" width="70" height="70" patternUnits="userSpaceOnUse">
          <path d="M35 0 L70 35 L35 70 L0 35 Z" stroke="#0d6e53" stroke-width="0.8" fill="none" opacity="0.35"/>
          <path d="M0 0 L70 70 M70 0 L0 70" stroke="#0d6e53" stroke-width="0.8" fill="none" opacity="0.2"/>
          <circle cx="35" cy="35" r="14" stroke="#0d6e53" stroke-width="0.8" fill="none" opacity="0.25"/>
          <polygon points="35,12 42,27 58,27 44,37 50,53 35,43 20,53 26,37 12,27 28,27" stroke="#0d6e53" stroke-width="0.6" fill="none" opacity="0.25"/>
        </pattern>
      </defs>

      <!-- Green Polygon Cut Banner -->
      <path d="M120 0 L380 0 L380 740 L290 740 L230 540 L270 510 L160 360 L120 0 Z" fill="#064e3b" />
      <path d="M120 0 L380 0 L380 740 L290 740 L230 540 L270 510 L160 360 L120 0 Z" fill="url(#islamicPattern_${result.id || Math.random()})" opacity="0.8" />
      <path d="M120 0 L160 360 L270 510 L230 540 L290 740" stroke="#022c22" stroke-width="4" fill="none"/>

      <!-- LIGHT WATERMARK OF APP LOGO INSIDE GREEN BANNER -->
      <g transform="translate(195, 120)">
        <circle cx="75" cy="75" r="85" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.35"/>
        <circle cx="75" cy="75" r="77" stroke="#fef08a" stroke-width="1.5" fill="none" opacity="0.3"/>
        <circle cx="75" cy="75" r="69" stroke="#ffffff" stroke-width="1" stroke-dasharray="4 4" fill="none" opacity="0.4"/>
        <image href="${logoUrl}" x="10" y="10" width="130" height="130" opacity="0.4" />
      </g>
    </svg>
  </div>
  '''
        content = content[:wrapper_start] + new_bulk_banner + content[content_start:]
        print("Bulk cert watermark updated.")

# -------------------------------------------------------------
# 2. SINGLE MODAL PREVIEW TEMPLATE IN APP.JS
# -------------------------------------------------------------
modal_print_marker = 'const handleModalPrint = () => {'
modal_print_idx = content.find(modal_print_marker)
if modal_print_idx != -1:
    modal_wrapper_start = content.find('<div class="certificate-wrapper"', modal_print_idx)
    modal_content_start = content.find('<div class="cert-content"', modal_wrapper_start)
    if modal_wrapper_start != -1 and modal_content_start != -1:
        new_modal_banner = '''<div class="certificate-wrapper" id="certificateArea">
  <div class="cert-right-banner">
    <svg width="380" height="740" viewBox="0 0 380 740" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="islamicPattern_single" width="70" height="70" patternUnits="userSpaceOnUse">
          <path d="M35 0 L70 35 L35 70 L0 35 Z" stroke="#0d6e53" stroke-width="0.8" fill="none" opacity="0.35"/>
          <path d="M0 0 L70 70 M70 0 L0 70" stroke="#0d6e53" stroke-width="0.8" fill="none" opacity="0.2"/>
          <circle cx="35" cy="35" r="14" stroke="#0d6e53" stroke-width="0.8" fill="none" opacity="0.25"/>
          <polygon points="35,12 42,27 58,27 44,37 50,53 35,43 20,53 26,37 12,27 28,27" stroke="#0d6e53" stroke-width="0.6" fill="none" opacity="0.25"/>
        </pattern>
      </defs>

      <path d="M120 0 L380 0 L380 740 L290 740 L230 540 L270 510 L160 360 L120 0 Z" fill="#064e3b" />
      <path d="M120 0 L380 0 L380 740 L290 740 L230 540 L270 510 L160 360 L120 0 Z" fill="url(#islamicPattern_single)" opacity="0.8" />
      <path d="M120 0 L160 360 L270 510 L230 540 L290 740" stroke="#022c22" stroke-width="4" fill="none"/>

      <!-- LIGHT WATERMARK OF APP LOGO INSIDE GREEN BANNER -->
      <g transform="translate(195, 120)">
        <circle cx="75" cy="75" r="85" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.35"/>
        <circle cx="75" cy="75" r="77" stroke="#fef08a" stroke-width="1.5" fill="none" opacity="0.3"/>
        <circle cx="75" cy="75" r="69" stroke="#ffffff" stroke-width="1" stroke-dasharray="4 4" fill="none" opacity="0.4"/>
        <image href="${logoUrl}" x="10" y="10" width="130" height="130" opacity="0.4" />
      </g>
    </svg>
  </div>
  '''
        content = content[:modal_wrapper_start] + new_modal_banner + content[modal_content_start:]
        print("Single modal print template updated.")

# -------------------------------------------------------------
# 3. REACT JSX MODAL VIEWPORT IN APP.JS
# -------------------------------------------------------------
modal_area_marker = 'id="modalCertificateArea"'
modal_area_idx = content.find(modal_area_marker)
if modal_area_idx != -1:
    jsx_banner_start = content.find('<div style={{ position: \'absolute\', top: 0, right: 0, width: \'380px\'', modal_area_idx)
    if jsx_banner_start == -1:
        jsx_banner_start = content.find('<div style={{ position: \'absolute\', top: 0, left: 0, width: \'1050px\'', modal_area_idx)
    
    jsx_content_start = content.find('<div className="cert-content"', modal_area_idx)
    if jsx_content_start == -1:
        jsx_content_start = content.find('<div class="cert-content"', modal_area_idx)

    if jsx_banner_start != -1 and jsx_content_start != -1:
        new_jsx_banner = '''<div style={{ position: 'absolute', top: 0, right: 0, width: '380px', height: '740px', pointerEvents: 'none', zIndex: 1 }}>
                  <svg width="380" height="740" viewBox="0 0 380 740" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="islamicPattern_modal" width="70" height="70" patternUnits="userSpaceOnUse">
                        <path d="M35 0 L70 35 L35 70 L0 35 Z" stroke="#0d6e53" strokeWidth="0.8" fill="none" opacity="0.35"/>
                        <path d="M0 0 L70 70 M70 0 L0 70" stroke="#0d6e53" strokeWidth="0.8" fill="none" opacity="0.2"/>
                        <circle cx="35" cy="35" r="14" stroke="#0d6e53" strokeWidth="0.8" fill="none" opacity="0.25"/>
                        <polygon points="35,12 42,27 58,27 44,37 50,53 35,43 20,53 26,37 12,27 28,27" stroke="#0d6e53" strokeWidth="0.6" fill="none" opacity="0.25"/>
                      </pattern>
                    </defs>

                    <path d="M120 0 L380 0 L380 740 L290 740 L230 540 L270 510 L160 360 L120 0 Z" fill="#064e3b" />
                    <path d="M120 0 L380 0 L380 740 L290 740 L230 540 L270 510 L160 360 L120 0 Z" fill="url(#islamicPattern_modal)" opacity="0.8" />
                    <path d="M120 0 L160 360 L270 510 L230 540 L290 740" stroke="#022c22" strokeWidth="4" fill="none"/>

                    {/* LIGHT WATERMARK OF APP LOGO INSIDE GREEN BANNER */}
                    <g transform="translate(195, 120)">
                      <circle cx="75" cy="75" r="85" stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.35"/>
                      <circle cx="75" cy="75" r="77" stroke="#fef08a" strokeWidth="1.5" fill="none" opacity="0.3"/>
                      <circle cx="75" cy="75" r="69" stroke="#ffffff" strokeWidth="1" strokeDasharray="4 4" fill="none" opacity="0.4"/>
                      <image href={logoUrl || 'public/logo192.png'} x="10" y="10" width="130" height="130" opacity="0.4" />
                    </g>
                  </svg>
                </div>
                '''
        content = content[:jsx_banner_start] + new_jsx_banner + content[jsx_content_start:]
        print("JSX modal viewport banner updated.")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("App.js updated with App Logo Watermark!")
