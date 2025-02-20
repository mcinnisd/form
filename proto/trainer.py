# trainer.py
from langchain_core.messages import HumanMessage
from config import llm
from memory_manager import (
    episodic_system_prompt,
    add_episodic_memory,
    procedural_memory_update,
    semantic_rag
)
from weaviate import connect_to_local

def trainer_memory():
    """
    Main interactive loop for training. It collects user input, generates context-aware responses,
    and updates episodic and procedural memory.
    """
    with connect_to_local() as vdb_client:
        print("Connected to Weaviate:", vdb_client.is_ready())
        conversations = []
        what_worked = set()
        what_to_avoid = set()
        messages = []

        while True:
            user_input = input("\nUser: ")
            user_message = HumanMessage(content=user_input)
            system_prompt = episodic_system_prompt(user_input, vdb_client, conversations, what_worked, what_to_avoid)
            # Prepend the new system prompt while preserving non-system messages
            messages = [system_prompt] + [msg for msg in messages if not hasattr(msg, "role") or msg.role != "system"]

            if user_input.lower() == "exit":
                add_episodic_memory(messages, vdb_client)
                print("\n== Conversation Stored in Episodic Memory ==")
                procedural_memory_update(what_worked, what_to_avoid, llm)
                print("\n== Procedural Memory Updated ==")
                break
            if user_input.lower() == "exit_quiet":
                print("\n== Conversation Exited ==")
                break

            # Retrieve context using semantic recall
            context_message = semantic_rag(user_input, vdb_client)
            response = llm.invoke(messages + [context_message, user_message])
            print("\nAI Message:", response.content)
            messages.extend([user_message, response])

        return messages

if __name__ == "__main__":
    try:
        trainer_memory()
    except Exception as e:
        print(f"Error occurred: {e}")
