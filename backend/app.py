from flask import Flask
from flask_cors import CORS
from config import Config
from db.pool import init_db
from routes.results import results_bp
from routes.questions import questions_bp
from routes.user import user_bp
from routes.live_stats import live_stats_bp
import stripe

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.url_map.strict_slashes = False
    CORS(app)
    init_db(app)
    
    # Stripe
    stripe.api_key = app.config['STRIPE_SECRET_KEY']
    
    # Register blueprints
    app.register_blueprint(results_bp)
    app.register_blueprint(questions_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(live_stats_bp)
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(e):
        return {'error': 'Not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(e):
        return {'error': 'Internal server error'}, 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)