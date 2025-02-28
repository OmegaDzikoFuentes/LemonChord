from flask import Blueprint, request, jsonify
from flask_login import current_user, login_user, logout_user
from app.models import User, db
from app.forms import LoginForm, SignUpForm
from app.utils.errors import api_success, ValidationError
from flask_wtf.csrf import validate_csrf

auth_routes = Blueprint('auth', __name__)

@auth_routes.route('/')
def authenticate():
    if current_user.is_authenticated:
        return api_success(data=current_user.to_dict())
    return jsonify({'errors': {'message': 'Unauthorized'}}), 401

@auth_routes.route('/login', methods=['POST'])
def login():
    form = LoginForm()
    form['csrf_token'].data = request.cookies.get('csrf_token')
    
    if not form.csrf_token.validate(form):
        raise ValidationError("CSRF token is invalid", errors={"csrf_token": "Invalid"})
    
    if form.validate_on_submit():
        user = User.query.filter(User.email == form.data['email']).first()
        if not user:
            raise ValidationError("Email not found", errors={"email": "Email not found"})
        if not user.check_password(form.data['password']):
            raise ValidationError("Password is incorrect", errors={"password": "Incorrect password"})
        login_user(user)
        return api_success(data=user.to_dict())
    
    raise ValidationError("Validation failed", errors=form.errors)

@auth_routes.route('/logout')
def logout():
    logout_user()
    return api_success(message="User logged out")

@auth_routes.route('/signup', methods=['POST'])
def sign_up():
    form = SignUpForm()
    form['csrf_token'].data = request.cookies.get('csrf_token')
    
    if not form.csrf_token.validate(form):
        raise ValidationError("CSRF token is invalid", errors={"csrf_token": "Invalid"})
    
    if form.validate_on_submit():
        user = User(
            username=form.data['username'],
            email=form.data['email'],
            password=form.data['password']
        )
        db.session.add(user)
        db.session.commit()
        login_user(user)
        return api_success(data=user.to_dict())
    
    raise ValidationError("Validation failed", errors=form.errors)

@auth_routes.route('/unauthorized')
def unauthorized():
    raise ValidationError("Unauthorized", errors={"message": "Unauthorized"})
