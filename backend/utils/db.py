# ============================================================
# utils/db.py - MySQL Database Connection Helper
# ============================================================

import mysql.connector
from mysql.connector import pooling
from flask import current_app
import os

# Connection pool for better performance
connection_pool = None

def init_db_pool():
    global connection_pool
    connection_pool = mysql.connector.pooling.MySQLConnectionPool(
        pool_name="career_pool",
        pool_size=5,
        host=os.environ.get('DB_HOST', 'localhost'),
        port=int(os.environ.get('DB_PORT', 3306)),
        user=os.environ.get('DB_USER', 'root'),
        password=os.environ.get('DB_PASSWORD', ''),
        database=os.environ.get('DB_NAME', 'ai_career_companion'),
        autocommit=True
    )

def get_db():
    """Get a database connection from the pool."""
    global connection_pool
    if connection_pool is None:
        init_db_pool()
    return connection_pool.get_connection()

def execute_query(query, params=None, fetch='all'):
    """
    Execute a SQL query and return results.
    fetch: 'all' | 'one' | 'none'
    """
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query, params or ())

        if fetch == 'all':
            return cursor.fetchall()
        elif fetch == 'one':
            return cursor.fetchone()
        elif fetch == 'none':
            return cursor.lastrowid
    except Exception as e:
        raise Exception(f"Database error: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
