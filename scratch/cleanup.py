import re

def main():
    file_path = 'index.html'
    
    # Read the file
    with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()

    # 1. Remove the Admin Modals HTML block
    # Start: <!-- 4. Secure Admin Dashboard Modal
    # End: <!-- Scripts --> (excluding the Scripts comment)
    html_start_marker = '  <!-- 4. Secure Admin Dashboard Modal (Secret Portal) -->'
    html_end_marker = '  <!-- Scripts -->'
    
    start_idx = content.find(html_start_marker)
    end_idx = content.find(html_end_marker)
    
    if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
        print(f"Found HTML block at indices {start_idx} to {end_idx}. Removing...")
        content = content[:start_idx] + content[end_idx:]
    else:
        print("ERROR: HTML markers not found or invalid.")
        return

    # 2. Update shortcut triggers in the JS
    # We will locate the triggers section and replace it.
    old_triggers_pattern = re.compile(
        r'// Double-trigger setup for Admin Modal:.*?// Trigger C: Lock icon in footer.*?openAdminPortal\(\);\s*\}\);\s*\}\);', 
        re.DOTALL
    )
    
    new_triggers = """// Trigger A: Keyboard Shortcut (Ctrl+Shift+A) -> redirect to admin.html
      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
          e.preventDefault();
          window.location.href = 'admin.html';
        }
      });

      // Trigger B: Phone 5-tap on brand logo -> redirect to admin.html
      let tapCount = 0;
      let tapTimer;
      document.getElementById('brandLogo').addEventListener('click', () => {
        tapCount++;
        clearTimeout(tapTimer);
        
        if (tapCount === 5) {
          tapCount = 0;
          window.location.href = 'admin.html';
        } else {
          tapTimer = setTimeout(() => { tapCount = 0; }, 800);
        }
      });

      // Trigger C: Lock icon in footer -> redirect to admin.html
      document.getElementById('secretAdminTrigger').addEventListener('click', () => {
        window.location.href = 'admin.html';
      });
    });"""

    content, count = old_triggers_pattern.subn(new_triggers, content)
    if count > 0:
        print("Successfully updated triggers block.")
    else:
        # Fallback manual string find and replace if regex doesn't match perfectly due to variations
        print("Regex match failed for triggers. Attempting literal search/replace...")
        literal_start = "// Double-trigger setup for Admin Modal:"
        literal_end = "// Trigger C: Lock icon in footer\n      document.getElementById('secretAdminTrigger').addEventListener('click', () => {\n        openAdminPortal();\n      });\n    });"
        
        lit_start_idx = content.find(literal_start)
        lit_end_idx = content.find(literal_end)
        
        if lit_start_idx != -1 and lit_end_idx != -1 and lit_start_idx < lit_end_idx:
            print("Found literal triggers block. Replacing...")
            content = content[:lit_start_idx] + new_triggers + content[lit_end_idx + len(literal_end):]
        else:
            print("ERROR: Literal triggers block not found.")
            return

    # 3. Remove Admin Javascript Controls block
    # Start: // ================= ADMIN PORTAL CONTROLS =================
    # End: </script>\n</body>
    js_start_marker = '    // ================= ADMIN PORTAL CONTROLS ================='
    js_end_marker = '  </script>\n</body>'
    
    js_start_idx = content.find(js_start_marker)
    js_end_idx = content.find(js_end_marker)
    
    if js_start_idx != -1 and js_end_idx != -1 and js_start_idx < js_end_idx:
        print(f"Found Javascript block at indices {js_start_idx} to {js_end_idx}. Removing...")
        content = content[:js_start_idx] + content[js_end_idx:]
    else:
        print("ERROR: JS markers not found or invalid.")
        # Let's try with different line endings
        js_end_marker_crlf = '  </script>\r\n</body>'
        js_end_idx = content.find(js_end_marker_crlf)
        if js_start_idx != -1 and js_end_idx != -1 and js_start_idx < js_end_idx:
            print(f"Found Javascript block (CRLF) at indices {js_start_idx} to {js_end_idx}. Removing...")
            content = content[:js_start_idx] + content[js_end_idx:]
        else:
            print("ERROR: JS markers (CRLF) also not found.")
            return

    # Save the modified file
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("SUCCESS: index.html has been cleaned up and admin components separated!")

if __name__ == '__main__':
    main()
