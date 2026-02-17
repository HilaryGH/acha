# MongoDB Setup Guide

## Fixing MongoDB Connection Errors

If you're getting errors like `getaddrinfo ENOTFOUND` or `ENOTFOUND`, follow these steps:

### 1. Check MongoDB Atlas Cluster Status

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Log in to your account
3. Check if your cluster is **running** (not paused)
4. If paused, click "Resume" to start it

### 2. Verify Your Connection String

Your `.env` file in the `server/` directory should contain:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name
```

**Important:**
- Replace `username` with your MongoDB Atlas username
- Replace `password` with your MongoDB Atlas password (URL-encoded if it contains special characters)
- Replace `cluster.mongodb.net` with your actual cluster hostname
- Replace `database-name` with your database name (e.g., `acha`)

### 3. Get Your Connection String from MongoDB Atlas

1. Go to MongoDB Atlas Dashboard
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your actual password
6. Replace `<dbname>` with your database name

### 4. Network Access (IP Whitelist)

1. In MongoDB Atlas, go to "Network Access"
2. Click "Add IP Address"
3. Add your current IP address OR
4. Add `0.0.0.0/0` to allow all IPs (for development only - not recommended for production)

### 5. Database User

1. In MongoDB Atlas, go to "Database Access"
2. Ensure you have a database user created
3. Make sure the username and password match your connection string

### 6. Test Your Connection

After updating your `.env` file:

1. Restart your server:
   ```bash
   cd server
   npm start
   ```

2. Look for this message:
   ```
   ✅ Connected to MongoDB
   📍 Database: your-database-name
   ```

### Common Issues

#### Issue: Cluster is Paused
**Solution:** Resume your cluster in MongoDB Atlas dashboard

#### Issue: Wrong Connection String Format
**Solution:** Use the format: `mongodb+srv://username:password@cluster.mongodb.net/database`

#### Issue: IP Not Whitelisted
**Solution:** Add your IP address in MongoDB Atlas Network Access

#### Issue: Wrong Username/Password
**Solution:** Verify credentials in MongoDB Atlas Database Access

#### Issue: DNS Resolution Failed
**Solution:** 
- Check your internet connection
- Verify the cluster hostname is correct
- Try using the standard connection string instead of SRV:
  ```
  mongodb://username:password@cluster-shard-00-00.mongodb.net:27017,cluster-shard-00-01.mongodb.net:27017,cluster-shard-00-02.mongodb.net:27017/database?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin
  ```

### Example .env File

```env
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/acha?retryWrites=true&w=majority
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
PORT=5000
```

### Need Help?

1. Check MongoDB Atlas status: https://cloud.mongodb.com
2. Review MongoDB Atlas documentation: https://docs.atlas.mongodb.com
3. Check server logs for detailed error messages
