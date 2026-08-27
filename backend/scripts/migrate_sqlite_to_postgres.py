import os
import sqlite3
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base
# Import all models to ensure they are registered with Base.metadata
from app.models.user import User
from app.models.program import Program
from app.models.scholarship import Scholarship
from app.models.user_profile import UserProfile, UserApplication

load_dotenv()

SQLITE_URL = "sqlite:///./daad_app.db"
POSTGRES_URL = "postgresql://uniadvisor:uniadvisor_password@127.0.0.1:5433/uniadvisor_db"

sqlite_engine = create_engine(SQLITE_URL)
pg_engine = create_engine(POSTGRES_URL)

def truncate_dict_strings(data_dict, table_obj):
    """Truncates string values in a dictionary to fit the SQLAlchemy Column's length limit."""
    truncated = {}
    for key, value in data_dict.items():
        if not isinstance(value, str):
            truncated[key] = value
            continue
            
        col = table_obj.columns.get(key)
        if col is not None and hasattr(col.type, 'length') and col.type.length is not None:
            max_len = col.type.length
            if len(value) > max_len:
                print(f"Truncating column '{key}' in table '{table_obj.name}' from {len(value)} to {max_len} chars.")
                truncated[key] = value[:max_len]
            else:
                truncated[key] = value
        else:
            truncated[key] = value
    return truncated

def migrate():
    print("Creating PostgreSQL tables...")
    Base.metadata.drop_all(bind=pg_engine)
    Base.metadata.create_all(bind=pg_engine)
    
    meta = MetaData()
    meta.reflect(bind=sqlite_engine)
    
    with sqlite_engine.connect() as sqlite_conn, pg_engine.connect() as pg_conn:
        print("Base.metadata.tables:", list(Base.metadata.tables.keys()))
        print("meta.tables:", list(meta.tables.keys()))
        # We only want to migrate tables that exist in both DBs, sorted by dependencies
        tables = [t for t in Base.metadata.sorted_tables if t.name in meta.tables]
        print(f"Found {len(tables)} tables to migrate.")
        for table in tables:
            print(f"Migrating table: {table.name}")
            
            sqlite_table = meta.tables[table.name]
            result = sqlite_conn.execute(sqlite_table.select())
            rows = result.fetchall()
            
            if not rows:
                print(f"  -> No data in {table.name}, skipping.")
                continue
                
            dicts = [dict(zip(result.keys(), row)) for row in rows]
            truncated_dicts = [truncate_dict_strings(d, table) for d in dicts]

            with pg_conn.begin():
                pg_conn.execute(table.insert(), truncated_dicts)
                
                try:
                    from sqlalchemy import text
                    seq_query = text(f"SELECT setval(pg_get_serial_sequence('{table.name}', 'id'), COALESCE(MAX(id), 1) + 1, false) FROM {table.name};")
                    pg_conn.execute(seq_query)
                    print(f"  -> Reset sequence for {table.name}")
                except Exception as e:
                    print(f"  -> Warning: Could not reset sequence for {table.name}: {e}")
                
            print(f"  -> Migrated {len(rows)} rows for {table.name}")
                
    print("Migration completed successfully!")

if __name__ == "__main__":
    import sqlalchemy
    print(f"SQLAlchemy version: {sqlalchemy.__version__}")
    migrate()
