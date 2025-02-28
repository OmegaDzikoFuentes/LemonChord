# app/utils/errors.py

from flask import jsonify, current_app

# Standard API response formats
def api_error(message, status_code=400, errors=None):
    """
    Standardized error response
    
    Args:
        message (str): Main error message
        status_code (int): HTTP status code
        errors (dict, optional): Detailed field-specific errors
    """
    response = {
        'success': False,
        'error': message
    }
    
    if errors:
        response['errors'] = errors
        
    return jsonify(response), status_code

def api_success(data=None, message=None, status_code=200):
    """
    Standardized success response
    
    Args:
        data (any, optional): Response data
        message (str, optional): Success message
        status_code (int): HTTP status code
    """
    response = {'success': True}
    
    if data is not None:
        response['data'] = data
    if message is not None:
        response['message'] = message
        
    return jsonify(response), status_code

# Custom exception classes
class APIError(Exception):
    """Base exception for API errors with status code handling"""
    def __init__(self, message, status_code=400, errors=None):
        self.message = message
        self.status_code = status_code
        self.errors = errors
        super().__init__(self.message)

class ValidationError(APIError):
    """Raised when request data fails validation"""
    def __init__(self, message="Invalid input data", errors=None):
        super().__init__(message, status_code=400, errors=errors)

class AuthorizationError(APIError):
    """Raised for authentication/authorization failures"""
    def __init__(self, message="Access denied"):
        super().__init__(message, status_code=403)

class ResourceNotFoundError(APIError):
    """Raised when requested resource doesn't exist"""
    def __init__(self, resource_type="Resource"):
        super().__init__(f"{resource_type} not found", status_code=404)

class FileUploadError(APIError):
    """Raised when file upload operations fail"""
    def __init__(self, message="File upload failed", errors=None):
        super().__init__(message, status_code=422, errors=errors)

# File/Upload validation functions
def validate_file_size(file, max_size_mb=10):
    """Validate file size"""
    max_bytes = max_size_mb * 1024 * 1024
    
    # Check if content_length is available in request
    if hasattr(file, 'content_length') and file.content_length > max_bytes:
        raise ValidationError(
            f"File too large. Maximum size: {max_size_mb}MB",
            errors={"file": "Maximum file size exceeded"}
        )
    
    # Alternative: seek to end and check size
    file_pos = file.tell()  # Save current position
    file.seek(0, 2)  # Seek to end
    size = file.tell()
    file.seek(file_pos)  # Reset to original position
    
    if size > max_bytes:
        raise ValidationError(
            f"File too large. Maximum size: {max_size_mb}MB",
            errors={"file": "Maximum file size exceeded"}
        )
    
    return True

def validate_file_extension(filename, allowed_extensions):
    """Validate file extension"""
    if '.' not in filename:
        raise ValidationError(
            "Invalid file", 
            errors={"file": "No file extension"}
        )
    
    ext = filename.rsplit('.', 1)[1].lower()
    if ext not in allowed_extensions:
        raise ValidationError(
            f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}",
            errors={"file": "Invalid file extension"}
        )
    
    return True

# Register error handlers with Flask app
def register_error_handlers(app):
    @app.errorhandler(APIError)
    def handle_api_error(error):
        return api_error(error.message, error.status_code, error.errors)
    
    @app.errorhandler(Exception)
    def handle_generic_exception(error):
        # Only catch unhandled exceptions in production
        if not app.debug:
            current_app.logger.exception("Unhandled exception occurred")
            return api_error("Internal server error", 500)
        # In debug mode, let the error propagate for better debugging
        raise error