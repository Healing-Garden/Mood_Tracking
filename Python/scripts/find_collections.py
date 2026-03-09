import asyncio
import os
import sys

# Add src to path
sys.path.append(os.getcwd())

from src.database.mongodb import MongoDB

async def main():
    try:
        instance = MongoDB()
        await instance.connect()
        db = instance.get_db()
        cols = await db.list_collection_names()
        print(f"COLLECTIONS: {cols}")
        
        # Check potential candidates
        targets = ['healingcontents', 'healing_contents', 'HealingContent', 'HealingContents']
        for t in targets:
            if t in cols:
                count = await db[t].count_documents({})
                print(f"FOUND: {t}, COUNT: {count}")
                sample = await db[t].find_one({})
                print(f"SAMPLE {t}: {sample}")
            else:
                print(f"NOT FOUND: {t}")
        
        await instance.disconnect()
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(main())
