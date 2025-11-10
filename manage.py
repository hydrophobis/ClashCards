import json
import sys
from pathlib import Path

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(data, path):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def apply_transform(obj, rules):
    result = {}
    for key, value in obj.items():
        if key in rules.get("rename", {}):
            new_key = rules["rename"][key]
            result[new_key] = value
        elif key in rules.get("remove", []):
            continue
        else:
            result[key] = value

    for key, val in rules.get("add", {}).items():
        if key not in result:
            result[key] = val

    for key, expr in rules.get("modify", {}).items():
        try:
            result[key] = eval(expr, {}, {"value": result.get(key), "obj": result})
        except Exception as e:
            print(f"Error modifying {key}: {e}")

    return result

def transform_cards(input_file, config_file, output_file):
    data = load_json(input_file)
    rules = load_json(config_file)
    transformed = [apply_transform(obj, rules) for obj in data]
    save_json(transformed, output_file)
    print(f"Transformed {len(transformed)} cards → {output_file}")

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python transform_cards.py input.json rules.json output.json")
        sys.exit(1)

    transform_cards(Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3]))
