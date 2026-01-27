# Role-Based Permissions Guide

## Role Hierarchy

1. **Super Admin** - Full system access (default role)
2. **Admin** - Restricted access (cannot view/manage users)
3. **Moderator** - Content and reports management
4. **Viewer** - Read-only access with ability to create users

## Permission Matrix

| Feature | Super Admin | Admin | Moderator | Viewer |
|---------|-------------|-------|-----------|--------|
| **Dashboard** | ✅ View | ✅ View | ✅ View | ✅ View |
| **Users** | ✅ View, Create, Edit, Delete | ❌ No Access | ❌ No Access | ✅ View, Create |
| **Profiles** | ✅ View | ✅ View | ✅ View | ✅ View |
| **Admin Users** | ✅ View, Create, Edit, Delete | ✅ View Only | ✅ View Only | ✅ View Only |
| **Reports** | ✅ Manage | ✅ Manage | ✅ Manage | ❌ No Access |
| **Content Moderation** | ✅ Manage | ✅ Manage | ✅ Manage | ❌ No Access |
| **Statistics** | ✅ View | ✅ View | ✅ View | ✅ View |
| **Settings** | ✅ Manage | ✅ View | ✅ View | ✅ View |

## Detailed Permissions

### Super Admin
- ✅ Can create, edit, and delete admin users
- ✅ Can view, create, edit, and delete regular users
- ✅ Can manage all content and reports
- ✅ Full access to all features

### Admin
- ❌ **Cannot view or manage regular users** (restricted)
- ✅ Can view admin users (read-only)
- ✅ Can manage content moderation
- ✅ Can manage reports
- ✅ Can view statistics and settings

### Moderator
- ❌ Cannot view or manage users
- ✅ Can view admin users (read-only)
- ✅ Can manage content moderation
- ✅ Can manage reports
- ✅ Can view statistics

### Viewer
- ✅ Can view regular users (read-only)
- ✅ Can create new users
- ❌ Cannot edit or delete users
- ✅ Can view admin users (read-only)
- ❌ Cannot manage content or reports
- ✅ Can view statistics

## Implementation Notes

- All permissions are enforced in the frontend components
- Backend should also implement role-based middleware for security
- Super Admin is the only role that can create/delete admin users
- Admin role is specifically restricted from user management
- Viewer role can create users but cannot modify existing ones
