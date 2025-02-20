# memory_manager.py
import weaviate
from weaviate.classes.config import Property, DataType, Configure
from langchain_core.messages import SystemMessage, HumanMessage
from prompts import create_reflection
from helpers import format_conversation

def create_collection(vdb_client, name: str):
    """
    Create a Weaviate collection for episodic memory.
    """
    vdb_client.collections.create(
        name=name,
        description="Collection containing historical chat interactions and takeaways.",
        vectorizer_config=[
            Configure.NamedVectors.text2vec_ollama(
                name="title_vector",
                source_properties=["title"],
                api_endpoint="http://host.docker.internal:11434",  # Use this if contacting a local Ollama instance via Docker
                model="nomic-embed-text",
            )
        ],
        properties=[
            Property(name="conversation", data_type=DataType.TEXT),
            Property(name="context_tags", data_type=DataType.TEXT_ARRAY),
            Property(name="conversation_summary", data_type=DataType.TEXT),
            Property(name="what_worked", data_type=DataType.TEXT),
            Property(name="what_to_avoid", data_type=DataType.TEXT),
        ]
    )

def add_episodic_memory(messages, vdb_client):
    """
    Generate a reflection from the conversation and store it in the episodic memory collection.
    """
    conversation = format_conversation(messages)
    reflection = create_reflection(conversation)
    episodic_memory = vdb_client.collections.get("episodic_memory")
    episodic_memory.data.insert({
        "conversation": conversation,
        "context_tags": reflection['context_tags'],
        "conversation_summary": reflection['conversation_summary'],
        "what_worked": reflection['what_worked'],
        "what_to_avoid": reflection['what_to_avoid'],
    })

def episodic_recall(query: str, vdb_client):
    """
    Retrieve episodic memory using a hybrid semantic/BM25 query.
    """
    episodic_memory = vdb_client.collections.get("episodic_memory")
    memory = episodic_memory.query.hybrid(query=query, alpha=0.5, limit=1)
    return memory

def create_paper(vdb_client):
    """
    Create a collection for a paper (e.g., nutrition guide).
    """
    vdb_client.collections.create(
        name="Crossfit_Nutrition",
        description="A guide by crossfit to nutrition and healthy eating",
        vectorizer_config=[
            Configure.NamedVectors.text2vec_ollama(
                name="title_vector",
                source_properties=["title"],
                api_endpoint="http://host.docker.internal:11434",
                model="nomic-embed-text",
            )
        ],
        properties=[Property(name="chunk", data_type=DataType.TEXT)]
    )

def load_database(vdb_client, recursive_character_chunks):
    """
    Load PDF chunks into the 'Crossfit_Nutrition' collection.
    """
    coala_collection = vdb_client.collections.get("Crossfit_Nutrition")
    for chunk in recursive_character_chunks:
        coala_collection.data.insert({"chunk": chunk})

def semantic_recall(query: str, vdb_client):
    """
    Retrieve semantic memory (chunks) using a hybrid semantic/BM25 query.
    """
    coala_collection = vdb_client.collections.get("Crossfit_Nutrition")
    memories = coala_collection.query.hybrid(query=query, alpha=0.5, limit=15)
    combined_text = ""
    for i, memory in enumerate(memories.objects):
        combined_text += f"\nCHUNK {i+1}:\n{memory.properties['chunk'].strip()}"
    return combined_text

def semantic_rag(query: str, vdb_client):
    """
    Create a context message using semantic recall.
    """
    memories = semantic_recall(query, vdb_client)
    semantic_prompt = f"""If needed, use this grounded context to factually answer the next question.
Let me know if you do not have enough information or context to answer.
    
{memories}
"""
    return HumanMessage(semantic_prompt)

def episodic_system_prompt(query: str, vdb_client, conversations, what_worked, what_to_avoid):
    """
    Build a system prompt by recalling previous episodic memories and incorporating procedural instructions.
    """
    memory = episodic_recall(query, vdb_client)
    with open("./procedural_memory.txt", "r") as content:
        procedural_memory = content.read()
    current_conversation = memory.objects[0].properties['conversation']
    if current_conversation not in conversations:
        conversations.append(current_conversation)
    what_worked.update(memory.objects[0].properties['what_worked'].split('. '))
    what_to_avoid.update(memory.objects[0].properties['what_to_avoid'].split('. '))
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

def procedural_memory_update(what_worked, what_to_avoid, llm):
    """
    Update procedural memory based on new feedback.
    """
    with open("./procedural_memory.txt", "r") as content:
        current_takeaways = content.read()
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
