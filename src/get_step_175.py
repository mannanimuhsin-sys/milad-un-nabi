import json

log_path = r"C:\Users\ccuse\.gemini\antigravity-ide\brain\3ee4dbb7-6dae-48d6-b555-368e4293c3cf\.system_generated\logs\transcript.jsonl"

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            step = data.get('step_index')
            if step == 68:
                print("Found step 68!")
                tool_calls = data.get('tool_calls', [])
                if tool_calls:
                    args = tool_calls[0].get('args', {})
                    repl = args.get('ReplacementContent', '')
                    print(f"ReplacementContent length: {len(repl)}")
                    # Write to file
                    with open("step_68_repl.txt", "w", encoding="utf-8") as out_f:
                        out_f.write(repl)
                    print("Written replacement content to step_68_repl.txt")
        except Exception as e:
            pass
