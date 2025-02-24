from config import supabase, llm
from helpers import format_conversation
from prompts import create_reflection
from langchain_core.messages import SystemMessage, HumanMessage

def add_episodic_memory(messages):
    """
    Generate a reflection from the conversation and store it in the episodic_memory table.
    """
    conversation = format_conversation(messages)
    reflection = create_reflection(conversation)
    data = {
        "conversation": conversation,
        "context_tags": reflection['context_tags'],
        "conversation_summary": reflection['conversation_summary'],
        "what_worked": reflection['what_worked'],
        "what_to_avoid": reflection['what_to_avoid'],
    }
    
    response = supabase.table("episodic_memory").insert(data).execute()
    # print("Response from insert:", response)
    
    # Check if any data was returned from the insert
    if not response.data:
        print("Error inserting memory. Response:", response)
    else:
        print("Episodic memory stored successfully!")

# CONDENSED VERSION OF INSERTING EPISODIC MEMORY
# def add_episodic_memory(messages):
#     """
#     Generate a reflection from the conversation and store a concise summary in the episodic_memory table.
#     Implements deduplication by checking if a similar summary already exists.
#     """
#     full_conversation = format_conversation(messages)
#     reflection = create_reflection(full_conversation)
#     summary = reflection['conversation_summary']

#     # Deduplication: Check if an entry with the same summary exists.
#     dup_response = supabase.table("episodic_memory") \
#         .select("id") \
#         .eq("conversation_summary", summary) \
#         .execute()

#     if dup_response.data and len(dup_response.data) > 0:
#         print("Duplicate memory found, skipping insertion.")
#         return

#     # Optionally, store only a truncated version of the full conversation.
#     trimmed_conversation = full_conversation[:500]  # e.g. first 500 characters

#     data = {
#         "conversation": trimmed_conversation,
#         "context_tags": reflection['context_tags'],
#         "conversation_summary": summary,
#         "what_worked": reflection['what_worked'],
#         "what_to_avoid": reflection['what_to_avoid'],
#     }
    
#     response = supabase.table("episodic_memory").insert(data).execute()
    
#     if response.data:
#         print("Episodic memory stored successfully!")
#     else:
#         print("Error inserting memory. Response:", response)

def episodic_recall(query: str):
    """
    Retrieve episodic memory from the episodic_memory table using a simple text search.
    """
    response = supabase.table("episodic_memory") \
        .select("*") \
        .ilike("conversation", f"%{query}%") \
        .limit(1) \
        .execute()
    
    if response.data and len(response.data) > 0:
        return response.data[0]
    else:
        # print("No episodic memory found for query:", query)
        return None

def semantic_recall(query: str):
    """
    Retrieve semantic memory (chunks) from the crossfit_nutrition table using a simple text search.
    """
    response = supabase.table("crossfit_nutrition") \
        .select("*") \
        .ilike("chunk", f"%{query}%") \
        .limit(15) \
        .execute()
    
    combined_text = ""
    if response.data and len(response.data) > 0:
        for i, item in enumerate(response.data):
            combined_text += f"\nCHUNK {i+1}:\n{item['chunk'].strip()}"
    # else:
        # print("No semantic chunks found for query:", query)
    return combined_text

def semantic_rag(query: str):
    """
    Create a context message using semantic recall.
    """
    memories = semantic_recall(query)
    semantic_prompt = f"""If needed, use this grounded context to factually answer the next question.
Let me know if you do not have enough information or context to answer.
    
{memories}
"""
    return HumanMessage(semantic_prompt)

def episodic_system_prompt(query: str, conversations, what_worked, what_to_avoid):
    """
    Build a system prompt by recalling previous episodic memories and incorporating procedural instructions.
    """
    memory = episodic_recall(query)
    if not memory:
        current_conversation = "N/A"
    else:
        # Use dictionary .get to safely extract fields
        current_conversation = memory.get('conversation', "N/A")
        what_worked.update(memory.get('what_worked', "").split('. '))
        what_to_avoid.update(memory.get('what_to_avoid', "").split('. '))
        if current_conversation not in conversations:
            conversations.append(current_conversation)
    
    # Read procedural memory from file
    try:
        with open("./procedural_memory.txt", "r") as content:
            procedural_memory = content.read()
    except FileNotFoundError:
        procedural_memory = "No procedural guidelines available."
    
    previous_convos = [conv for conv in conversations[-4:] if conv != current_conversation][-3:]
    episodic_prompt = f"""You are a helpful AI Assistant. Answer the user's questions to the best of your ability.
You recall similar conversations with the user, here are the details:

Current Conversation Match: {current_conversation}
Previous Conversations: {' | '.join(previous_convos)}
What has worked well: {' '.join(what_worked)}
What to avoid: {' '.join(what_to_avoid)}

Use these memories as context for your response to the user.

Additionally, here are 10 guidelines for interactions with the current user: {procedural_memory}"""
    return SystemMessage(content=episodic_prompt)

def procedural_memory_update(what_worked, what_to_avoid):
    """
    Update procedural memory based on new feedback.
    """
    try:
        with open("./procedural_memory.txt", "r") as content:
            current_takeaways = content.read()
    except FileNotFoundError:
        current_takeaways = ""
    procedural_prompt = f"""You are maintaining a continuously updated list of the most important procedural behavior instructions for an AI assistant. Your task is to refine and improve a list of key takeaways based on new conversation feedback while maintaining the most valuable existing insights.

CURRENT TAKEAWAYS:
{current_takeaways}

NEW FEEDBACK:
What Worked Well:
{what_worked}

What To Avoid:
{what_to_avoid}

Please generate an updated list of up to 10 key takeaways that combines:
1. The most valuable insights from the current takeaways
2. New learnings from the recent feedback
3. Any synthesized insights combining multiple learnings

Requirements for each takeaway:
- Must be specific and actionable
- Should address a distinct aspect of behavior
- Include a clear rationale
- Written in imperative form (e.g., "Maintain conversation context by...")

Format each takeaway as:
[#]. [Instruction] - [Brief rationale]

The final list should:
- Be ordered by importance/impact
- Cover a diverse range of interaction aspects
- Focus on concrete behaviors rather than abstract principles
- Preserve particularly valuable existing takeaways
- Incorporate new insights when they provide meaningful improvements

Return only the list, no preamble or explanation.
"""
    procedural_memory = llm.invoke(procedural_prompt)
    with open("./procedural_memory.txt", "w") as content:
        content.write(procedural_memory.content)

def load_pdf_chunks_to_db(recursive_character_chunks):
    """
    Load PDF chunks into the 'crossfit_nutrition' table.
    """
    for chunk in recursive_character_chunks:
        response = supabase.table("crossfit_nutrition").insert({"chunk": chunk}).execute()
        if not response.data:
            print("Error inserting chunk. Response:", response)

def vectorized_semantic_search(query_vector: list, limit_count: int = 5):
    """
    Perform a vectorized semantic search using pgvector. This function calls an RPC function
    (named 'semantic_search') that must be created in your Supabase SQL editor.
    """
    response = supabase.rpc("semantic_search", {"query_vector": query_vector, "limit_count": limit_count}).execute()
    if not response.data:
        print("Error in vectorized semantic search. Response:", response)
        return []
    return response.data

def ensure_table_exists():
    """
    Creates the episodic_memory table if it does not exist.
    """
    sql = """
    CREATE TABLE IF NOT EXISTS episodic_memory (
        id SERIAL PRIMARY KEY,
        conversation TEXT NOT NULL,
        context_tags TEXT[] NOT NULL,
        conversation_summary TEXT,
        what_worked TEXT,
        what_to_avoid TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    """
    response = supabase.rpc("sql", {"sql": sql}).execute()
    print("Table check complete. Episodic memory table is ready.")