# Deployment Guide - Arcade Compliance Management System

This guide will help you deploy the Arcade Compliance Management System to Vercel.

## 🚀 Quick Deploy to Vercel

### Prerequisites

- GitHub account with the repository
- Vercel account (free tier available)
- PostgreSQL database (we recommend Neon, Supabase, or PlanetScale)
- Resend account for email services

### Step 1: Database Setup

#### Option A: Neon (Recommended)

1. Go to [Neon](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string (it will look like: `postgresql://username:password@host/database?sslmode=require`)

#### Option B: Supabase

1. Go to [Supabase](https://supabase.com) and create a project
2. Go to Settings > Database
3. Copy the connection string

#### Option C: PlanetScale

1. Go to [PlanetScale](https://planetscale.com) and create a database
2. Create a connection string for your main branch

### Step 2: Email Service Setup (Resend)

1. Go to [Resend](https://resend.com) and create an account
2. Get your API key from the dashboard
3. Verify your domain or use the sandbox domain for testing

### Step 3: Deploy to Vercel

#### Method 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/shrewdly-dev/arcade-compliance)

#### Method 2: Manual Deploy

1. Go to [Vercel](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository: `shrewdly-dev/arcade-compliance`
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### Step 4: Environment Variables

In your Vercel project dashboard, go to Settings > Environment Variables and add:

```env
# Database
DATABASE_URL=your_postgresql_connection_string

# NextAuth
NEXTAUTH_URL=https://your-vercel-app.vercel.app
NEXTAUTH_SECRET=your_random_secret_key_here

# Email (Resend)
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com
```

#### Generate NEXTAUTH_SECRET

Run this command locally to generate a secure secret:

```bash
openssl rand -base64 32
```

### Step 5: Database Migration

After deployment, you need to set up your database schema:

1. Clone the repository locally:

```bash
git clone https://github.com/shrewdly-dev/arcade-compliance.git
cd arcade-compliance
npm install
```

2. Create a `.env.local` file with your production database URL:

```env
DATABASE_URL="your_postgresql_connection_string"
```

3. Generate and push the database schema:

```bash
npx prisma generate
npx prisma db push
```

### Step 6: Verify Deployment

1. Visit your Vercel app URL
2. Try to sign up for a new account
3. Check that email verification works
4. Test the onboarding flow

## 🔧 Configuration Options

### Custom Domain

1. In Vercel dashboard, go to Settings > Domains
2. Add your custom domain
3. Update `NEXTAUTH_URL` environment variable to use your custom domain

### Database Connection Pooling

For production, consider using connection pooling:

- **Neon**: Built-in connection pooling
- **Supabase**: Use the pooled connection string
- **PlanetScale**: Built-in connection pooling

### Email Domain Verification

1. In Resend dashboard, add your domain
2. Add the required DNS records
3. Update `FROM_EMAIL` to use your verified domain

## 📊 Monitoring & Analytics

### Vercel Analytics

Enable Vercel Analytics in your project settings for performance monitoring.

### Error Tracking

Consider adding error tracking services like:

- Sentry
- LogRocket
- Bugsnag

### Database Monitoring

Monitor your database performance:

- **Neon**: Built-in monitoring dashboard
- **Supabase**: Database insights
- **PlanetScale**: Query insights

## 🔒 Security Considerations

### Environment Variables

- Never commit `.env` files to version control
- Use strong, unique secrets for production
- Rotate secrets regularly

### Database Security

- Use SSL connections (enabled by default in most providers)
- Implement proper access controls
- Regular backups (most providers handle this automatically)

### CORS and Security Headers

The application includes security headers via Next.js configuration.

## 🚨 Troubleshooting

### Common Issues

#### Build Failures

- Check that all environment variables are set
- Verify database connection string format
- Ensure Node.js version compatibility (18+)

#### Database Connection Issues

- Verify the DATABASE_URL format
- Check if your database provider requires SSL
- Ensure database is accessible from Vercel's IP ranges

#### Email Not Sending

- Verify Resend API key is correct
- Check that FROM_EMAIL domain is verified
- Review Vercel function logs for errors

#### Authentication Issues

- Ensure NEXTAUTH_URL matches your deployment URL
- Verify NEXTAUTH_SECRET is set and secure
- Check that cookies are working (not blocked by browser)

### Getting Help

- Check Vercel deployment logs
- Review database provider documentation
- Open an issue on the GitHub repository

## 📈 Scaling Considerations

### Database

- Monitor connection usage
- Consider read replicas for high traffic
- Implement proper indexing

### Serverless Functions

- Vercel functions have execution time limits
- Consider upgrading to Pro plan for longer timeouts
- Optimize API routes for performance

### CDN and Caching

- Vercel provides global CDN automatically
- Implement proper caching strategies
- Use ISR (Incremental Static Regeneration) where appropriate

## 🔄 Updates and Maintenance

### Automatic Deployments

- Connected to GitHub for automatic deployments
- Push to main branch triggers new deployment
- Review deployment previews for pull requests

### Database Migrations

- Use Prisma migrations for schema changes
- Test migrations in staging environment first
- Backup database before major changes

### Dependency Updates

- Regularly update npm packages
- Test updates in development first
- Monitor for security vulnerabilities

---

## Support

For deployment issues or questions:

1. Check the [GitHub Issues](https://github.com/shrewdly-dev/arcade-compliance/issues)
2. Review Vercel documentation
3. Contact support through the repository

Happy deploying! 🚀
