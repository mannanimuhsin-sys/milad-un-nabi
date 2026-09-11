"""
Fix the broken quiz render structure in App.js.

The problem:
- Lines 21664-21782 contain orphaned/broken JSX content
- Line 21664 has </>  (premature fragment close followed by orphaned content)
- Lines 21665-21782 are duplicate SUBMITTED block (already moved to top-level)
- Lines 21783-21785 close the card div correctly

The fix:
- Replace lines 21664-21782 with the correct closing tags:
    </> (close {quizStudentStep !== 'SUBMITTED' && (<>)
    )} (close {quizStudentStep !== 'SUBMITTED' && (

Then lines 21783-21785 already have:
    </div>   <- closes card
    );
    })()}    <- closes IIFE

So the final structure becomes:
    ...ANSWERING STEP content...
                    })()}               <- closes ANSWERING IIFE (line 21660)
                  </div>                <- closes {activeQuiz && (<div>  (line 21662)
                )}                      <- closes {activeQuiz && (  (line 21663)
              </>                       <- closes <> of quizStudentStep!==SUBMITTED (NEW)
            )}                          <- closes {quizStudentStep!=='SUBMITTED' && ( (NEW)
              </div>                    <- closes card div (was 21783)
            );                          <- closes return ( (was 21784)
          })()}                         <- closes outer IIFE (was 21785)
"""

with open(r'd:\MILAD UN NABI\milad\src\App.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Total lines before fix: {len(lines)}")

# Lines to replace (0-indexed: 21663 to 21781 inclusive)
# i.e. lines 21664 to 21782 in 1-indexed
start_idx = 21663  # 0-indexed (= line 21664)
end_idx = 21782    # 0-indexed (= line 21782), exclusive end will be end_idx

# Verify what's there
print(f"Line 21664 (0-idx 21663): {repr(lines[21663][:60])}")
print(f"Line 21665 (0-idx 21664): {repr(lines[21664][:60])}")
print(f"Line 21783 (0-idx 21782): {repr(lines[21782][:60])}")
print(f"Line 21784 (0-idx 21783): {repr(lines[21783][:60])}")
print(f"Line 21785 (0-idx 21784): {repr(lines[21784][:60])}")

# The replacement for lines 21664-21782 (0-indexed 21663 to 21781):
replacement = [
    '              </>\n',
    '            )}\n',
]

# Splice: keep lines before 21663, add replacement, then keep from 21782 onward
new_lines = lines[:start_idx] + replacement + lines[end_idx:]

print(f"Total lines after fix: {len(new_lines)}")
print(f"New line at old position 21664: {repr(new_lines[21663][:60])}")
print(f"New line at old position 21665: {repr(new_lines[21664][:60])}")
print(f"New line at old position 21666: {repr(new_lines[21665][:60])}")

with open(r'd:\MILAD UN NABI\milad\src\App.js', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Done! File written successfully.")
