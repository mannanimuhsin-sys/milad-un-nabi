import json

log_path = r"C:\Users\ccuse\.gemini\antigravity-ide\brain\3ee4dbb7-6dae-48d6-b555-368e4293c3cf\.system_generated\logs\transcript.jsonl"
target_steps = [68, 74, 82, 90]

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            step = data.get('step_index')
            if step in target_steps:
                out_path = f"step_{step}.json"
                with open(out_path, 'w', encoding='utf-8') as out_f:
                    json.dump(data.get('tool_calls'), out_f, indent=2)
                print(f"Dumped Step {step} to {out_path}")
        except Exception as e:
            pass
