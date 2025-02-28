from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed, FileRequired
from wtforms import StringField
from wtforms.validators import DataRequired

ALLOWED_EXTENSIONS = ['mp3', 'wav', 'ogg', 'flac', 'm4a']

class UploadForm(FlaskForm):
    title = StringField('Title', validators=[DataRequired()])
    genre = StringField('Genre')
    duration = StringField('Duration')
    audio_file = FileField(
        'Audio File',
        validators=[
            FileRequired(message="Audio file is required"),
            FileAllowed(ALLOWED_EXTENSIONS, message="Only audio files are allowed")
        ]
    )
