import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('src/App.js', 'r', encoding='utf-8') as f:
    content = f.read()

OLD_FRAGMENT_START = """                                        {displayedGroupRegs.length === 0 ? (
                                          <p style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                                            {lang === 'EN' ? 'No group registrations found matching selected filter.' : 'തിരഞ്ഞെടുത്ത ഫിൽട്ടറിന് അനുയോജ്യമായ ഗ്രൂപ്പ് രജിസ്ട്രേഷനുകൾ ഒന്നും കണ്ടെത്തിയില്ല.'}
                                          </p>
                                        ) : (
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>"""

NEW_FRAGMENT_START = """                                        {displayedGroupRegs.length === 0 ? (
                                          <p style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                                            {lang === 'EN' ? 'No group registrations found matching selected filter.' : 'തിരഞ്ഞെടുത്ത ഫിൽട്ടറിന് അനുയോജ്യമായ ഗ്രൂപ്പ് രജിസ്ട്രേഷനുകൾ ഒന്നും കണ്ടെത്തിയില്ല.'}
                                          </p>
                                        ) : (
                                          <>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>"""

if OLD_FRAGMENT_START in content:
    content = content.replace(OLD_FRAGMENT_START, NEW_FRAGMENT_START, 1)
    print("FIXED: Added missing <> fragment tag")
else:
    print("TARGET NOT FOUND")

with open('src/App.js', 'w', encoding='utf-8') as f:
    f.write(content)
