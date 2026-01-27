# Backend Admin Routes Required

The admin panel requires the following backend API routes to be implemented. Add these routes to your backend server.

## Required Routes

### 1. User Management Routes

```javascript
// GET /api/admin/users
// Query params: ?filter=all|active|inactive|verified|unverified
// Returns: { users: [...] }

// GET /api/admin/users/stats
// Returns: { totalUsers, activeUsers, newUsersToday, verifiedUsers }

// PUT /api/admin/users/:id/toggle-active
// Body: { isActive: boolean }
// Returns: { success: true, user: {...} }

// PUT /api/admin/users/:id/toggle-verified
// Body: { isVerified: boolean }
// Returns: { success: true, user: {...} }
```

### 2. Reports Management Routes

```javascript
// GET /api/admin/reports
// Query params: ?status=pending|resolved|all
// Returns: { reports: [...] }

// GET /api/admin/reports/stats
// Returns: { pendingReports, totalReports }

// PUT /api/admin/reports/:id/resolve
// Body: { action: 'approve'|'reject'|'warn'|'ban' }
// Returns: { success: true, report: {...} }
```

### 3. Content Moderation Routes

```javascript
// GET /api/admin/stories
// Query params: ?filter=all|flagged|active
// Returns: { stories: [...] }

// PUT /api/admin/stories/:id/approve
// Returns: { success: true, story: {...} }

// DELETE /api/admin/stories/:id
// Returns: { success: true }
```

### 4. Profile Management Routes

```javascript
// GET /api/admin/profiles
// Query params: ?filter=all|verified|unverified|active|inactive
// Returns: { profiles: [...] }

// GET /api/admin/profiles/:userId
// Returns: { profile: {...} }
```

### 5. Admin Users Management Routes

```javascript
// GET /api/admin/admins
// Returns: { admins: [...] } (all users with userType: admin, moderator, or viewer)

// POST /api/admin/admins
// Body: { email, password, firstName, lastName, role: 'admin'|'moderator'|'viewer' }
// Returns: { success: true, admin: {...} }

// PUT /api/admin/admins/:id
// Body: { email, password (optional), firstName, lastName, role }
// Returns: { success: true, admin: {...} }

// DELETE /api/admin/admins/:id
// Returns: { success: true }
```

### 6. Statistics Routes

```javascript
// GET /api/admin/statistics
// Query params: ?range=7d|30d|90d|all
// Returns: { matches, messages, profileViews, activeUsers, userGrowth: [...] }
```

## Implementation Example

Create a new file `backend/routes/admin.js`:

```javascript
import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import { User, Profile, Report, Story } from '../models/index.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(admin);

// User routes
router.get('/users', async (req, res) => {
  try {
    const { filter } = req.query;
    const where = {};
    
    if (filter === 'active') where.isActive = true;
    if (filter === 'inactive') where.isActive = false;
    if (filter === 'verified') where.isVerified = true;
    if (filter === 'unverified') where.isVerified = false;
    
    const users = await User.findAll({
      where,
      include: [{ model: Profile }],
      order: [['createdAt', 'DESC']],
    });
    
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/users/stats', async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });
    const verifiedUsers = await User.count({ where: { isVerified: true } });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newUsersToday = await User.count({
      where: { createdAt: { [Op.gte]: today } },
    });
    
    res.json({ totalUsers, activeUsers, verifiedUsers, newUsersToday });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/users/:id/toggle-active', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.isActive = req.body.isActive;
    await user.save();
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/users/:id/toggle-verified', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.isVerified = req.body.isVerified;
    await user.save();
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reports routes
router.get('/reports', async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    
    if (status === 'pending') where.status = 'pending';
    if (status === 'resolved') where.status = 'resolved';
    
    const reports = await Report.findAll({
      where,
      include: [
        { model: User, as: 'reporter' },
        { model: User, as: 'reportedUser' },
      ],
      order: [['createdAt', 'DESC']],
    });
    
    res.json({ reports });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/reports/stats', async (req, res) => {
  try {
    const totalReports = await Report.count();
    const pendingReports = await Report.count({ where: { status: 'pending' } });
    
    res.json({ totalReports, pendingReports });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/reports/:id/resolve', async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    
    report.status = 'resolved';
    report.adminAction = req.body.action;
    report.resolvedAt = new Date();
    await report.save();
    
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Stories routes
router.get('/stories', async (req, res) => {
  try {
    const { filter } = req.query;
    const where = {};
    
    if (filter === 'flagged') where.isFlagged = true;
    if (filter === 'active') where.isActive = true;
    
    const stories = await Story.findAll({
      where,
      include: [{ model: User }],
      order: [['createdAt', 'DESC']],
    });
    
    res.json({ stories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/stories/:id/approve', async (req, res) => {
  try {
    const story = await Story.findByPk(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });
    
    story.isFlagged = false;
    story.isActive = true;
    await story.save();
    
    res.json({ success: true, story });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/stories/:id', async (req, res) => {
  try {
    const story = await Story.findByPk(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });
    
    await story.destroy();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Profile routes
router.get('/profiles', async (req, res) => {
  try {
    const { filter } = req.query;
    const where = {};
    
    // Apply filters based on user status
    const userWhere = {};
    if (filter === 'verified') userWhere.isVerified = true;
    if (filter === 'unverified') userWhere.isVerified = false;
    if (filter === 'active') userWhere.isActive = true;
    if (filter === 'inactive') userWhere.isActive = false;
    
    const profiles = await Profile.findAll({
      where,
      include: [
        {
          model: User,
          where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
          required: true,
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    
    res.json({ profiles });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/profiles/:userId', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      where: { userId: req.params.userId },
      include: [
        {
          model: User,
          attributes: ['id', 'email', 'credits', 'isVerified', 'isActive'],
        },
      ],
    });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    res.json({ profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin users routes
router.get('/admins', async (req, res) => {
  try {
    const admins = await User.findAll({
      where: {
        userType: ['superadmin', 'admin', 'moderator', 'viewer'],
      },
      include: [{ model: Profile }],
      order: [['createdAt', 'DESC']],
    });
    
    res.json({ admins });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/admins', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Validate role
    const allowedRoles = ['superadmin', 'admin', 'moderator', 'viewer'];
    const userRole = allowedRoles.includes(role) ? role : 'superadmin';
    
    // Create admin user
    const admin = await User.create({
      email,
      password,
      userType: userRole,
      isVerified: true,
      isActive: true,
    });
    
    // Create profile if names provided
    if (firstName || lastName) {
      await Profile.create({
        userId: admin.id,
        firstName: firstName || 'Admin',
        lastName: lastName || 'User',
        age: 30,
        gender: 'other',
        bio: 'Administrator',
      });
    }
    
    const adminWithProfile = await User.findByPk(admin.id, {
      include: [{ model: Profile }],
    });
    
    res.json({ success: true, admin: adminWithProfile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/admins/:id', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    const admin = await User.findByPk(req.params.id);
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin user not found' });
    }
    
    // Update user
    if (email) admin.email = email;
    if (password) admin.password = password;
    if (role) admin.userType = role;
    await admin.save();
    
    // Update profile
    const profile = await Profile.findOne({ where: { userId: admin.id } });
    if (profile) {
      if (firstName) profile.firstName = firstName;
      if (lastName) profile.lastName = lastName;
      await profile.save();
    } else if (firstName || lastName) {
      await Profile.create({
        userId: admin.id,
        firstName: firstName || 'Admin',
        lastName: lastName || 'User',
        age: 30,
        gender: 'other',
      });
    }
    
    const adminWithProfile = await User.findByPk(admin.id, {
      include: [{ model: Profile }],
    });
    
    res.json({ success: true, admin: adminWithProfile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/admins/:id', async (req, res) => {
  try {
    const admin = await User.findByPk(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin user not found' });
    }
    
    // Don't allow deleting yourself
    if (admin.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    
    await admin.destroy();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Statistics route
router.get('/statistics', async (req, res) => {
  try {
    const { range } = req.query;
    const dateFilter = getDateFilter(range);
    
    // Get statistics based on date range
    const matches = await Match.count({ where: { createdAt: dateFilter } });
    const messages = await Message.count({ where: { createdAt: dateFilter } });
    const profileViews = await ProfileView.count({ where: { createdAt: dateFilter } });
    const activeUsers = await User.count({ where: { isActive: true } });
    
    res.json({ matches, messages, profileViews, activeUsers, userGrowth: [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

function getDateFilter(range) {
  const now = new Date();
  switch (range) {
    case '7d':
      return { [Op.gte]: new Date(now - 7 * 24 * 60 * 60 * 1000) };
    case '30d':
      return { [Op.gte]: new Date(now - 30 * 24 * 60 * 60 * 1000) };
    case '90d':
      return { [Op.gte]: new Date(now - 90 * 24 * 60 * 60 * 1000) };
    default:
      return {};
  }
}

export default router;
```

Then add to `backend/server.js`:

```javascript
import adminRoutes from './routes/admin.js';

// ... other routes ...

app.use('/api/admin', adminRoutes);
```

## Notes

- All routes require the `protect` and `admin` middleware
- Make sure to import necessary models (User, Profile, Report, Story, Match, Message, etc.)
- Adjust the routes based on your actual database schema and relationships
