from flask import Blueprint, request, jsonify
from app.models import User, db
from app.forms import LoginForm, SignUpForm
from flask_login import current_user, login_user, logout_user
from flask_wtf.csrf import validate_csrf

auth_routes = Blueprint('auth', __name__)

@auth_routes.route('/')
def authenticate():
    if current_user.is_authenticated:
        return current_user.to_dict()
    return jsonify({'errors': {'message': 'Unauthorized'}}), 401

@auth_routes.route('/login', methods=['POST'])
def login():
    form = LoginForm()
    form['csrf_token'].data = request.cookies['csrf_token']

    # Explicitly check CSRF validation
    if not form.csrf_token.validate(form, extra_validators=None):
        return jsonify({'errors': {'csrf_token': 'CSRF token is invalid.'}}), 400

    if form.validate_on_submit():
        user = User.query.filter(User.email == form.data['email']).first()
        if not user:
            return jsonify({'errors': {'email': 'Email not found.'}}), 401

        if not user.check_password(form.data['password']):
            return jsonify({'errors': {'password': 'Password is incorrect.'}}), 401

        login_user(user)
        return jsonify(user.to_dict()), 200
    return jsonify({'errors': form.errors}), 400

@auth_routes.route('/logout')
def logout():
    logout_user()
    return jsonify({'message': 'User logged out'}), 200

@auth_routes.route('/signup', methods=['POST'])
def sign_up():
    form = SignUpForm()
    form['csrf_token'].data = request.cookies['csrf_token']

    # Explicitly check CSRF validation
    if not form.csrf_token.validate(form, extra_validators=None):
        return jsonify({'errors': {'csrf_token': 'CSRF token is invalid.'}}), 400

    if form.validate_on_submit():
        user = User(
            username=form.data['username'],
            email=form.data['email'],
            password=form.data['password']
        )
        db.session.add(user)
        db.session.commit()
        login_user(user)
        return jsonify(user.to_dict()), 200
    return jsonify({'errors': form.errors}), 400

@auth_routes.route('/unauthorized')
def unauthorized():
    return jsonify({'errors': {'message': 'Unauthorized'}}), 401