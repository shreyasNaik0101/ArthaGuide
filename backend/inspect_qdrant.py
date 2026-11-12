"""
Inspect Qdrant Collections - See what documents are stored
"""
from app.services.seed_qdrant import initialize_qdrant_memory

def inspect_collections():
    """Show all stored documents in Qdrant"""
    print("🔍 Inspecting Qdrant Vector Database...\n")
    
    # Initialize RAG system
    rag = initialize_qdrant_memory()
    
    # Check each collection
    for name, collection_name in rag.collections.items():
        print(f"\n{'='*60}")
        print(f"📚 Collection: {name.upper()}")
        print(f"{'='*60}")
        
        try:
            # Get collection info
            collection_info = rag.client.get_collection(collection_name)
            print(f"Total vectors: {collection_info.points_count}")
            print(f"Vector size: {collection_info.config.params.vectors.size}")
            
            # Scroll through points to see documents
            points = rag.client.scroll(
                collection_name=collection_name,
                limit=100
            )[0]  # Returns (points, next_offset)
            
            print(f"\n📄 Documents stored:\n")
            for i, point in enumerate(points, 1):
                print(f"\n--- Document {i} ---")
                for key, value in point.payload.items():
                    if isinstance(value, str) and len(value) > 100:
                        print(f"  {key}: {value[:100]}...")
                    else:
                        print(f"  {key}: {value}")
                        
        except Exception as e:
            print(f"Error: {e}")
    
    print(f"\n{'='*60}")
    print("✅ Inspection complete!")

if __name__ == "__main__":
    inspect_collections()
