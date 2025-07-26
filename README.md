# Netwrix - Modifications for Solutions

A Discourse theme component that provides custom styling and functionality for Netwrix solution pages when used with the [Custom Topic Lists plugin](https://github.com/discourse/discourse-custom-topic-lists).

## Features

- **Custom Solution Pages**: Styled headers and layouts for solution categories
- **Subscribe Functionality**: One-click subscription to all news and security advisories for each solution
- **Responsive Design**: Mobile-friendly with responsive line breaks
- **Navigation Cleanup**: Hides unnecessary navigation elements on solution pages
- **Plugin Integration**: Works with Discourse Custom Topic Lists plugin or standalone theme settings

## Prerequisites

### Required Plugin Installation

1. **Install Custom Topic Lists Plugin**:
   ```
   cd /var/discourse
   ./launcher enter app
   git clone https://github.com/discourse/discourse-custom-topic-lists.git plugins/discourse-custom-topic-lists
   exit
   ./launcher rebuild app
   ```

2. **Enable the Plugin**:
   - Go to Admin → Settings → Plugins
   - Find "Custom Topic Lists" and enable it
   - Enable the site setting `discourse_custom_topic_lists_enabled`

## Installation

1. Go to your Discourse Admin Panel
2. Navigate to **Customize** → **Themes**
3. Click **Install** → **From a Git repository**
4. Enter: `https://github.com/dereklputnam/netwrix-modifications-for-solutions`
5. Click **Install**

## Configuration

### Method 1: Plugin Configuration (Recommended)

Configure your solutions in the Custom Topic Lists plugin settings:

1. Go to **Admin** → **Settings** → **Plugins**
2. Find **Custom Topic Lists** settings
3. Configure `custom_topic_lists` with your solution data:

```json
[
  {
    "slug": "directory-management",
    "name": "Directory Management",
    "title": "Directory Management", 
    "subtitle": "Netwrix Directory Management",
    "description": "Stay informed with the latest updates and security alerts for Auditor, Directory Manager, and Password Policy Enforcer.",
    "query": "category:90,110,118",
    "level_4_categories": "90,110,118",
    "level_3_categories": "195,204,210"
  }
]
```

### Method 2: Theme Settings (Fallback)

If not using the plugin, configure in theme settings:

1. Go to **Customize** → **Themes** → **Netwrix - Modifications for Solutions**
2. Click **Settings**
3. Update the `netwrix_solutions` setting with your solution data

## URL Structure

Solutions will be accessible at:
- `/lists/directory-management`
- `/lists/endpoint-management`
- `/lists/identity-management`
- etc.

## Default Solutions Included

1. **Directory Management** - Auditor, Directory Manager, Password Policy Enforcer
2. **Endpoint Management** - Endpoint Protector, Endpoint Policy Manager, Change Tracker  
3. **Identity Management** - Identity Manager, Directory Manager, Password Policy Enforcer
4. **ITDR** - PingCastle, Access Analyzer, Threat Manager, Threat Prevention, Recovery for AD
5. **Privileged Access Management** - Privilege Secure, Endpoint Privilege Manager, Password Secure
6. **DSPM** - Auditor, Access Analyzer, Data Classification, Endpoint Protector

## Requirements

- Discourse 3.0.0 or higher
- [Custom Topic Lists plugin](https://github.com/discourse/discourse-custom-topic-lists) (recommended)

## Troubleshooting

- Ensure Custom Topic Lists plugin is installed and enabled
- Check that solutions are configured with matching slugs
- Verify category IDs are correct for your Discourse instance
- Enable admin/development logging for debugging

## License

This theme component is licensed under the MIT License.

## Version

Current version: 1.1.0