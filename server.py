"""
CampusFind AI - Python Flask & SQLite Backend Server
Provides REST API endpoints for:
 - Student login & authentication
 - Items CRUD (Lost & Found reports)
 - Dual-reunite pair synchronization
 - Static file serving for the frontend web application
"""

import os
import time
import sqlite3
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory

# Base directory for the static website files
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, 'campus_find.db')

app = Flask(__name__, static_folder=BASE_DIR)

# Enable CORS manually so frontend works whether opened from localhost:5000 or file://
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
    return response

@app.route('/api/<path:subpath>', methods=['OPTIONS'])
def handle_options(subpath):
    return ('', 204)

# ============================================================================
# DATABASE INITIALIZATION & HELPERS
# ============================================================================

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            college TEXT NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 2. Items Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS items (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            color TEXT NOT NULL,
            location TEXT NOT NULL,
            date TEXT NOT NULL,
            description TEXT NOT NULL,
            contact_name TEXT NOT NULL,
            contact_info TEXT NOT NULL,
            image_url TEXT,
            is_reunited INTEGER DEFAULT 0,
            matched_with_id TEXT,
            reunited_with_title TEXT,
            created_at TEXT
        )
    ''')

    # Seed demo items if database is empty
    cursor.execute('SELECT COUNT(*) FROM items')
    if cursor.fetchone()[0] == 0:
        seed_demo_items(cursor)

    conn.commit()
    conn.close()

def seed_demo_items(cursor):
    demo_items = [
        (
            'item_101', 'lost', 'Midnight Blue Apple MacBook Air M2', 'Electronics',
            'Blue', 'Main Library', '2026-10-18',
            'Apple MacBook Air 13-inch in dark blue cover. Has a GitHub octocat sticker and NASA logo sticker on the lid.',
            'Sarah Jenkins', 's.jenkins@campus.edu',
            'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
            0, None, None, '2026-10-18T14:30:00.000Z'
        ),
        (
            'item_102', 'found', 'Apple Laptop in Dark Blue Case', 'Electronics',
            'Blue', 'Main Library', '2026-10-19',
            'Found left behind on 2nd-floor quiet study table 14. Midnight blue Apple laptop with developer stickers.',
            'Library Security Desk', 'library-help@campus.edu',
            'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=600&q=80',
            0, None, None, '2026-10-19T09:15:00.000Z'
        ),
        (
            'item_103', 'lost', 'Student ID Card & Bus Pass', 'Cards & IDs',
            'White', 'Student Cafeteria', '2026-10-20',
            'Stanford student ID card in clear plastic pouch attached to a blue lanyard with student name Alex M.',
            'Alex Morgan', 'alex.m@campus.edu',
            '',
            0, None, None, '2026-10-20T12:00:00.000Z'
        ),
        (
            'item_104', 'found', 'University ID Card with Blue Lanyard', 'Cards & IDs',
            'White', 'Student Cafeteria', '2026-10-20',
            'Student ID card picked up near the south beverage station. Clear holder with blue lanyard.',
            'Cafeteria Manager', 'dining-services@campus.edu',
            '',
            0, None, None, '2026-10-20T13:45:00.000Z'
        ),
        (
            'item_105', 'lost', 'Black North Face Gym Duffel Bag', 'Bags & Backpacks',
            'Black', 'Sports Complex & Gym', '2026-10-16',
            'Black medium-size duffel bag containing gym gloves, Nike trainers (size 10), and a stainless water bottle.',
            'Marcus Cole', '555-019-3829',
            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
            0, None, None, '2026-10-16T18:00:00.000Z'
        ),
        (
            'item_106', 'found', 'Black Sports Duffel Bag', 'Bags & Backpacks',
            'Black', 'Sports Complex & Gym', '2026-10-17',
            'Found inside men locker room bench after basketball practice. Contains footwear and workout gear.',
            'Gym Front Desk', 'gym-desk@campus.edu',
            '',
            0, None, None, '2026-10-17T08:30:00.000Z'
        ),
        (
            'item_107', 'lost', 'Gold Rim Reading Glasses in Case', 'Other',
            'Gold / Yellow', 'Auditorium / Lecture Halls', '2026-10-15',
            'Round wireframe prescription glasses kept in a brown leather clip case. Ray-Ban model.',
            'Prof. Vance', 'vance@campus.edu',
            '',
            0, None, None, '2026-10-15T16:20:00.000Z'
        )
    ]

    cursor.executemany('''
        INSERT OR REPLACE INTO items (
            id, type, title, category, color, location, date,
            description, contact_name, contact_info, image_url,
            is_reunited, matched_with_id, reunited_with_title, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', demo_items)

def format_item_dict(row):
    """Converts a database row into JavaScript-friendly camelCase dictionary"""
    return {
        'id': row['id'],
        'type': row['type'],
        'title': row['title'],
        'category': row['category'],
        'color': row['color'],
        'location': row['location'],
        'date': row['date'],
        'description': row['description'],
        'contactName': row['contact_name'],
        'contactInfo': row['contact_info'],
        'imageUrl': row['image_url'] or '',
        'isReunited': bool(row['is_reunited']),
        'matchedWithId': row['matched_with_id'],
        'reunitedWithTitle': row['reunited_with_title'],
        'createdAt': row['created_at']
    }

# ============================================================================
# REST API ENDPOINTS
# ============================================================================

# 1. Login Authentication
@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    college = data.get('college', '').strip()
    password = data.get('password', '')

    if not username or not college or not password:
        return jsonify({'error': 'Please provide college, username, and password'}), 400

    conn = get_db()
    cursor = conn.cursor()

    # Check if user exists or register them
    cursor.execute('SELECT * FROM users WHERE username = ? AND college = ?', (username, college))
    user = cursor.fetchone()

    if not user:
        cursor.execute(
            'INSERT INTO users (username, college, password) VALUES (?, ?, ?)',
            (username, college, password)
        )
        conn.commit()

    conn.close()

    return jsonify({
        'success': True,
        'user': {
            'username': username,
            'college': college,
            'isLoggedIn': True
        }
    })

# 2. Get All Items
@app.route('/api/items', methods=['GET'])
def api_get_items():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM items ORDER BY created_at DESC')
    rows = cursor.fetchall()
    items = [format_item_dict(row) for row in rows]
    conn.close()
    return jsonify(items)

# 3. Report a New Item
@app.route('/api/items', methods=['POST'])
def api_create_item():
    data = request.get_json() or {}

    item_id = data.get('id') or f"item_{int(time.time() * 1000)}"
    item_type = data.get('type')
    title = data.get('title')
    category = data.get('category')
    color = data.get('color')
    location = data.get('location')
    date = data.get('date')
    description = data.get('description')
    contact_name = data.get('contactName')
    contact_info = data.get('contactInfo')
    image_url = data.get('imageUrl', '')
    created_at = data.get('createdAt') or datetime.utcnow().isoformat() + 'Z'

    if not all([item_type, title, category, color, location, date, description, contact_name, contact_info]):
        return jsonify({'error': 'Missing required fields'}), 400

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO items (
            id, type, title, category, color, location, date,
            description, contact_name, contact_info, image_url,
            is_reunited, matched_with_id, reunited_with_title, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL, ?)
    ''', (
        item_id, item_type, title, category, color, location, date,
        description, contact_name, contact_info, image_url, created_at
    ))

    conn.commit()
    conn.close()

    return jsonify({
        'id': item_id,
        'type': item_type,
        'title': title,
        'category': category,
        'color': color,
        'location': location,
        'date': date,
        'description': description,
        'contactName': contact_name,
        'contactInfo': contact_info,
        'imageUrl': image_url,
        'isReunited': False,
        'matchedWithId': None,
        'reunitedWithTitle': None,
        'createdAt': created_at
    }), 201

# 4. Dual-Reunite Items Pair
@app.route('/api/items/<item_id>/reunite', methods=['PUT'])
def api_reunite_pair(item_id):
    data = request.get_json() or {}
    matched_with_id = data.get('matchedWithId')
    action = data.get('action', 'reunite')  # 'reunite' or 'unreunite'

    conn = get_db()
    cursor = conn.cursor()

    if action == 'reunite':
        if not matched_with_id:
            conn.close()
            return jsonify({'error': 'matchedWithId required for reunion'}), 400

        # Retrieve both item titles
        cursor.execute('SELECT id, title FROM items WHERE id = ?', (item_id,))
        item_a = cursor.fetchone()
        cursor.execute('SELECT id, title FROM items WHERE id = ?', (matched_with_id,))
        item_b = cursor.fetchone()

        if not item_a or not item_b:
            conn.close()
            return jsonify({'error': 'One or both items not found'}), 404

        # Update Item A
        cursor.execute('''
            UPDATE items 
            SET is_reunited = 1, matched_with_id = ?, reunited_with_title = ?
            WHERE id = ?
        ''', (item_b['id'], item_b['title'], item_a['id']))

        # Update Item B
        cursor.execute('''
            UPDATE items 
            SET is_reunited = 1, matched_with_id = ?, reunited_with_title = ?
            WHERE id = ?
        ''', (item_a['id'], item_a['title'], item_b['id']))

    else:
        # Un-reunite both
        cursor.execute('SELECT matched_with_id FROM items WHERE id = ?', (item_id,))
        row = cursor.fetchone()
        paired_id = row['matched_with_id'] if row else None

        cursor.execute('''
            UPDATE items 
            SET is_reunited = 0, matched_with_id = NULL, reunited_with_title = NULL
            WHERE id = ?
        ''', (item_id,))

        if paired_id:
            cursor.execute('''
                UPDATE items 
                SET is_reunited = 0, matched_with_id = NULL, reunited_with_title = NULL
                WHERE id = ?
            ''', (paired_id,))

    conn.commit()
    conn.close()

    return jsonify({'success': True, 'action': action})

# 5. Delete an Item
@app.route('/api/items/<item_id>', methods=['DELETE'])
def api_delete_item(item_id):
    conn = get_db()
    cursor = conn.cursor()

    # If linked to another item, un-link the pair
    cursor.execute('SELECT matched_with_id FROM items WHERE id = ?', (item_id,))
    row = cursor.fetchone()
    if row and row['matched_with_id']:
        cursor.execute('''
            UPDATE items 
            SET matched_with_id = NULL, reunited_with_title = NULL 
            WHERE id = ?
        ''', (row['matched_with_id'],))

    cursor.execute('DELETE FROM items WHERE id = ?', (item_id,))
    conn.commit()
    conn.close()

    return jsonify({'success': True, 'deletedId': item_id})

# 6. Reset Demo Records
@app.route('/api/reset-demo', methods=['POST'])
def api_reset_demo():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM items')
    seed_demo_items(cursor)
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Demo data reset successfully'})

# ============================================================================
# STATIC WEB PAGE ROUTES
# ============================================================================

@app.route('/')
def serve_index():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(BASE_DIR, filename)

# ============================================================================
# START SERVER
# ============================================================================

if __name__ == '__main__':
    init_db()
    print("=" * 60)
    print("🎓 CampusFind AI - Python Backend Running!")
    print("📍 Local URL:   http://127.0.0.1:5000")
    print("📍 Network URL: http://0.0.0.0:5000 (accessible across local Wi-Fi)")
    print("🗄️ Database:    SQLite (campus_find.db)")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5000, debug=True)

