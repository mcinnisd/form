# config.py
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv()

# Initialize the LLM with desired parameters
llm = ChatOpenAI(temperature=0.7, model="gpt-4o")
