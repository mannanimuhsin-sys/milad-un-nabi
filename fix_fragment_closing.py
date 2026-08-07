import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('src/App.js', 'r', encoding='utf-8') as f:
    content = f.read()

OLD_END = """                                        <button
                                          type="button"
                                          onClick={generateGroupRegsPDF}
                                          className="btn-premium-action"
                                          style={{
                                            marginTop: '16px',
                                            background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                          }}
                                        >
                                          📄 {lang === 'EN' ? 'Download PDF' : 'PDF ഡൗൺലോഡ് ചെയ്യുക'}
                                        </button>
                                      </>
                                    );"""

NEW_END = """                                        <button
                                          type="button"
                                          onClick={generateGroupRegsPDF}
                                          className="btn-premium-action"
                                          style={{
                                            marginTop: '16px',
                                            background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                          }}
                                        >
                                          📄 {lang === 'EN' ? 'Download PDF' : 'PDF ഡൗൺലോഡ് ചെയ്യുക'}
                                        </button>
                                      </>
                                    )}
                                  </>
                                );"""

if OLD_END in content:
    content = content.replace(OLD_END, NEW_END, 1)
    print("FIXED: Closed outer fragment and ternary expression properly")
else:
    print("TARGET NOT FOUND")

with open('src/App.js', 'w', encoding='utf-8') as f:
    f.write(content)
