(function () {
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