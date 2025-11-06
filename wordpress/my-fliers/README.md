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
