# 🚀 Future Features - Admin System

This folder contains a complete admin system implementation that was developed but put on hold for simplification.

## What's Here

| File                                 | Description                                                          |
| ------------------------------------ | -------------------------------------------------------------------- |
| `AdminLogin.jsx`                     | Separate login page for admins with username/password + Google OAuth |
| `AdminAuthContext.jsx`               | Admin authentication context (separate from student auth)            |
| `adminService.js`                    | Firestore operations for admin CRUD                                  |
| `seedAdmin.js`                       | Script to seed initial super admin                                   |
| `pages/SuperAdminDashboard.jsx`      | Full Super Admin dashboard with Branch/Track/Track Leader CRUD       |
| `components/AdminProtectedRoute.jsx` | Role-based route protection                                          |

## Role Hierarchy (Designed)

```
Super Admin → Track Leader → Supervisor → Instructor → Student
```

- **Super Admin**: Creates branches, tracks, and track leaders
- **Track Leader**: Manages track across all branches, creates supervisors
- **Supervisor**: Manages track in one branch, has instructor powers
- **Instructor**: Teaches groups, creates HW/contests
- **Student**: Learns, solves problems

## How to Re-enable

1. Move files back to their original locations:

   ```bash
   mv src/features/admin-future/AdminLogin.jsx src/pages/
   mv src/features/admin-future/AdminAuthContext.jsx src/context/
   mv src/features/admin-future/adminService.js src/services/
   mv src/features/admin-future/pages src/pages/admin
   mv src/features/admin-future/components src/components/admin
   ```

2. Update `App.jsx` to include admin routes (see git history)

3. Deploy Firestore rules from `firestore.rules`

## Related Documentation

See the brain folder for detailed plans:

- `implementation_plan.md` - Full code review and recommendations
- `admin_system_plan.md` - Detailed admin system specification
- `role_hierarchy_discussion.md` - Role hierarchy design

## Why It Was Paused

The complex admin system was put on hold to focus on simplicity. The existing Supervisor Dashboard provides enough functionality for current needs.

---

_Last Updated: January 2026_
