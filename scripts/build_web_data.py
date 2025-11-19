import os
import json
import hashlib

DATA_DIR = 'data'
OUTPUT_DIR = 'web/public'
POETS_INDEX_FILE = os.path.join(OUTPUT_DIR, 'poets.json')
POET_DATA_DIR = os.path.join(OUTPUT_DIR, 'data/poets')

def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)

def parse_poem(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
    title = ""
    date = ""
    body_start = 0
    
    for i, line in enumerate(lines):
        if line.startswith('title:'):
            title = line[6:].strip()
        elif line.startswith('date:'):
            date = line[5:].strip()
        elif line.strip() == '':
            # Assuming empty line separates metadata from body
            if i + 1 < len(lines):
                body_start = i + 1
                break
    
    body = '\n'.join(lines[body_start:])
    return {
        'title': title,
        'date': date,
        'content': body
    }

def main():
    ensure_dir(POET_DATA_DIR)
    
    poets = []
    used_ids = set()
    
    # Traverse data directory
    # Structure: data/Name_pinyin/poem.pt
    
    for entry in os.listdir(DATA_DIR):
        full_path = os.path.join(DATA_DIR, entry)
        if not os.path.isdir(full_path):
            continue
            
        if '_' not in entry:
            continue
            
        try:
            name, pinyin = entry.split('_', 1)
        except ValueError:
            # Handle cases where directory name might not match expected format exactly
            # or if there are extra underscores. 
            # Based on directory listing, most follow Name_pinyin.
            # Some might be different, let's try to be robust.
            parts = entry.rsplit('_', 1)
            if len(parts) == 2:
                name, pinyin = parts
            else:
                print(f"Skipping malformed directory: {entry}")
                continue

        # Generate ID from pinyin (readable URLs)
        # Handle duplicates by appending index
        base_id = pinyin
        poet_id = base_id
        counter = 1
        
        # We need to check if this ID has already been used.
        # Since we are iterating, we can keep track of used IDs.
        # However, the current structure doesn't easily allow checking against *already processed* 
        # poets without a global set. Let's add one.
        
        # NOTE: Ideally we'd pass a 'used_ids' set to main or keep it here.
        # For simplicity in this script context, we'll assume pinyin is mostly unique 
        # or just handle it if we encounter it.
        # Actually, let's just use the pinyin as is. If there are duplicates in the source 
        # (e.g. two Zhang San), the second one will overwrite the first in the dict 
        # if we don't check. 
        # Given the dataset, let's assume name+pinyin is unique enough, 
        # but to be safe for URLs, let's stick to pinyin.
        
        # To properly handle duplicates we need to know if we've seen this pinyin before.
        # Let's add a set at the top of main loop.
        
        while poet_id in used_ids:
            poet_id = f"{base_id}_{counter}"
            counter += 1
        
        used_ids.add(poet_id)
        
        poet_data = {
            'id': poet_id,
            'name': name,
            'pinyin': pinyin,
            'poems': []
        }
        
        poem_count = 0
        
        for root, dirs, files in os.walk(full_path):
            for file in files:
                if file.endswith('.pt'):
                    poem_path = os.path.join(root, file)
                    try:
                        poem = parse_poem(poem_path)
                        poet_data['poems'].append(poem)
                        poem_count += 1
                    except Exception as e:
                        print(f"Error parsing {poem_path}: {e}")
        
        if poem_count > 0:
            # Write poet detail file
            with open(os.path.join(POET_DATA_DIR, f'{poet_id}.json'), 'w', encoding='utf-8') as f:
                json.dump(poet_data, f, ensure_ascii=False)
            
            # Add to index
            poets.append({
                'id': poet_id,
                'name': name,
                'pinyin': pinyin,
                'poemCount': poem_count
            })
            
            if len(poets) % 1000 == 0:
                print(f"Processed {len(poets)} poets...")

    # Sort poets by pinyin for easier browsing
    poets.sort(key=lambda x: x['pinyin'])
    
    # Write index file
    with open(POETS_INDEX_FILE, 'w', encoding='utf-8') as f:
        json.dump(poets, f, ensure_ascii=False)
        
    # Generate Poems Index for Search
    print("Generating poems index...")
    all_poems = []
    for poet in poets:
        # Read the poet data file to get poems
        poet_file = os.path.join(POET_DATA_DIR, f"{poet['id']}.json")
        if os.path.exists(poet_file):
            with open(poet_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for i, poem in enumerate(data['poems']):
                    all_poems.append({
                        't': poem['title'],      # Title
                        'p': poet['name'],       # Poet Name
                        'i': poet['id'],         # Poet ID
                        'x': i                   # Index in poet's poem list
                    })
    
    POEMS_INDEX_FILE = os.path.join(OUTPUT_DIR, 'poems.json')
    with open(POEMS_INDEX_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_poems, f, ensure_ascii=False)

    print(f"Done! Processed {len(poets)} poets and {len(all_poems)} poems.")

if __name__ == '__main__':
    main()
