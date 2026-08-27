
from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import func
import json
import os

# Connect to the actual database to see real data if possible, or create a temp one.
# Let's try to verify the logic on a temp in-memory db first to prove the SQL logic.

Base = declarative_base()

class Post(Base):
    __tablename__ = 'posts_debug'
    id = Column(Integer, primary_key=True)
    title = Column(String)
    content = Column(Text)
    tags = Column(String) # JSON string

engine = create_engine('sqlite:///:memory:', echo=True)
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)
session = Session()

# Insert dummy data
posts_data = [
    {"title": "Post 1", "content": "#FAU", "tags": json.dumps(["FAU"])},
    {"title": "Post 2", "content": "#Fau", "tags": json.dumps(["Fau"])},
    {"title": "Post 3", "content": "#fau", "tags": json.dumps(["fau"])},
    {"title": "Post 4", "content": "Other", "tags": json.dumps(["Other"])},
    {"title": "Post 5", "content": "Multiple", "tags": json.dumps(["Something", "FAU"])},
]

for p in posts_data:
    session.add(Post(title=p["title"], content=p["content"], tags=p["tags"]))
session.commit()

def search_tag(tag_query):
    print(f"\n--- Searching for: {tag_query} ---")
    term = tag_query.lower()
    # replicate the logic in community.py
    query = session.query(Post).filter(func.lower(Post.tags).like(f'%"{term}"%'))
    results = query.all()
    print(f"Found {len(results)} posts:")
    for r in results:
        print(f" - {r.title} (Tags: {r.tags})")

search_tag("FAU")
search_tag("fau")
search_tag("Fau")

# Now let's try to query the REAL database if it exists
real_db_path = "daad_app.db"
if os.path.exists(real_db_path):
    print("\n\n--- Checking REAL DB Data ---")
    real_engine = create_engine(f'sqlite:///{real_db_path}')
    # We can't easily map the real Post class without importing the whole app
    # So we'll just execute raw SQL to inspect
    from sqlalchemy import text
    with real_engine.connect() as conn:
        result = conn.execute(text("SELECT id, title, tags FROM posts WHERE tags IS NOT NULL"))
        print("Existing posts with tags:")
        for row in result:
            print(row)
            
        print("\nTesting Query on Real DB:")
        term = "fau"
        sql = text(f"SELECT id, title, tags FROM posts WHERE lower(tags) LIKE '%\"{term}\"%'")
        result = conn.execute(sql)
        print(f"Query for 'fau' found:")
        for row in result:
            print(row)
