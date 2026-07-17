from flask import Blueprint, request, jsonify
from db.models import db, BlogPost
import requests
import os
import re

blog_bp = Blueprint('blog', __name__)

# Helper to generate AI content via Gemini API
def call_gemini_ai(prompt, system_instruction="You are a professional blogging and SEO writing assistant."):
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        return {'error': 'GEMINI_API_KEY not configured in backend environment.'}

    model = os.getenv('GEMINI_MODEL', 'gemini-2.0-flash')
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    
    headers = {'Content-Type': 'application/json'}
    data = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"text": f"{system_instruction}\n\nUser Request: {prompt}"}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 2048
        }
    }

    try:
        response = requests.post(url, headers=headers, json=data, timeout=45)
        response.raise_for_status()
        payload = response.json()
        text_out = payload['candidates'][0]['content']['parts'][0]['text']
        return {'text': text_out}
    except Exception as e:
        print("Gemini Blog AI Error:", e)
        return {'error': str(e)}

# ─── Public Blog Endpoints ───────────────────────────────────────────────

@blog_bp.route('/api/public/blog', methods=['GET'])
def public_list_posts():
    try:
        search = request.args.get('search', '').strip()
        category = request.args.get('category', '').strip()
        
        query = BlogPost.query.filter_by(status='published')
        if search:
            query = query.filter(
                (BlogPost.title.ilike(f'%{search}%')) | 
                (BlogPost.content.ilike(f'%{search}%')) |
                (BlogPost.excerpt.ilike(f'%{search}%'))
            )
        if category and category.lower() != 'all':
            query = query.filter(BlogPost.category.ilike(category))
            
        posts = query.order_by(BlogPost.created_at.desc()).all()
        return jsonify({'success': True, 'posts': [p.to_dict() for p in posts]})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@blog_bp.route('/api/public/blog/<slug>', methods=['GET'])
def public_get_post(slug):
    try:
        post = BlogPost.query.filter_by(slug=slug, status='published').first()
        if not post:
            return jsonify({'success': False, 'error': 'Blog post not found.'}), 404
            
        # Fetch related posts in the same category
        related = BlogPost.query.filter(
            BlogPost.status == 'published',
            BlogPost.id != post.id,
            BlogPost.category == post.category
        ).limit(3).all()
        
        return jsonify({
            'success': True,
            'post': post.to_dict(),
            'related': [p.to_dict() for p in related]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ─── Admin Blog Endpoints (No Auth needed to align with other Admin endpoints) ───

@blog_bp.route('/api/admin/blog', methods=['GET'])
def admin_list_posts():
    try:
        posts = BlogPost.query.order_by(BlogPost.created_at.desc()).all()
        return jsonify({'success': True, 'posts': [p.to_dict() for p in posts]})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@blog_bp.route('/api/admin/blog', methods=['POST'])
def admin_create_post():
    try:
        data = request.get_json() or {}
        title = data.get('title', '').strip()
        if not title:
            return jsonify({'success': False, 'error': 'Title is required.'}), 400
            
        # Auto-slugify title if slug not provided
        slug = data.get('slug', '').strip()
        if not slug:
            slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
            
        # Check unique slug
        exists = BlogPost.query.filter_by(slug=slug).first()
        if exists:
            # Append unique timestamp/id
            import time
            slug = f"{slug}-{int(time.time())}"
            
        post = BlogPost(
            title=title,
            slug=slug,
            content=data.get('content', '').strip(),
            excerpt=data.get('excerpt', '').strip(),
            featured_image=data.get('featured_image', '').strip(),
            status=data.get('status', 'draft'),
            category=data.get('category', 'General').strip() or 'General',
            tags=data.get('tags', '').strip(),
            meta_title=data.get('meta_title', '').strip(),
            meta_description=data.get('meta_description', '').strip(),
            meta_keywords=data.get('meta_keywords', '').strip(),
            focus_keyword=data.get('focus_keyword', '').strip(),
            canonical_url=data.get('canonical_url', '').strip(),
            og_title=data.get('og_title', '').strip(),
            og_description=data.get('og_description', '').strip(),
            og_image=data.get('og_image', '').strip()
        )
        
        db.session.add(post)
        db.session.commit()
        return jsonify({'success': True, 'post': post.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@blog_bp.route('/api/admin/blog/<int:post_id>', methods=['GET'])
def admin_get_post(post_id):
    try:
        post = BlogPost.query.get(post_id)
        if not post:
            return jsonify({'success': False, 'error': 'Post not found'}), 404
            
        return jsonify({'success': True, 'post': post.to_dict()})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@blog_bp.route('/api/admin/blog/<int:post_id>', methods=['PUT'])
def admin_update_post(post_id):
    try:
        post = BlogPost.query.get(post_id)
        if not post:
            return jsonify({'success': False, 'error': 'Post not found'}), 404
            
        data = request.get_json() or {}
        post.title = data.get('title', post.title).strip()
        post.slug = data.get('slug', post.slug).strip()
        post.content = data.get('content', post.content).strip()
        post.excerpt = data.get('excerpt', post.excerpt).strip()
        post.featured_image = data.get('featured_image', post.featured_image).strip()
        post.status = data.get('status', post.status).strip()
        post.category = data.get('category', post.category).strip() or 'General'
        post.tags = data.get('tags', post.tags).strip()
        
        # SEO
        post.meta_title = data.get('meta_title', post.meta_title).strip()
        post.meta_description = data.get('meta_description', post.meta_description).strip()
        post.meta_keywords = data.get('meta_keywords', post.meta_keywords).strip()
        post.focus_keyword = data.get('focus_keyword', post.focus_keyword).strip()
        post.canonical_url = data.get('canonical_url', post.canonical_url).strip()
        post.og_title = data.get('og_title', post.og_title).strip()
        post.og_description = data.get('og_description', post.og_description).strip()
        post.og_image = data.get('og_image', post.og_image).strip()
        
        db.session.commit()
        return jsonify({'success': True, 'post': post.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@blog_bp.route('/api/admin/blog/<int:post_id>', methods=['DELETE'])
def admin_delete_post(post_id):
    try:
        post = BlogPost.query.get(post_id)
        if not post:
            return jsonify({'success': False, 'error': 'Post not found'}), 404
            
        db.session.delete(post)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Post deleted successfully.'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

# ─── Gemini AI Helpers ───────────────────────────────────────────────────

@blog_bp.route('/api/admin/blog/ai-generate', methods=['POST'])
def admin_ai_generate():
    try:
        data = request.get_json() or {}
        action = data.get('action', 'generate').strip()  # 'generate', 'rewrite', 'seo'
        prompt_text = data.get('prompt', '').strip()
        content = data.get('content', '').strip()
        title = data.get('title', '').strip()
        focus_keyword = data.get('focus_keyword', '').strip()

        if action == 'generate':
            if not prompt_text:
                return jsonify({'success': False, 'error': 'Prompt is required for text generation.'}), 400
                
            prompt = f"Write a comprehensive, engaging, SEO-optimized blog section or article outline. Keep it structured with headings (use standard HTML h2, h3, h4 tags) and paragraphs. Topic/Prompt: {prompt_text}"
            res = call_gemini_ai(prompt)
            
        elif action == 'rewrite':
            if not content:
                return jsonify({'success': False, 'error': 'Content is required for rewriting.'}), 400
                
            prompt = f"Rewrite, polish and expand the following text to make it read more professionally. Use proper HTML tags (h3, p, strong) where relevant. Prompt/Instruction: {prompt_text or 'Improve readability and SEO keyword integration.'}\n\nOriginal Content:\n{content}"
            res = call_gemini_ai(prompt)
            
        elif action == 'seo':
            if not title:
                return jsonify({'success': False, 'error': 'Title is required for generating SEO tags.'}), 400
                
            prompt = f"""Generate optimal SEO Meta Tags and Open Graph fields for a blog post based on:
Title: {title}
Focus Keyword: {focus_keyword}
Content summary/excerpt: {content[:800]}

Return ONLY a valid JSON object with the following exact keys (no markdown formatting, no code blocks):
{{
  "meta_title": "SEO optimized Title tags (max 60 chars)",
  "meta_description": "Meta description (max 160 chars)",
  "meta_keywords": "comma separated, keywords",
  "og_title": "Open Graph title",
  "og_description": "Open Graph description"
}}"""
            res = call_gemini_ai(prompt, system_instruction="You are an expert SEO optimization bot. Return raw JSON ONLY.")
            
            # Extract JSON from response text if it has markdown formatting
            if 'text' in res:
                clean_text = res['text'].strip()
                if clean_text.startswith('```'):
                    clean_text = re.sub(r'^```json\s*|\s*```$', '', clean_text, flags=re.MULTILINE).strip()
                try:
                    import json
                    res['data'] = json.loads(clean_text)
                except Exception as je:
                    res['error'] = f"Failed to parse JSON response: {je}"
                    
        else:
            return jsonify({'success': False, 'error': 'Invalid action'}), 400
            
        return jsonify({'success': True, 'result': res})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
