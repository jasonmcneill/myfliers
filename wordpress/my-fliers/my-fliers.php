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
