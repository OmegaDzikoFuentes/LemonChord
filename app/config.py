import os


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    FLASK_RUN_PORT = os.environ.get('FLASK_RUN_PORT')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # SQLAlchemy 1.4 no longer supports url strings that start with 'postgres'
    # (only 'postgresql') but heroku's postgres add-on automatically sets the
    # url in the hidden config vars to start with postgres.
    # so the connection uri must be updated here (for production)
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL').replace('postgres://', 'postgresql://')
    SQLALCHEMY_ECHO = True
    
    # File upload settings
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'uploads')
    MAX_CONTENT_LENGTH = 100 * 1024 * 1024  # 100MB limit for file uploads
    
    # AWS S3 Configuration
    USE_S3 = os.environ.get('USE_S3', 'False') == 'True'
    AWS_ACCESS_KEY = os.environ.get('S3_KEY')
    AWS_SECRET_KEY = os.environ.get('S3_SECRET')
    AWS_REGION = os.environ.get('S3_REGION', 'us-east-2')
    S3_BUCKET = os.environ.get('S3_BUCKET')