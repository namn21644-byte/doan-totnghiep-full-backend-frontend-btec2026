from flask import Flask

from app.routes.scan_routes import scan_bp
from app.config import Config


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.register_blueprint(scan_bp, url_prefix='/api')
    return app
