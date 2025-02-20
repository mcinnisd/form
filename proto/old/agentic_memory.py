#!/usr/bin/env python
# coding: utf-8

from langchain_openai import ChatOpenAI

from dotenv import load_dotenv

load_dotenv()

llm = ChatOpenAI(temperature=0.7, model="gpt-4o")

from langchain_core.messages import HumanMessage, SystemMessage

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

reflection_prompt_template = """

You are analyzing conversations about personal fitness, nutrition guidance, health data, and user preferences to create memories that will help guide future interactions. Your task is to extract key elements that would be most helpful when encountering similar personal training or nutrition discussions in the future.

Review the conversation and create a memory reflection following these rules:

1. For any field where you don't have enough information or the field isn't relevant, use "N/A"
2. Be extremely concise - each string should be one clear, actionable sentence
3. Focus only on information that would be useful for handling similar future personal training/nutrition conversations
4. context_tags should be specific enough to match similar situations but general enough to be reusable

Output valid JSON in exactly this format:
{{
    "context_tags": [             // 2-4 keywords that would help identify similar future personal training/nutrition conversations
        string,
        ...
    ],
    "conversation_summary": string, // One sentence describing what the conversation accomplished
    "what_worked": string,         // Most effective approach or strategy used in this conversation
    "what_to_avoid": string        // Most important pitfall or ineffective approach to avoid
}}

Examples:
- Good context_tags: ["strength_training", "plant_based_nutrition", "fat_loss_goals"]
- Bad context_tags: ["fitness", "nutrition", "health"]

- Good conversation_summary: "Established a structured workout plan and daily calorie goal for healthy weight loss"
- Bad conversation_summary: "Talked about workouts and meals"

- Good what_worked: "Personalizing exercise and diet recommendations based on body metrics, dietary restrictions, and fitness goals"
- Bad what_worked: "Gave random exercises and recipes"

- Good what_to_avoid: "Suggesting generic workouts without considering the user’s injury history or time constraints"
- Bad what_to_avoid: "Skipping warm-up routines"

Additional examples for more specific scenarios:

Context tags examples:
- ["long_distance_endurance", "glycogen_stores", "carb_cycling"]
- ["blood_pressure_explanation", "body_fat_analysis", "goal_setting"]

Conversation summary examples:
- "Discussed how adjusting carb intake can enhance performance for marathon training"
- "Explained health metrics like resting heart rate and body fat percentage for better goal setting"

What worked examples:
- "Highlighting the role of glycogen in fueling extended cardio sessions"
- "Providing clear definitions for key health metrics and linking them to the user’s progress"

What to avoid examples:
- "Recommending advanced macro manipulation without confirming the user’s basic dietary knowledge"
- "Overlooking the user's current health data when suggesting new training protocols"

Do not include any text outside the JSON object in your response.

Here is the prior conversation:

{conversation}
"""

reflection_prompt = ChatPromptTemplate.from_template(reflection_prompt_template)

reflect = reflection_prompt | llm | JsonOutputParser()


def format_conversation(messages):
    
    # Create an empty list placeholder
    conversation = []
    
    # Start from index 1 to skip the first system message
    for message in messages[1:]:
        conversation.append(f"{message.type.upper()}: {message.content}")
    
    # Join with newlines
    return "\n".join(conversation)

# conversation = format_conversation(messages)

# print(conversation)


# reflection = reflect.invoke({"conversation": conversation})

# print(reflection)



import weaviate

# vdb_client = weaviate.connect_to_local()
# print("Connected to Weviate: ", vdb_client.is_ready())

# vdb_client.collections.delete("episodic_memory")

from weaviate.classes.config import Property, DataType, Configure, Tokenization

def create_collection(vdb_client, name):
    vdb_client.collections.create(
        name=name,
        description="Collection containing historical chat interactions and takeaways.",
        vectorizer_config=[
            Configure.NamedVectors.text2vec_ollama(
                name="title_vector",
                source_properties=["title"],
                api_endpoint="http://host.docker.internal:11434",  # If using Docker, use this to contact your local Ollama instance
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

    # Format Messages
    conversation = format_conversation(messages)

    # Create Reflection
    reflection = reflect.invoke({"conversation": conversation})

    # Load Database Collection
    episodic_memory = vdb_client.collections.get("episodic_memory")

    # Insert Entry Into Collection
    episodic_memory.data.insert({
        "conversation": conversation,
        "context_tags": reflection['context_tags'],
        "conversation_summary": reflection['conversation_summary'],
        "what_worked": reflection['what_worked'],
        "what_to_avoid": reflection['what_to_avoid'],
    })

# add_episodic_memory(messages, vdb_client)


def episodic_recall(query, vdb_client):
    
    # Load Database Collection
    episodic_memory = vdb_client.collections.get("episodic_memory")
    # print(episodic_memory) 

    # Hybrid Semantic/BM25 Retrieval
    memory = episodic_memory.query.hybrid(
        query=query,
        alpha=0.5,
        limit=1,
    )
    
    return memory

# def episodic_recall(query, episodic_memory):
#     memory = episodic_memory.query.hybrid(
#         query=query,
#         alpha=0.5,
#         limit=1,
#     )
    
#     return memory

# query = "user weight and height"
# memory = episodic_recall(query, vdb_client)

# Debugging output
# print(memory)  # Print the entire response
# print(memory.objects)  # Check if objects exist

# if memory.objects:
#     print(memory.objects[0].properties)
# else:
#     print("No results found.")




# get_ipython().run_cell_magic('capture', '', '!pip install git+https://github.com/brandonstarxel/chunking_evaluation.git\n')


from chunking_evaluation.chunking import RecursiveTokenChunker
from langchain_community.document_loaders import PyPDFLoader

loader = PyPDFLoader("./nutrition1_trainingguide.pdf")
pages = []
for page in loader.load():
    pages.append(page)

# Combine all page contents into one string
document = " ".join(page.page_content for page in pages)

# Set up the chunker with your specified parameters
recursive_character_chunker = RecursiveTokenChunker(
    chunk_size=800,
    chunk_overlap=0,
    length_function=len,
    separators=["\n\n", "\n", ".", "?", "!", " ", ""]
)

# Split the combined text
recursive_character_chunks = recursive_character_chunker.split_text(document)



len(recursive_character_chunks)



# vdb_client.collections.delete("Crossfit_Nutrition")

def create_paper(vdb_client):

    vdb_client.collections.create(
        name="Crossfit_Nutrition",
        description="A guide by crossfit to nutrition and healthy eating",
        vectorizer_config=[
            Configure.NamedVectors.text2vec_ollama(
                name="title_vector",
                source_properties=["title"],
                api_endpoint="http://host.docker.internal:11434",  # If using Docker, use this to contact your local Ollama instance
                model="nomic-embed-text",
            )
        ],
        properties=[
            Property(name="chunk", data_type=DataType.TEXT),
        ]
    )


# Load Database Collection
def load_database(vdb_client):
    coala_collection = vdb_client.collections.get("Crossfit_Nutrition")

    for chunk in recursive_character_chunks:
        # Insert Entry Into Collection
        coala_collection.data.insert({
            "chunk": chunk,
        })


def semantic_recall(query, vdb_client):
    
    # Load Database Collection
    coala_collection = vdb_client.collections.get("Crossfit_Nutrition")

    # Hybrid Semantic/BM25 Retrieval
    memories = coala_collection.query.hybrid(
        query=query,
        alpha=0.5,
        limit=15,
    )

    combined_text = ""
    
    for i, memory in enumerate(memories.objects):
        # Add chunk separator except for first chunk        if i > 0:

        
        # Add chunk number and content
        combined_text += f"\nCHUNK {i+1}:\n"
        combined_text += memory.properties['chunk'].strip()
    
    return combined_text


# memories = semantic_recall("What is an ideal healthy balenced diet", vdb_client)

# print(memories)



def semantic_rag(query, vdb_client):

    memories = semantic_recall(query, vdb_client)

    semantic_prompt = f""" If needed, Use this grounded context to factually answer the next question.
    Let me know if you do not have enough information or context to answer a question.
    
    {memories}
    """
    
    return HumanMessage(semantic_prompt)





def episodic_system_prompt(query, vdb_client, conversations, what_worked, what_to_avoid):
    

    # more efficient calling?
    # episodic_memory = vdb_client.collections.get("episodic_memory")
    # memory = episodic_recall("Talking about a workout", episodic_memory)

    # Get new memory
    memory = episodic_recall(query, vdb_client)
    
    # Load Existing Procedural Memory Instructions
    with open("./procedural_memory.txt", "r") as content:
        procedural_memory = content.read()
    
    # Get current conversation
    current_conversation = memory.objects[0].properties['conversation']
    
    # Update memory stores, excluding current conversation from history
    if current_conversation not in conversations:
        conversations.append(current_conversation)
    what_worked.update(memory.objects[0].properties['what_worked'].split('. '))
    what_to_avoid.update(memory.objects[0].properties['what_to_avoid'].split('. '))
    
    # Get previous conversations excluding the current one
    previous_convos = [conv for conv in conversations[-4:] if conv != current_conversation][-3:]
    
    # Create prompt with accumulated history
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

    # Load Existing Procedural Memory Instructions
    with open("./procedural_memory.txt", "r") as content:
        current_takeaways = content.read()

    # Load Existing and Gathered Feedback into Prompt
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

    Return up to but no more than 10 takeaways, replacing or combining existing ones as needed to maintain the most effective set of guidelines.
    Return only the list, no preamble or explanation.
    """

    # Generate New Procedural Memory
    procedural_memory = llm.invoke(procedural_prompt)

    # Write to File
    with open("./procedural_memory.txt", "w") as content:
        content.write(procedural_memory.content)

    return

# prompt = procedural_memory_update(what_worked, what_to_avoid)

def trainer_memory():
    with weaviate.connect_to_local() as vdb_client:  # Auto-closes on exit
        print("Connected to Weaviate: ", vdb_client.is_ready())

        # Simple storage for accumulated memories
        conversations = []
        what_worked = set()
        what_to_avoid = set()

        # Start Storage for Historical Message History
        messages = []

        while True:
            # Get User's Message
            user_input = input("\nUser: ")
            user_message = HumanMessage(content=user_input)
            
            # Generate new system prompt
            system_prompt = episodic_system_prompt(user_input, vdb_client, conversations, what_worked, what_to_avoid)
            
            # Reconstruct messages list with new system prompt first
            messages = [
                system_prompt,  # New system prompt always first
                *[msg for msg in messages if not isinstance(msg, SystemMessage)]  # Old messages except system
            ]
            
            if user_input.lower() == "exit":
                add_episodic_memory(messages, vdb_client)
                print("\n == Conversation Stored in Episodic Memory ==")
                procedural_memory_update(what_worked, what_to_avoid)
                print("\n== Procedural Memory Updated ==")
                break
            if user_input.lower() == "exit_quiet":
                print("\n == Conversation Exited ==")
                break
            
            # Get context and add it as a temporary message
            context_message = semantic_rag(user_input, vdb_client)
            
            # Pass messages + context + user input to LLM
            response = llm.invoke([*messages, context_message, user_message])
            print("\nAI Message: ", response.content)
            
            # Add only the user message and response to permanent history
            messages.extend([user_message, response])

        return messages

try:
    # Run your main logic (trainer_memory)
    messages = trainer_memory()
except Exception as e:
    print(f"⚠️ Error occurred: {e}")


# finally:
#     # Ensure the client is always closed
#     vdb_client.close()
#     print("Weaviate client closed successfully.")

# print(format_conversation(messages))



# print(system_prompt.content)

# print(context_message.content)

