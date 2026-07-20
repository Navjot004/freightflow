from app.db.database import engine
from sqlalchemy import text

def run():
    with engine.begin() as conn:
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS company_users (
                    user_id VARCHAR NOT NULL,
                    company_id VARCHAR NOT NULL,
                    role_id VARCHAR,
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (user_id, company_id),
                    FOREIGN KEY(user_id) REFERENCES users (id),
                    FOREIGN KEY(company_id) REFERENCES companies (id),
                    FOREIGN KEY(role_id) REFERENCES roles (id)
                )
            """))
            print("Successfully created company_users table.")
            
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS domain_events (
                    id VARCHAR PRIMARY KEY,
                    aggregate_type VARCHAR,
                    aggregate_id VARCHAR,
                    event_type VARCHAR,
                    payload TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """))
            print("Successfully created domain_events table.")
            
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS outbox_events (
                    id VARCHAR PRIMARY KEY,
                    event_id VARCHAR,
                    processed BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """))
            print("Successfully created outbox_events table.")
            
            # Sync existing primary context into company_users
            conn.execute(text("""
                INSERT OR IGNORE INTO company_users (user_id, company_id, role_id)
                SELECT id, company_id, role_id FROM users WHERE company_id IS NOT NULL;
            """))
            print("Successfully synced existing users to company_users.")
        except Exception as e:
            print("Error:", e)

if __name__ == "__main__":
    run()
