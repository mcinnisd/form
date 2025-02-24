# config.py
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from supabase import create_client, Client
import os

load_dotenv()

# Initialize the LLM with desired parameters
llm = ChatOpenAI(temperature=0.7, model="gpt-4o")

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)