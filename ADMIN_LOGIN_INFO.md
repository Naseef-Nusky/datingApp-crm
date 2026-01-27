# Admin Login Credentials

## Default Admin Credentials

After running the admin creation script, use these default credentials:

**Email:** `admin@nexdating.com`  
**Password:** `Admin123!`

## How to Create Admin User

1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Run the admin creation script:**
   ```bash
   npm run create-admin
   ```

   Or directly:
   ```bash
   node scripts/createAdmin.js
   ```

3. **The script will create an admin user with:**
   - Email: `admin@nexdating.com` (or from ADMIN_EMAIL env variable)
   - Password: `Admin123!` (or from ADMIN_PASSWORD env variable)
   - User Type: `superadmin` (default - highest level access)
   - Verified: `true`
   - Active: `true`

## Custom Admin Credentials

To use custom credentials, add these to your `backend/.env` file:

```env
ADMIN_EMAIL=your-admin@email.com
ADMIN_PASSWORD=YourSecurePassword123!
ADMIN_FIRST_NAME=Admin
ADMIN_LAST_NAME=User
```

Then run the script again.

## Login Steps

1. Start the admin panel:
   ```bash
   cd admin_CRM
   npm run dev
   ```

2. Open browser to: `http://localhost:5174`

3. Enter the admin credentials:
   - **Email:** `admin@nexdating.com`
   - **Password:** `Admin123!`

4. Click "Login"

## Security Notes

⚠️ **Important:** 
- Change the default password after first login
- Use strong passwords in production
- Never commit admin credentials to version control
- Consider using environment variables for production

## Troubleshooting

If login fails:
1. Make sure the backend server is running
2. Verify the admin user was created (check database)
3. Check that `userType` is set to `'superadmin'`, `'admin'`, `'moderator'`, or `'viewer'` in the database
4. Ensure the user's `isActive` is `true`
5. Check backend console for any errors
