import re

def strip_emojis(text):
    # List of specific emojis observed in the file to remove
    # This is safer than a broad regex that might catch German characters
    emojis = [
        '🎓', '🇩🇪', '🔄', '🏛️', '🇵🇰', '🇮🇳', '🇧🇩', '🇳🇬', '🇰🇪', '🇪🇬', '🇻🇳', 
        '🇮🇩', '🇹🇷', '🇮🇷', '🇨🇳', '🇺🇸', '🇬🇧', '🇨🇦', '🇷🇺', '✨', '✅', '🤖', 
        '🔎', '📋', '🔧', '🗄️', '💰', '✈️', '👥', '🔔', '👑', '📄', '🔍', 
        '🏗️', '🧠', '🔐', '📡', '🚀', '🐳', '📊', '📚', '📝', '❤️', '⚠️',
        '🎉', '👋', '👤', '🌐', '💼', '💶', '🛠️'
    ]
    # Also removing the space after emoji if it exists and leaves a double space?
    # For now just direct replacement.
    for emoji in emojis:
        text = text.replace(emoji, '')
    return text

def update_content(text):
    # 1. Strip Emojis
    text = strip_emojis(text)
    
    # 2. Update Title/Headers specific cleanups if needed (e.g. doublespaces)
    text = text.replace('  ', ' ') # Simple cleanup, might be risky for code blocks but mostly okay for README text
    
    # 3. Update Chat Nova
    # Replace the section header
    text = text.replace('### 2. AI-Powered Recommendations & Chat', '### 2. AI-Powered Recommendations & Chat Nova')
    
    # Replace the sub-header and content
    old_section = """**AI Chat Interface:**
- Full conversational interface with markdown rendering
- Context-aware: uses your profile + program database for answers
- Suggested quick prompts for common questions
- Admin users get unlimited access; regular users have rate limits"""

    new_section = """**Chat Nova Interface:**
Chat Nova is your personal AI study abroad assistant, created by Musawar. It helps you navigate the complexities of studying in Germany with ease.

- **How it works:** Nova is grounded in the UniAdvisor database and your personal profile. It understands your academic background and preferences to provide tailored advice, from program searches to visa application steps.
- **Context-aware:** Uses your profile + program database for answers
- **Interactive:** Full conversational interface with markdown rendering
- **Persona:** Friendly, knowledgeable, and encouraging guide
- **Access:** Admin users get unlimited access; regular users have daily rate limits"""
    
    # Try to replace. If exact match fails due to whitespace, we might need to be more flexible.
    # Reading the file in step 10 showed:
    # 93: **AI Chat Interface:**
    # 94: - Full conversational interface with markdown rendering
    # 95: - Context-aware: uses your profile + program database for answers
    # 96: - Suggested quick prompts for common questions
    # 97: - Admin users get unlimited access; regular users have rate limits
    
    # Let's try exact replace first
    if old_section in text:
        text = text.replace(old_section, new_section)
    else:
        # Fallback to simple replace if spacing is off
        text = text.replace('**AI Chat Interface:**', '**Chat Nova Interface:**')
        
    return text

def main():
    with open('/Users/soomro/Desktop/Projects/UniAdvisorAI/README.md', 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = update_content(content)
    
    with open('/Users/soomro/Desktop/Projects/UniAdvisorAI/README.md', 'w', encoding='utf-8') as f:
        f.write(new_content)
        
    print("README.md updated successfully.")

if __name__ == "__main__":
    main()
