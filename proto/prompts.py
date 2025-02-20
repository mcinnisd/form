# prompts.py
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from config import llm  # Import the LLM instance

reflection_prompt_template = """
You are analyzing conversations about personal fitness, nutrition guidance, health data, and user preferences to create memories that will help guide future interactions. Your task is to extract key elements that would be most helpful when encountering similar personal training or nutrition discussions in the future.

Review the conversation and create a memory reflection following these rules:

1. For any field where you don't have enough information or the field isn't relevant, use "N/A"
2. Be extremely concise - each string should be one clear, actionable sentence
3. Focus only on information that would be useful for handling similar future personal training/nutrition conversations
4. context_tags should be specific enough to match similar situations but general enough to be reusable

Output valid JSON in exactly this format:
{{
    "context_tags": [             
        string,
        ...
    ],
    "conversation_summary": string, 
    "what_worked": string,         
    "what_to_avoid": string        
}}

Examples:
- Good context_tags: ["strength_training", "plant_based_nutrition", "fat_loss_goals"]
- Good conversation_summary: "Established a structured workout plan and daily calorie goal for healthy weight loss"
- Good what_worked: "Personalizing exercise and diet recommendations based on body metrics, dietary restrictions, and fitness goals"
- Good what_to_avoid: "Suggesting generic workouts without considering the user’s injury history or time constraints"

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

# Create the prompt and reflection pipeline
reflection_prompt = ChatPromptTemplate.from_template(reflection_prompt_template)
reflect = reflection_prompt | llm | JsonOutputParser()

def create_reflection(conversation: str) -> dict:
    """
    Generates a reflection from the provided conversation text.
    """
    return reflect.invoke({"conversation": conversation})
