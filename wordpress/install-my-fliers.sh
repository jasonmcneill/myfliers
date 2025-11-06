#!/bin/bash

# My Fliers WordPress Plugin - Installation Script
# This script creates the proper directory structure and all necessary files

echo "Creating My Fliers WordPress Plugin..."

# Create main plugin directory
mkdir -p my-fliers/build

# Create main plugin file
cat > my-fliers/my-fliers.php << 'EOF'
<?php
/**
 * Plugin Name: My Fliers
 * Plugin URI: https://example.com/my-fliers
 * Description: A React SPA for managing flier uploads with CRUD operations
 * Version: 1.0.0
 * Author: Your Name
 * License: GPL v2 or later
 * Text Domain: my-fliers
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class MyFliers {
    private static $instance = null;
    private $table_name;

    public static function getInstance() {
        if (self::$instance == null) {
            self::$instance = new MyFliers();
        }
        return self::$instance;
    }

    private function __construct() {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'my_fliers';
        
        // Activation hook
        register_activation_hook(__FILE__, [$this, 'activate']);
        
        // Admin menu
        add_action('admin_menu', [$this, 'addAdminMenu']);
        
        // Enqueue scripts
        add_action('admin_enqueue_scripts', [$this, 'enqueueScripts']);
        
        // REST API endpoints
        add_action('rest_api_init', [$this, 'registerRestRoutes']);
    }

    public function activate() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE IF NOT EXISTS {$this->table_name} (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            attachment_id bigint(20) NOT NULL,
            image_url text NOT NULL,
            image_hash varchar(64) NOT NULL,
            uploaded_by bigint(20) NOT NULL,
            uploaded_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY image_hash (image_hash),
            KEY attachment_id (attachment_id)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }

    public function addAdminMenu() {
        add_menu_page(
            'My Fliers',
            'My Fliers',
            'upload_files',
            'my-fliers',
            [$this, 'renderAdminPage'],
            'dashicons-format-image',
            30
        );
    }

    public function renderAdminPage() {
        echo '<div id="my-fliers-root"></div>';
    }

    public function enqueueScripts($hook) {
        if ($hook !== 'toplevel_page_my-fliers') {
            return;
        }

        wp_enqueue_media();
        
        wp_enqueue_script(
            'my-fliers-react',
            'https://unpkg.com/react@18/umd/react.production.min.js',
            [],
            '18.0.0',
            true
        );
        
        wp_enqueue_script(
            'my-fliers-react-dom',
            'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
            ['my-fliers-react'],
            '18.0.0',
            true
        );

        wp_enqueue_script(
            'my-fliers-app',
            plugin_dir_url(__FILE__) . 'build/app.js',
            ['my-fliers-react', 'my-fliers-react-dom'],
            '1.0.0',
            true
        );

        wp_localize_script('my-fliers-app', 'myFliersData', [
            'apiUrl' => rest_url('my-fliers/v1'),
            'nonce' => wp_create_nonce('wp_rest')
        ]);

        wp_enqueue_style(
            'my-fliers-styles',
            plugin_dir_url(__FILE__) . 'build/styles.css',
            [],
            '1.0.0'
        );
    }

    public function registerRestRoutes() {
        // Get all fliers
        register_rest_route('my-fliers/v1', '/fliers', [
            'methods' => 'GET',
            'callback' => [$this, 'getFliers'],
            'permission_callback' => function() {
                return current_user_can('upload_files');
            }
        ]);

        // Upload flier
        register_rest_route('my-fliers/v1', '/fliers', [
            'methods' => 'POST',
            'callback' => [$this, 'uploadFlier'],
            'permission_callback' => function() {
                return current_user_can('upload_files');
            }
        ]);

        // Delete flier
        register_rest_route('my-fliers/v1', '/fliers/(?P<id>\d+)', [
            'methods' => 'DELETE',
            'callback' => [$this, 'deleteFlier'],
            'permission_callback' => function() {
                return current_user_can('upload_files');
            }
        ]);
    }

    public function getFliers($request) {
        global $wpdb;
        
        $results = $wpdb->get_results(
            "SELECT f.*, u.display_name as uploader_name 
             FROM {$this->table_name} f 
             LEFT JOIN {$wpdb->users} u ON f.uploaded_by = u.ID 
             ORDER BY f.uploaded_at DESC"
        );

        $fliers = array_map(function($row) {
            return [
                'id' => (int)$row->id,
                'url' => $row->image_url,
                'uploaded_at' => $row->uploaded_at,
                'uploaded_by' => (int)$row->uploaded_by,
                'uploader_name' => $row->uploader_name
            ];
        }, $results);

        return new WP_REST_Response(['fliers' => $fliers], 200);
    }

    private function calculateFileHash($file_path) {
        return hash_file('sha256', $file_path);
    }

    public function uploadFlier($request) {
        global $wpdb;
        
        $files = $request->get_file_params();
        
        if (empty($files['file'])) {
            return new WP_Error('no_file', 'No file uploaded', ['status' => 400]);
        }

        $file = $files['file'];
        
        // Calculate hash before upload
        $file_hash = $this->calculateFileHash($file['tmp_name']);
        
        // Check if file with same hash already exists
        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->table_name} WHERE image_hash = %s",
            $file_hash
        ));

        if ($existing) {
            // File already exists, return existing data
            $fliers = $this->getAllFliers();
            return new WP_REST_Response([
                'success' => true,
                'message' => 'File already exists',
                'url' => $existing->image_url,
                'fliers' => $fliers
            ], 200);
        }

        // Upload file
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/media.php');
        require_once(ABSPATH . 'wp-admin/includes/image.php');

        $attachment_id = media_handle_upload('file', 0);

        if (is_wp_error($attachment_id)) {
            return new WP_Error('upload_failed', $attachment_id->get_error_message(), ['status' => 500]);
        }

        $image_url = wp_get_attachment_url($attachment_id);
        $user_id = get_current_user_id();

        // Insert into database
        $wpdb->insert(
            $this->table_name,
            [
                'attachment_id' => $attachment_id,
                'image_url' => $image_url,
                'image_hash' => $file_hash,
                'uploaded_by' => $user_id,
                'uploaded_at' => current_time('mysql')
            ],
            ['%d', '%s', '%s', '%d', '%s']
        );

        $fliers = $this->getAllFliers();

        return new WP_REST_Response([
            'success' => true,
            'url' => $image_url,
            'fliers' => $fliers
        ], 200);
    }

    public function deleteFlier($request) {
        global $wpdb;
        
        $id = (int)$request['id'];
        
        // Get flier data
        $flier = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->table_name} WHERE id = %d",
            $id
        ));

        if (!$flier) {
            return new WP_Error('not_found', 'Flier not found', ['status' => 404]);
        }

        // Check if other records use the same attachment
        $count = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$this->table_name} WHERE attachment_id = %d",
            $flier->attachment_id
        ));

        // Delete from database
        $wpdb->delete($this->table_name, ['id' => $id], ['%d']);

        // If no other records use this attachment, delete the attachment
        if ($count <= 1) {
            wp_delete_attachment($flier->attachment_id, true);
        }

        $fliers = $this->getAllFliers();

        return new WP_REST_Response([
            'success' => true,
            'fliers' => $fliers
        ], 200);
    }

    private function getAllFliers() {
        global $wpdb;
        
        $results = $wpdb->get_results(
            "SELECT f.*, u.display_name as uploader_name 
             FROM {$this->table_name} f 
             LEFT JOIN {$wpdb->users} u ON f.uploaded_by = u.ID 
             ORDER BY f.uploaded_at DESC"
        );

        return array_map(function($row) {
            return [
                'id' => (int)$row->id,
                'url' => $row->image_url,
                'uploaded_at' => $row->uploaded_at,
                'uploaded_by' => (int)$row->uploaded_by,
                'uploader_name' => $row->uploader_name
            ];
        }, $results);
    }
}

// Initialize plugin
MyFliers::getInstance();
EOF

# Create React app JavaScript
cat > my-fliers/build/app.js << 'EOF'
(function() {
    const { useState, useEffect } = React;

    function MyFliersApp() {
        const [fliers, setFliers] = useState([]);
        const [loading, setLoading] = useState(false);
        const [uploading, setUploading] = useState(false);
        const [message, setMessage] = useState(null);

        useEffect(() => {
            loadFliers();
        }, []);

        const loadFliers = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${myFliersData.apiUrl}/fliers`, {
                    headers: {
                        'X-WP-Nonce': myFliersData.nonce
                    }
                });
                const data = await response.json();
                setFliers(data.fliers || []);
            } catch (error) {
                showMessage('Error loading fliers: ' + error.message, 'error');
            } finally {
                setLoading(false);
            }
        };

        const handleFileUpload = async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            // Validate file type
            if (!file.type.startsWith('image/')) {
                showMessage('Please upload an image file', 'error');
                event.target.value = '';
                return;
            }

            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch(`${myFliersData.apiUrl}/fliers`, {
                    method: 'POST',
                    headers: {
                        'X-WP-Nonce': myFliersData.nonce
                    },
                    body: formData
                });

                const data = await response.json();
                
                if (data.success) {
                    setFliers(data.fliers || []);
                    showMessage(data.message || 'Flier uploaded successfully!', 'success');
                } else {
                    showMessage('Upload failed', 'error');
                }
            } catch (error) {
                showMessage('Error uploading flier: ' + error.message, 'error');
            } finally {
                setUploading(false);
                event.target.value = '';
            }
        };

        const handleDelete = async (id) => {
            if (!confirm('Are you sure you want to delete this flier?')) {
                return;
            }

            setLoading(true);
            try {
                const response = await fetch(`${myFliersData.apiUrl}/fliers/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'X-WP-Nonce': myFliersData.nonce
                    }
                });

                const data = await response.json();
                
                if (data.success) {
                    setFliers(data.fliers || []);
                    showMessage('Flier deleted successfully!', 'success');
                } else {
                    showMessage('Delete failed', 'error');
                }
            } catch (error) {
                showMessage('Error deleting flier: ' + error.message, 'error');
            } finally {
                setLoading(false);
            }
        };

        const showMessage = (text, type) => {
            setMessage({ text, type });
            setTimeout(() => setMessage(null), 5000);
        };

        const formatDate = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        return React.createElement('div', { className: 'my-fliers-container' },
            React.createElement('div', { className: 'my-fliers-header' },
                React.createElement('h1', null, 'My Fliers'),
                React.createElement('div', { className: 'upload-section' },
                    React.createElement('label', { 
                        className: 'upload-button',
                        htmlFor: 'flier-upload'
                    },
                        uploading ? 'Uploading...' : 'Upload New Flier'
                    ),
                    React.createElement('input', {
                        id: 'flier-upload',
                        type: 'file',
                        accept: 'image/*',
                        onChange: handleFileUpload,
                        disabled: uploading,
                        style: { display: 'none' }
                    })
                )
            ),

            message && React.createElement('div', { 
                className: `message message-${message.type}` 
            }, message.text),

            loading && fliers.length === 0 ? 
                React.createElement('div', { className: 'loading' }, 'Loading fliers...') :
                fliers.length === 0 ?
                    React.createElement('div', { className: 'empty-state' },
                        React.createElement('p', null, 'No fliers uploaded yet. Upload your first flier to get started!')
                    ) :
                    React.createElement('div', { className: 'fliers-grid' },
                        fliers.map(flier =>
                            React.createElement('div', { 
                                key: flier.id, 
                                className: 'flier-card' 
                            },
                                React.createElement('div', { className: 'flier-image-container' },
                                    React.createElement('img', {
                                        src: flier.url,
                                        alt: 'Flier',
                                        className: 'flier-image'
                                    })
                                ),
                                React.createElement('div', { className: 'flier-info' },
                                    React.createElement('div', { className: 'flier-meta' },
                                        React.createElement('span', { className: 'flier-user' },
                                            'Uploaded by: ', flier.uploader_name
                                        ),
                                        React.createElement('span', { className: 'flier-date' },
                                            formatDate(flier.uploaded_at)
                                        )
                                    ),
                                    React.createElement('div', { className: 'flier-actions' },
                                        React.createElement('a', {
                                            href: flier.url,
                                            target: '_blank',
                                            rel: 'noopener noreferrer',
                                            className: 'button button-view'
                                        }, 'View'),
                                        React.createElement('button', {
                                            onClick: () => handleDelete(flier.id),
                                            className: 'button button-delete',
                                            disabled: loading
                                        }, 'Delete')
                                    )
                                )
                            )
                        )
                    )
        );
    }

    // Mount the app
    const root = ReactDOM.createRoot(document.getElementById('my-fliers-root'));
    root.render(React.createElement(MyFliersApp));
})();
EOF

# Create CSS styles
cat > my-fliers/build/styles.css << 'EOF'
.my-fliers-container {
    max-width: 1400px;
    margin: 20px;
    padding: 20px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.my-fliers-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 2px solid #e5e5e5;
}

.my-fliers-header h1 {
    margin: 0;
    font-size: 28px;
    color: #23282d;
}

.upload-section {
    display: flex;
    gap: 10px;
}

.upload-button {
    display: inline-block;
    padding: 10px 20px;
    background: #2271b1;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: background 0.2s;
}

.upload-button:hover {
    background: #135e96;
}

.message {
    padding: 12px 20px;
    margin-bottom: 20px;
    border-radius: 4px;
    font-size: 14px;
}

.message-success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.message-error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.loading {
    text-align: center;
    padding: 40px;
    color: #666;
    font-size: 16px;
}

.empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #666;
}

.empty-state p {
    font-size: 16px;
    margin: 0;
}

.fliers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
}

.flier-card {
    background: #fff;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    overflow: hidden;
    transition: box-shadow 0.2s;
}

.flier-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.flier-image-container {
    width: 100%;
    height: 300px;
    overflow: hidden;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
}

.flier-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.flier-info {
    padding: 16px;
}

.flier-meta {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 13px;
    color: #666;
}

.flier-user {
    font-weight: 600;
    color: #23282d;
}

.flier-date {
    color: #999;
}

.flier-actions {
    display: flex;
    gap: 10px;
}

.button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    text-decoration: none;
    display: inline-block;
    text-align: center;
    transition: all 0.2s;
}

.button-view {
    background: #f0f0f1;
    color: #2271b1;
    flex: 1;
}

.button-view:hover {
    background: #dcdcde;
}

.button-delete {
    background: #dc3545;
    color: white;
    flex: 1;
}

.button-delete:hover {
    background: #c82333;
}

.button-delete:disabled {
    background: #999;
    cursor: not-allowed;
    opacity: 0.6;
}

@media (max-width: 768px) {
    .my-fliers-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
    }

    .fliers-grid {
        grid-template-columns: 1fr;
    }
}
EOF

# Create README
cat > my-fliers/README.md << 'EOF'
# My Fliers WordPress Plugin

A React-based single page application for managing flier uploads in WordPress.

## Features

- Upload image fliers with SHA-256 duplicate detection
- View all uploaded fliers with metadata
- Delete fliers (requires confirmation)
- User tracking for each upload
- Responsive grid layout
- REST API for external integrations

## Installation

1. Upload the `my-fliers` folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Access "My Fliers" from the WordPress admin menu

## API Endpoints

- GET `/wp-json/my-fliers/v1/fliers` - Get all fliers
- POST `/wp-json/my-fliers/v1/fliers` - Upload new flier
- DELETE `/wp-json/my-fliers/v1/fliers/{id}` - Delete flier

## Requirements

- WordPress 5.0 or higher
- PHP 7.4 or higher
- User must have `upload_files` capability

## License

GPL v2 or later
EOF

# Create ZIP file
echo "Creating ZIP file..."
zip -r my-fliers.zip my-fliers/

echo ""
echo "✅ Plugin created successfully!"
echo ""
echo "📦 Files created:"
echo "   - my-fliers/my-fliers.php (Main plugin file)"
echo "   - my-fliers/build/app.js (React application)"
echo "   - my-fliers/build/styles.css (Styles)"
echo "   - my-fliers/README.md (Documentation)"
echo ""
echo "📦 ZIP file created: my-fliers.zip"
echo ""
echo "🚀 To install:"
echo "   1. Go to WordPress Admin > Plugins > Add New"
echo "   2. Click 'Upload Plugin'"
echo "   3. Choose my-fliers.zip"
echo "   4. Click 'Install Now'"
echo "   5. Activate the plugin"
echo ""