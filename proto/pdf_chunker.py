# pdf_chunker.py
from langchain_community.document_loaders import PyPDFLoader
from chunking_evaluation.chunking import RecursiveTokenChunker

def load_pdf_chunks(pdf_path: str, chunk_size: int = 800, chunk_overlap: int = 0) -> list:
    """
    Loads a PDF and splits its text into chunks.
    """
    loader = PyPDFLoader(pdf_path)
    pages = loader.load()
    # Combine all page contents into one string
    document = " ".join(page.page_content for page in pages)
    recursive_character_chunker = RecursiveTokenChunker(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", ".", "?", "!", " ", ""]
    )
    chunks = recursive_character_chunker.split_text(document)
    return chunks
