import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), '..', 'instance', 'rankresult.db')
print(f"Connecting to {db_path}")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Add columns to master_questions
    cols = ['option_a_id', 'option_b_id', 'option_c_id', 'option_d_id']
    for col in cols:
        try:
            cursor.execute(f"ALTER TABLE master_questions ADD COLUMN {col} VARCHAR(50)")
            print(f"Added column {col}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print(f"Column {col} already exists")
            else:
                print(f"Error adding {col}: {e}")
                
    conn.commit()
    conn.close()
    print("Migration completed successfully.")
except Exception as e:
    print(f"Migration failed: {e}")
