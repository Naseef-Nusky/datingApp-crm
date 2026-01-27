# Admin CRM Panel

A comprehensive admin panel for managing the Nexdating dating app, built with React and Tailwind CSS.

## Features

- **Dashboard**: Overview of key metrics and statistics
- **User Management**: View, search, and manage all users
- **Reports Management**: Handle user reports and take actions
- **Content Moderation**: Review and moderate stories and content
- **Statistics**: View analytics and user growth metrics
- **Settings**: Configure system settings

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd admin_CRM
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

   The admin panel will run on `http://localhost:5174`

3. **Build for Production**
   ```bash
   npm run build
   ```

## Backend API Endpoints Required

The admin panel expects the following API endpoints to be available:

### Authentication
- `GET /api/auth/me` - Get current admin user
- `POST /api/auth/login` - Admin login

### Users
- `GET /api/admin/users` - Get all users (with filter query param)
- `GET /api/admin/users/stats` - Get user statistics
- `PUT /api/admin/users/:id/toggle-active` - Toggle user active status
- `PUT /api/admin/users/:id/toggle-verified` - Toggle user verification

### Reports
- `GET /api/admin/reports` - Get all reports (with status query param)
- `GET /api/admin/reports/stats` - Get report statistics
- `PUT /api/admin/reports/:id/resolve` - Resolve a report

### Content Moderation
- `GET /api/admin/stories` - Get all stories (with filter query param)
- `PUT /api/admin/stories/:id/approve` - Approve a story
- `DELETE /api/admin/stories/:id` - Delete a story

### Statistics
- `GET /api/admin/statistics` - Get analytics (with range query param)

## Admin Access

To access the admin panel, you need a user account with one of these roles:
- `superadmin` - Full system access (default role)
- `admin` - Full access
- `moderator` - Content & Reports access
- `viewer` - Read-only access

The default admin user created by the script will have `userType: 'superadmin'`.

## Project Structure

```
admin_CRM/
├── src/
│   ├── components/
│   │   └── AdminLayout.jsx    # Main layout with sidebar
│   ├── context/
│   │   └── AuthContext.jsx     # Authentication context
│   ├── pages/
│   │   ├── Login.jsx           # Admin login page
│   │   ├── Dashboard.jsx       # Dashboard with stats
│   │   ├── Users.jsx           # User management
│   │   ├── Reports.jsx         # Reports management
│   │   ├── ContentModeration.jsx # Content moderation
│   │   ├── Statistics.jsx      # Analytics page
│   │   └── Settings.jsx        # System settings
│   ├── App.jsx                 # Main app component
│   ├── main.jsx                # Entry point
│   └── index.css               # Global styles
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Notes

- The admin panel uses the same backend API as the main app
- All admin routes should be protected with the `admin` middleware
- The panel is designed to run on port 5174 to avoid conflicts with the main frontend (port 5173)
