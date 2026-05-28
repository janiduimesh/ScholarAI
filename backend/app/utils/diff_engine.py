import difflib
import html

def compute_word_diff(text_a: str, text_b: str) -> str:
    """
    Compares two texts word-by-word and returns an HTML string 
    highlighting additions (<ins style="background:#d4edda;color:#155724;text-decoration:none;">) 
    and deletions (<del style="background:#f8d7da;color:#721c24;text-decoration:line-through;">).
    """
    words_a = text_a.split()
    words_b = text_b.split()
    
    matcher = difflib.SequenceMatcher(None, words_a, words_b)
    html_diff = []

    for op, i1, i2, j1, j2 in matcher.get_opcodes():
        if op == 'equal':
            # Safe escape and append
            chunk = " ".join(words_a[i1:i2])
            html_diff.append(html.escape(chunk))
        elif op == 'replace':
            # Text deleted
            del_chunk = " ".join(words_a[i1:i2])
            html_diff.append(f'<del style="background:#ffeef0;color:#cf222e;text-decoration:line-through;padding:0 2px;">{html.escape(del_chunk)}</del>')
            # Text added
            ins_chunk = " ".join(words_b[j1:j2])
            html_diff.append(f'<ins style="background:#e6ffec;color:#1a7f37;text-decoration:none;padding:0 2px;">{html.escape(ins_chunk)}</ins>')
        elif op == 'delete':
            del_chunk = " ".join(words_a[i1:i2])
            html_diff.append(f'<del style="background:#ffeef0;color:#cf222e;text-decoration:line-through;padding:0 2px;">{html.escape(del_chunk)}</del>')
        elif op == 'insert':
            ins_chunk = " ".join(words_b[j1:j2])
            html_diff.append(f'<ins style="background:#e6ffec;color:#1a7f37;text-decoration:none;padding:0 2px;">{html.escape(ins_chunk)}</ins>')

    return " ".join(html_diff)
