# Platform Monitoring Guide

This guide explains how platform administrators can monitor Loomio usage, track activity, and access analytics.

---

## Prerequisites

- User account with `platform_admin` role
- Valid authentication token

---

## Setting Up Platform Admin Access

### Step 1: Update User Role to Platform Admin

**Via Supabase Dashboard:**

1. Go to https://supabase.com
2. Select your Loomio project
3. Navigate to **Table Editor** → **Users**
4. Find your user account (search by email)
5. Click to edit the row
6. Change the `role` field from `community_admin` to `platform_admin`
7. Click **Save**

**Via SQL Query:**

```sql
UPDATE "Users" 
SET role = 'platform_admin' 
WHERE email = 'your-email@example.com';
```

### Step 2: Refresh Your Session

1. Log out of Loomio
2. Log back in to refresh your token with the new role
3. Verify role in browser DevTools console:
   ```javascript
   JSON.parse(localStorage.getItem('user')).role
   ```

---

## Available Monitoring Endpoints

### 1. Platform Analytics Dashboard

**Endpoint:** `GET /api/analytics/platform`

**Access via Frontend:**
- Navigate to **Analytics** page in Loomio
- Platform admins will see platform-wide statistics

**What you'll see:**
- Total users, communities, tasks, events
- Active communities and users
- Task completion statistics
- Top communities by members
- Top contributors
- Task status breakdown
- Community growth trends

### 2. Usage Statistics (NEW)

**Endpoint:** `GET /api/monitoring/usage-stats`

**Returns real-time platform metrics:**
- Total counts (users, communities, tasks, events)
- Activity in last 24 hours (new users, tasks created/completed)
- Activity in last 7 days (new users, active users)
- Activity in last 30 days (new users)
- Most active communities (by task count)
- Most active users (by completed tasks)
- Recent user registrations
- Task status breakdown

**Example using cURL:**
```bash
curl -X GET https://your-backend.onrender.com/api/monitoring/usage-stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Example using PowerShell:**
```powershell
$token = "YOUR_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
}
$response = Invoke-RestMethod -Uri "https://your-backend.onrender.com/api/monitoring/usage-stats" -Headers $headers
$response | ConvertTo-Json -Depth 5
```

**Sample Response:**
```json
{
  "timestamp": "2025-11-21T10:30:00.000Z",
  "totals": {
    "users": 45,
    "communities": 8,
    "tasks": 156,
    "events": 23
  },
  "last24Hours": {
    "newUsers": 3,
    "tasksCreated": 12,
    "tasksCompleted": 8,
    "eventsCreated": 2
  },
  "last7Days": {
    "newUsers": 15,
    "activeUsers": 28
  },
  "last30Days": {
    "newUsers": 42
  },
  "activeCommunities": [
    {
      "community_id": 1,
      "name": "Tech Club",
      "task_count": "45"
    }
  ],
  "activeUsers": [
    {
      "user_id": 5,
      "full_name": "John Doe",
      "email": "john@example.com",
      "completed_tasks": "23"
    }
  ],
  "recentUsers": [...],
  "tasksByStatus": [
    { "status": "completed", "count": "67" },
    { "status": "in_progress", "count": "45" },
    { "status": "pending", "count": "32" }
  ]
}
```

### 3. Activity Log

**Endpoint:** `GET /api/monitoring/activity-log?limit=50`

**Returns recent platform activity:**
- Recent tasks created
- Recent task submissions
- User and community details

**Example using cURL:**
```bash
curl -X GET "https://your-backend.onrender.com/api/monitoring/activity-log?limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Sample Response:**
```json
{
  "recentTasks": [
    {
      "task_id": 123,
      "title": "Design event poster",
      "status": "in_progress",
      "created_at": "2025-11-21T08:30:00.000Z",
      "creator": {
        "user_id": 5,
        "full_name": "Admin User"
      },
      "community": {
        "community_id": 2,
        "name": "Design Team"
      }
    }
  ],
  "recentSubmissions": [
    {
      "assignment_id": 456,
      "status": "submitted",
      "submitted_at": "2025-11-21T09:15:00.000Z",
      "user": {
        "user_id": 12,
        "full_name": "Jane Smith"
      },
      "task": {
        "task_id": 120,
        "title": "Write blog post"
      }
    }
  ]
}
```

---

## Getting Your Authentication Token

### Method 1: From Browser (Easiest)

1. Log into Loomio web app
2. Open Browser DevTools (F12)
3. Go to **Application** tab → **Local Storage** → Your domain
4. Copy the value of `token`

### Method 2: Via Login API

```bash
curl -X POST https://your-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

Copy the `token` from the response.

---

## Monitoring via Database (Supabase)

Platform admins can also query the database directly for custom analytics.

### Useful Queries:

**Count total users:**
```sql
SELECT COUNT(*) as total_users FROM "Users";
```

**Users registered in last 7 days:**
```sql
SELECT COUNT(*) as new_users 
FROM "Users" 
WHERE created_at >= NOW() - INTERVAL '7 days';
```

**Most active communities:**
```sql
SELECT c.name, COUNT(t.task_id) as task_count
FROM "Communities" c
LEFT JOIN "Tasks" t ON c.community_id = t.community_id
GROUP BY c.community_id
ORDER BY task_count DESC
LIMIT 10;
```

**Task completion rate:**
```sql
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM "Tasks"
GROUP BY status;
```

**Top contributors:**
```sql
SELECT 
  u.full_name,
  SUM(c.points) as total_points
FROM "Contributions" c
JOIN "Users" u ON c.user_id = u.user_id
GROUP BY u.user_id
ORDER BY total_points DESC
LIMIT 10;
```

**Daily user registrations (last 30 days):**
```sql
SELECT 
  DATE(created_at) as registration_date,
  COUNT(*) as new_users
FROM "Users"
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY registration_date DESC;
```

---

## Monitoring via Render Logs

View real-time backend activity:

1. Go to https://dashboard.render.com
2. Select your `loomio-backend` service
3. Click **"Logs"** tab
4. Filter logs by:
   - API endpoints (e.g., search for "POST /api/tasks")
   - Error messages (search for "error" or "failed")
   - User activity (search for user emails or IDs)

**Common log patterns to watch:**
- `POST /api/auth/register` - New user signups
- `POST /api/auth/login` - Login attempts
- `POST /api/tasks` - Task creations
- `POST /api/tasks/:id/submit` - Task submissions
- Error logs - Issues to investigate

---

## PowerShell Monitoring Script

Create `monitor-loomio.ps1`:

```powershell
# Configuration
$token = "YOUR_TOKEN_HERE"
$baseUrl = "https://your-backend.onrender.com"

$headers = @{
    "Authorization" = "Bearer $token"
}

Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "Loomio Platform Monitoring Dashboard" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# Fetch usage statistics
Write-Host "Fetching platform statistics..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "$baseUrl/api/monitoring/usage-stats" -Headers $headers
    
    Write-Host "`n📊 PLATFORM TOTALS" -ForegroundColor Green
    Write-Host "Users: $($stats.totals.users)" -ForegroundColor White
    Write-Host "Communities: $($stats.totals.communities)" -ForegroundColor White
    Write-Host "Tasks: $($stats.totals.tasks)" -ForegroundColor White
    Write-Host "Events: $($stats.totals.events)" -ForegroundColor White
    
    Write-Host "`n📈 LAST 24 HOURS" -ForegroundColor Green
    Write-Host "New Users: $($stats.last24Hours.newUsers)" -ForegroundColor White
    Write-Host "Tasks Created: $($stats.last24Hours.tasksCreated)" -ForegroundColor White
    Write-Host "Tasks Completed: $($stats.last24Hours.tasksCompleted)" -ForegroundColor White
    Write-Host "Events Created: $($stats.last24Hours.eventsCreated)" -ForegroundColor White
    
    Write-Host "`n🔥 TOP COMMUNITIES" -ForegroundColor Green
    $stats.activeCommunities | ForEach-Object {
        Write-Host "  • $($_.name): $($_.task_count) tasks" -ForegroundColor White
    }
    
    Write-Host "`n⭐ TOP USERS" -ForegroundColor Green
    $stats.activeUsers | Select-Object -First 5 | ForEach-Object {
        Write-Host "  • $($_.full_name): $($_.completed_tasks) completed" -ForegroundColor White
    }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
```

Run it:
```powershell
.\monitor-loomio.ps1
```

---

## Security Best Practices

1. **Protect Your Token**: Never commit tokens to version control
2. **Use Environment Variables**: Store tokens in `.env` files (add to `.gitignore`)
3. **Regular Audits**: Review user activity and permissions regularly
4. **Monitor Logs**: Watch for suspicious patterns in Render logs
5. **Backup Database**: Regular backups via Supabase dashboard
6. **Update Dependencies**: Keep backend and frontend packages updated

---

## Troubleshooting

### "Failed to load analytics"

**Cause**: User doesn't have `platform_admin` role

**Solution**: Update role in Supabase Users table, then re-login

### "Unauthorized" or 401 Error

**Cause**: Invalid or expired token

**Solution**: 
1. Log out and log back in
2. Get fresh token from localStorage or login API

### "Access denied" or 403 Error

**Cause**: User role is not `platform_admin`

**Solution**: Verify role in database and user's stored token

### No data showing in statistics

**Cause**: Database might be empty or queries failing

**Solution**:
1. Check Render logs for errors
2. Verify database connection in Supabase
3. Test direct database queries in Supabase SQL Editor

---

## Additional Resources

- **Backend API Documentation**: See `/backend/src/routes/` for all available endpoints
- **Database Schema**: Check `/backend/src/models/` for table structures
- **Frontend Components**: See `/frontend/src/pages/Analytics.jsx` for UI implementation
- **Supabase Docs**: https://supabase.com/docs
- **Render Docs**: https://render.com/docs

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/jvkousthub/Loomio/issues
- Check Render logs for backend errors
- Review browser console for frontend errors
- Verify database connection in Supabase

---

**Last Updated**: November 21, 2025
