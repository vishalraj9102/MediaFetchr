import os
import json
import uuid
import time
import threading
from datetime import datetime, timedelta
from urllib.parse import urlparse
import requests
import yt_dlp
import validators
from flask import Flask, request, jsonify, send_file, abort
from flask_cors import CORS
import redis

app = Flask(__name__)
CORS(app)

# Configuration
app.config['UPLOAD_FOLDER'] = os.environ.get('UPLOAD_FOLDER', 'uploads')
def parse_file_size(size_str):
    """Parse file size string like '500MB' to bytes"""
    if isinstance(size_str, int):
        return size_str
    
    size_str = str(size_str).upper().strip()
    if size_str.endswith('MB'):
        return int(size_str[:-2]) * 1024 * 1024
    elif size_str.endswith('GB'):
        return int(size_str[:-2]) * 1024 * 1024 * 1024
    elif size_str.endswith('KB'):
        return int(size_str[:-2]) * 1024
    else:
        return int(size_str)

app.config['MAX_FILE_SIZE'] = parse_file_size(os.environ.get('MAX_FILE_SIZE', '500MB'))
app.config['REDIS_URL'] = os.environ.get('REDIS_URL', 'redis://localhost:6379')

# Initialize Redis
try:
    redis_client = redis.from_url(app.config['REDIS_URL'])
    redis_client.ping()  # Test connection
    REDIS_AVAILABLE = True
except:
    redis_client = None
    REDIS_AVAILABLE = False
    print("Warning: Redis not available, using in-memory storage for development")

# In-memory storage for development when Redis is not available
if not REDIS_AVAILABLE:
    task_storage = {}

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Allowed domains for security
ALLOWED_DOMAINS = {
    'youtube.com', 'youtu.be', 'www.youtube.com',
    'instagram.com', 'www.instagram.com',
    'facebook.com', 'www.facebook.com', 'fb.com',
    'twitter.com', 'www.twitter.com', 'x.com',
    'tiktok.com', 'www.tiktok.com',
    'vimeo.com', 'www.vimeo.com',
    'dailymotion.com', 'www.dailymotion.com'
}

def is_allowed_domain(url):
    """Check if the URL domain is in the allowed list"""
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        return domain in ALLOWED_DOMAINS or domain.startswith('www.') and domain[4:] in ALLOWED_DOMAINS
    except:
        return False

def is_direct_file_url(url):
    """Check if URL is a direct file link"""
    try:
        parsed = urlparse(url)
        return any(parsed.path.lower().endswith(ext) for ext in 
                  ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.jpg', '.jpeg', '.png', '.gif', '.mp3', '.wav', '.flac'])
    except:
        return False

def get_file_info(url):
    """Get file information from URL"""
    try:
        response = requests.head(url, timeout=10, allow_redirects=True)
        if response.status_code == 200:
            content_type = response.headers.get('content-type', '')
            content_length = int(response.headers.get('content-length', 0))
            
            # Determine file type
            if 'video' in content_type:
                file_type = 'video'
            elif 'image' in content_type:
                file_type = 'image'
            elif 'audio' in content_type:
                file_type = 'audio'
            else:
                file_type = 'unknown'
            
            return {
                'type': file_type,
                'size': content_length,
                'content_type': content_type,
                'filename': url.split('/')[-1] or f"file_{int(time.time())}"
            }
    except Exception as e:
        return None

def get_platform_info(url):
    """Get media information from supported platforms"""
    try:
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # Determine file type
            if info.get('_type') == 'playlist':
                return None  # Don't support playlists
            
            file_type = 'video'
            if info.get('vcodec') == 'none':
                file_type = 'audio'
            
            return {
                'type': file_type,
                'title': info.get('title', 'Unknown'),
                'duration': info.get('duration'),
                'thumbnail': info.get('thumbnail'),
                'filename': f"{info.get('title', 'media')}_{int(time.time())}"
            }
    except Exception as e:
        return None

def download_file(url, filename, task_id):
    """Download file from URL"""
    try:
        # Update task status
        if REDIS_AVAILABLE:
            redis_client.setex(f"task:{task_id}:status", 3600, "downloading")
        else:
            task_storage[f"task:{task_id}:status"] = "downloading"
        
        if is_direct_file_url(url):
            # Direct file download
            response = requests.get(url, stream=True, timeout=30)
            response.raise_for_status()
            
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            with open(file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
        else:
            # Platform download using yt-dlp
            ydl_opts = {
                'outtmpl': os.path.join(app.config['UPLOAD_FOLDER'], filename),
                'quiet': True,
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
        
        # Update task status to completed
        if REDIS_AVAILABLE:
            redis_client.setex(f"task:{task_id}:status", 3600, "completed")
            redis_client.setex(f"task:{task_id}:filename", 3600, filename)
        else:
            task_storage[f"task:{task_id}:status"] = "completed"
            task_storage[f"task:{task_id}:filename"] = filename
        
        # Schedule file deletion after 1 hour
        threading.Timer(3600, lambda: delete_file(filename)).start()
        
        return True
    except Exception as e:
        if REDIS_AVAILABLE:
            redis_client.setex(f"task:{task_id}:status", 3600, "failed")
            redis_client.setex(f"task:{task_id}:error", 3600, str(e))
        else:
            task_storage[f"task:{task_id}:status"] = "failed"
            task_storage[f"task:{task_id}:error"] = str(e)
        return False

def delete_file(filename):
    """Delete file from uploads directory"""
    try:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        if os.path.exists(file_path):
            os.remove(file_path)
    except:
        pass

@app.route('/api/ping', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/api/analyze', methods=['POST'])
def analyze_link():
    """Analyze the provided URL and return media information"""
    try:
        data = request.get_json()
        url = data.get('url', '').strip()
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        if not validators.url(url):
            return jsonify({'error': 'Invalid URL format'}), 400
        
        # Check if domain is allowed
        if not is_allowed_domain(url) and not is_direct_file_url(url):
            return jsonify({'error': 'Domain not supported or not a direct file URL'}), 400
        
        # Get media information
        if is_direct_file_url(url):
            info = get_file_info(url)
        else:
            info = get_platform_info(url)
        
        if not info:
            return jsonify({'error': 'Could not analyze the provided URL'}), 400
        
        return jsonify({
            'success': True,
            'info': info,
            'url': url
        })
        
    except Exception as e:
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500

@app.route('/api/download', methods=['POST'])
def start_download():
    """Start downloading the media file"""
    try:
        data = request.get_json()
        url = data.get('url', '').strip()
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        # Validate URL again
        if not validators.url(url):
            return jsonify({'error': 'Invalid URL format'}), 400
        
        if not is_allowed_domain(url) and not is_direct_file_url(url):
            return jsonify({'error': 'Domain not supported or not a direct file URL'}), 400
        
        # Generate task ID and filename
        task_id = str(uuid.uuid4())
        timestamp = int(time.time())
        
        # Get file info to determine extension
        if is_direct_file_url(url):
            info = get_file_info(url)
            if info:
                filename = f"{timestamp}_{info['filename']}"
            else:
                filename = f"{timestamp}_file"
        else:
            info = get_platform_info(url)
            if info:
                filename = f"{timestamp}_{info['filename']}"
            else:
                filename = f"{timestamp}_media"
        
        # Initialize task status
        if REDIS_AVAILABLE:
            redis_client.setex(f"task:{task_id}:status", 3600, "starting")
            redis_client.setex(f"task:{task_id}:url", 3600, url)
            redis_client.setex(f"task:{task_id}:filename", 3600, filename)
        else:
            task_storage[f"task:{task_id}:status"] = "starting"
            task_storage[f"task:{task_id}:url"] = url
            task_storage[f"task:{task_id}:filename"] = filename
        
        # Start download in background thread
        thread = threading.Thread(target=download_file, args=(url, filename, task_id))
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'success': True,
            'task_id': task_id,
            'status': 'starting'
        })
        
    except Exception as e:
        return jsonify({'error': f'Download failed: {str(e)}'}), 500

@app.route('/api/status/<task_id>', methods=['GET'])
def get_status(task_id):
    """Get download status for a task"""
    try:
        if REDIS_AVAILABLE:
            status = redis_client.get(f"task:{task_id}:status")
            if not status:
                return jsonify({'error': 'Task not found'}), 404
            status = status.decode('utf-8')
        else:
            status = task_storage.get(f"task:{task_id}:status")
            if not status:
                return jsonify({'error': 'Task not found'}), 404
        
        result = {'task_id': task_id, 'status': status}
        
        if status == 'completed':
            if REDIS_AVAILABLE:
                filename = redis_client.get(f"task:{task_id}:filename")
                if filename:
                    result['filename'] = filename.decode('utf-8')
                    result['download_url'] = f"/api/file/{filename.decode('utf-8')}"
            else:
                filename = task_storage.get(f"task:{task_id}:filename")
                if filename:
                    result['filename'] = filename
                    result['download_url'] = f"/api/file/{filename}"
        
        elif status == 'failed':
            if REDIS_AVAILABLE:
                error = redis_client.get(f"task:{task_id}:error")
                if error:
                    result['error'] = error.decode('utf-8')
            else:
                error = task_storage.get(f"task:{task_id}:error")
                if error:
                    result['error'] = error
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': f'Status check failed: {str(e)}'}), 500

@app.route('/api/file/<filename>', methods=['GET'])
def get_file(filename):
    """Serve the downloaded file"""
    try:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404
        
        # Check if file is too old (more than 1 hour)
        file_time = datetime.fromtimestamp(os.path.getctime(file_path))
        if datetime.now() - file_time > timedelta(hours=1):
            delete_file(filename)
            return jsonify({'error': 'File expired'}), 410
        
        return send_file(file_path, as_attachment=True)
        
    except Exception as e:
        return jsonify({'error': f'File serving failed: {str(e)}'}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False) 