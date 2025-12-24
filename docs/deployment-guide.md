# Contra Server Deployment Guide

> **Security-focused production deployment for Ubuntu/Debian servers**

---

## 1. Prerequisites Installation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL 15+
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2

# Verify installations
node -v && npm -v && psql --version && nginx -v
```

---

## 2. PostgreSQL Database Setup

```bash
# Start PostgreSQL and enable on boot
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << 'EOF'
-- Create database
CREATE DATABASE contra;

-- Create dedicated user with strong password (CHANGE THIS!)
CREATE USER contra WITH ENCRYPTED PASSWORD 'CHANGE_ME_STRONG_PASSWORD_HERE';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE contra TO contra;

-- Connect to contra database and grant schema access
\c contra
GRANT ALL ON SCHEMA public TO contra;

-- Enable required extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

\q
EOF
```

---

## 3. Application Setup

```bash
# Create app directory (if not cloned)
cd /var/www
sudo mkdir -p contra
sudo chown $USER:$USER contra
cd contra

# Clone or copy your code here
# git clone <your-repo> .

# Install dependencies
npm install

# Create .env file with production settings
cat > .env << 'EOF'
# Database (CHANGE password to match step 2)
DATABASE_URL=postgres://contra:CHANGE_ME_STRONG_PASSWORD_HERE@localhost:5432/contra

# File uploads directory
LOCAL_UPLOAD_DIR=uploads

# Production mode
NODE_ENV=production
EOF

# Secure .env file permissions
chmod 600 .env

# Create uploads directory with proper permissions
mkdir -p uploads
chmod 755 uploads

# Push database schema
npm run db:push

# Seed initial data (creates admin user)
npm run db:seed

# Build production bundle
npm run build
```

---

## 4. PM2 Process Manager Setup

```bash
# Create PM2 ecosystem file for better control
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'contra',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/contra',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    error_file: '/var/log/pm2/contra-error.log',
    out_file: '/var/log/pm2/contra-out.log',
    time: true
  }]
};
EOF

# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Start application
pm2 start ecosystem.config.js

# Save PM2 config and setup startup script
pm2 save
pm2 startup
# ⬆️ Run the command it outputs (starts with 'sudo env PATH=...')
```

---

## 5. Nginx Configuration (with Security Headers)

```bash
# Create Nginx config
sudo tee /etc/nginx/sites-available/contra << 'EOF'
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;  # CHANGE THIS

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # File upload limit (match app limit)
    client_max_body_size 15M;

    # Gzip compression
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/contra /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t && sudo systemctl restart nginx
```

---

## 6. SSL/HTTPS with Let's Encrypt (Required for Production)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d YOUR_DOMAIN.com

# Auto-renewal is configured automatically
# Test it with:
sudo certbot renew --dry-run
```

---

## 7. Firewall Setup (UFW)

```bash
# Enable firewall with required ports only
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Verify
sudo ufw status
```

---

## 8. Default Credentials (CHANGE AFTER FIRST LOGIN!)

From `scripts/seed.ts`:

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | ADMIN |
| moderator | mod123 | MOD |
| pm | pm123 | PM |

> ⚠️ **IMPORTANT**: Change these passwords immediately after first login!

---

## Quick Reference Commands

| Action | Command |
|--------|---------|
| View logs | `pm2 logs contra` |
| Restart app | `pm2 restart contra` |
| Stop app | `pm2 stop contra` |
| Check status | `pm2 status` |
| Rebuild & restart | `npm run build && pm2 restart contra` |
| View Nginx logs | `sudo tail -f /var/log/nginx/error.log` |

---

## Security Checklist

- [ ] Changed database password from placeholder
- [ ] Changed default user passwords after first login
- [ ] SSL/HTTPS configured with Let's Encrypt
- [ ] Firewall enabled (UFW)
- [ ] `.env` file has 600 permissions
- [ ] Regular backups configured for PostgreSQL
