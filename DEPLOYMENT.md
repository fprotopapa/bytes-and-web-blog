# Deployment Guide

This repository uses GitHub Actions to automatically build and deploy the blog to your web server via rsync.

## Prerequisites

- A web server with SSH access
- rsync installed on the server
- GitHub repository secrets configured

## Setup Instructions

### 1. Generate SSH Key Pair

On your local machine, generate an SSH key pair for deployment:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key
```

This creates two files:
- `~/.ssh/github_deploy_key` (private key)
- `~/.ssh/github_deploy_key.pub` (public key)

### 2. Add Public Key to Web Server

Copy the public key to your web server:

```bash
ssh-copy-id -i ~/.ssh/github_deploy_key.pub user@your-server.com
```

Or manually add it to `~/.ssh/authorized_keys` on the server:

```bash
cat ~/.ssh/github_deploy_key.pub | ssh user@your-server.com "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### 3. Configure GitHub Secrets

Go to your GitHub repository:
1. Navigate to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add the following secrets:

#### SSH_PRIVATE_KEY
Copy the **entire contents** of your private key:

```bash
cat ~/.ssh/github_deploy_key
```

Paste the output (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`) into the secret value.

#### SERVER_HOST
Your server's hostname or IP address:
```
example.com
# or
192.168.1.100
```

#### SERVER_USER
Your SSH username on the server:
```
username
```

#### SERVER_PATH
The absolute path on your server where the site should be deployed:
```
/var/www/html/blog
# or
/home/username/public_html
```

### 4. Verify Server Permissions

Ensure the deployment user has write permissions to the deployment directory:

```bash
# On your web server
sudo chown -R username:username /var/www/html/blog
chmod -R 755 /var/www/html/blog
```

### 5. Test the Deployment

Push to the `main` branch or manually trigger the workflow:

1. Go to **Actions** tab in GitHub
2. Select **Build and Deploy to Web Server**
3. Click **Run workflow**
4. Choose the `main` branch
5. Click **Run workflow**

## Workflow Details

### Triggers

The workflow runs automatically when:
- Code is pushed to the `main` branch
- Manual trigger via GitHub Actions UI

### Build Process

1. Checks out the repository
2. Sets up Node.js 20
3. Installs dependencies with `npm ci`
4. Builds the site with `npm run build`
5. Deploys the `dist/` folder via rsync

### Deployment Process

The workflow uses rsync with the following flags:
- `-a` (archive mode): Preserves permissions, timestamps, etc.
- `-v` (verbose): Shows detailed output
- `-z` (compress): Compresses data during transfer
- `--delete`: Removes files on server that don't exist locally

## Troubleshooting

### SSH Connection Issues

If you see SSH connection errors:

1. Verify the SSH key is correct:
   ```bash
   ssh -i ~/.ssh/github_deploy_key user@your-server.com
   ```

2. Check that the public key is in `~/.ssh/authorized_keys` on the server

3. Verify the `SERVER_HOST` secret doesn't have trailing slashes or spaces

### Permission Denied

If deployment fails with permission errors:

1. Check directory permissions on the server:
   ```bash
   ls -la /var/www/html/
   ```

2. Ensure the user has write access:
   ```bash
   sudo chown -R username:username /path/to/deployment
   ```

### Build Failures

Check the GitHub Actions logs:
1. Go to **Actions** tab
2. Click on the failed workflow run
3. Expand the failed step to see error details

Common issues:
- Missing dependencies: Run `npm install` locally first
- Build errors: Run `npm run build` locally to test
- Out of memory: Build locally and check for issues

### Rsync Issues

If rsync fails:

1. Test rsync manually:
   ```bash
   rsync -avz --dry-run ./dist/ user@server:/path/
   ```

2. Check that rsync is installed on the server:
   ```bash
   ssh user@server "which rsync"
   ```

3. Verify the `SERVER_PATH` is correct and accessible

## Manual Deployment

To deploy manually without GitHub Actions:

```bash
# Build locally
npm run build

# Deploy via rsync
rsync -avz --delete ./dist/ user@your-server.com:/var/www/html/blog/
```

## Security Best Practices

1. **Use dedicated deploy key**: Don't use your personal SSH key
2. **Limit key permissions**: The deploy key should only have access to the deployment directory
3. **Rotate keys regularly**: Generate new keys periodically
4. **Monitor deployments**: Check GitHub Actions logs for unusual activity
5. **Use SSH key passphrase**: For extra security (requires GitHub runner support)

## Web Server Configuration

### Nginx Example

```nginx
server {
    listen 80;
    server_name bytesandweb.pl www.bytesandweb.pl;

    root /var/www/html/blog;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Apache Example

```apache
<VirtualHost *:80>
    ServerName bytesandweb.pl
    ServerAlias www.bytesandweb.pl

    DocumentRoot /var/www/html/blog

    <Directory /var/www/html/blog>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Cache static assets
    <FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$">
        Header set Cache-Control "max-age=31536000, public, immutable"
    </FilesMatch>
</VirtualHost>
```

## Post-Deployment Checklist

After successful deployment:

- [ ] Visit your site and verify it loads correctly
- [ ] Check that all pages are accessible
- [ ] Test the search functionality
- [ ] Verify RSS feed is working
- [ ] Check sitemap.xml is accessible
- [ ] Test on mobile devices
- [ ] Verify SSL/HTTPS is working (if configured)
- [ ] Check Google Search Console for indexing

## Continuous Deployment

The workflow is configured for continuous deployment:
- Every push to `main` automatically deploys
- No manual intervention required
- Deployment takes ~2-5 minutes typically

## Alternative: Manual Trigger Only

If you prefer manual deployments, edit `.github/workflows/deploy.yml`:

```yaml
on:
  workflow_dispatch: # Manual trigger only
  # Remove the push trigger
```

## Getting Help

If you encounter issues:
1. Check the GitHub Actions logs
2. Review this documentation
3. Test SSH connection manually
4. Verify all secrets are correctly set
5. Check server logs: `/var/log/nginx/error.log` or `/var/log/apache2/error.log`
