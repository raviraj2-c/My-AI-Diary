# MyDiary AI - Full-Stack Personal Diary Application

A sophisticated personal diary application with AI-powered storytelling capabilities, built with React, Node.js, Express, and MySQL.

## 🌟 Features

### 📝 **Diary Management**
- Rich text editor with formatting options
- Mood tracking and tagging system
- Calendar view for easy navigation
- Advanced search and filtering
- Image attachments and weather data

### 🤖 **AI-Powered Storytelling**
- Transform diary entries into literary narratives
- Multiple themes: Romantic, Dramatic, Adventure, Mystery, Comedy
- Professional PDF export with book-quality formatting
- Character development and story arcs

### 🔐 **Security & Authentication**
- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting and security headers
- CORS protection

### 📊 **Analytics & Insights**
- Writing statistics and mood trends
- Entry streaks and patterns
- Personal growth tracking

## 🏗️ Architecture

```
mydiary-ai/
├── frontnd
│ ├── src/                    # Frontend (React + TypeScript)
│ │   ├── components/         # Reusable UI components
│ │   ├── pages/             # Application pages
│ │   ├── services/          # API communication
│ │   ├── hooks/             # Custom React hooks
│ │   └── types/             # TypeScript definitions
│ └── deployment/           # Deployment configurations
├── server/                # Backend (Node.js + Express)
│   ├── controllers/       # Request handlers
│   ├── models/           # MySQL schemas
│   ├── routes/           # API endpoints
│   ├── services/         # Business logic
│   └── middleware/  
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- MySQL (local or cloud)
- Git

### 1. Clone and Install
```bash
git clone <repository-url>
cd mydiary-ai
npm install
npm run server:install
```

### 2. Environment Setup
Create `.env` file in the root directory:
```env
NODE_ENV=development
PORT=5000
MySQL_URI=MySQL://localhost:27017/mydiary
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

### 3. Start Development
```bash
npm run dev:full
```

This starts both frontend (http://localhost:5173) and backend (http://localhost:5000) servers.

## 📦 Production Deployment

### Option 1: Automated Deployment Script
```bash
chmod +x deploy.sh
./deploy.sh --pm2  # Deploy with PM2
./deploy.sh --docker  # Deploy with Docker
```

### Option 2: Manual Deployment

#### Build the Application
```bash
npm run build
npm run build:server
```

#### Deploy with PM2
```bash
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

#### Deploy with Docker
```bash
docker-compose up -d
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Password reset

### Diary Management
- `GET /api/diary/entries` - Get all entries
- `POST /api/diary/entries` - Create new entry
- `PUT /api/diary/entries/:id` - Update entry
- `DELETE /api/diary/entries/:id` - Delete entry
- `GET /api/diary/tags` - Get all tags
- `GET /api/diary/stats` - Get user statistics

### AI Storybook
- `POST /api/ai/generate-storybook` - Generate AI storybook
- `GET /api/ai/storybooks` - Get user's storybooks
- `GET /api/ai/storybooks/:id` - Get specific storybook
- `DELETE /api/ai/storybooks/:id` - Delete storybook

### Export
- `GET /api/export/entries` - Export diary entries
- `POST /api/export/storybook/:id/download` - Track storybook downloads

## 🛡️ Security Features

### Backend Security
- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing protection
- **Rate Limiting** - Prevent abuse (100 requests/15min)
- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt with salt rounds
- **Input Validation** - Mongoose schema validation
- **Error Handling** - Comprehensive error management

### Frontend Security
- **XSS Protection** - Content sanitization
- **CSRF Protection** - Token-based requests
- **Secure Storage** - JWT tokens in localStorage
- **Input Validation** - Client-side validation

## 🌐 Environment Variables

### Development (.env)
```env
NODE_ENV=development
PORT=5000
MySQL_URI=MySQL://localhost:27017/mydiary
JWT_SECRET=development-secret-key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

### Production (.env.production)
```env
NODE_ENV=production
PORT=5000
MySQL_URI=MySQL+srv://user:pass@cluster.MySQL.net/mydiary
JWT_SECRET=super-secure-production-secret-minimum-32-chars
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
```

## 📊 Monitoring & Health Checks

### Health Check Endpoint
```bash
curl http://localhost:5000/api/health
```

Response:
```json
{
  "success": true,
  "message": "MyDiary API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "version": "1.0.0",
  "uptime": 3600
}
```

### Application Monitoring
- **PM2 Monitoring**: `pm2 monit`
- **Docker Logs**: `docker-compose logs -f`
- **Health Checks**: Built-in health check endpoints

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy MyDiary AI
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: ./deploy.sh --docker
```

## 🐳 Docker Configuration

### Multi-stage Dockerfile
- **Builder stage**: Install dependencies and build
- **Production stage**: Optimized runtime image
- **Security**: Non-root user, minimal attack surface
- **Health checks**: Built-in container health monitoring

### Docker Compose Services
- **App**: Main application container
- **MySQL**: Database container with persistent storage
- **Nginx**: Reverse proxy with SSL termination

## 📈 Performance Optimization

### Frontend
- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Remove unused code
- **Asset Optimization**: Minification and compression
- **Caching**: Browser caching for static assets

### Backend
- **Compression**: Gzip compression middleware
- **Database Indexing**: Optimized MySQL queries
- **Connection Pooling**: Efficient database connections
- **Rate Limiting**: Prevent resource abuse

## 🔒 SSL/HTTPS Setup

### Let's Encrypt (Recommended)
```bash
# Install certbot
sudo apt install certbot

# Generate certificate
certbot certonly --standalone -d yourdomain.com

# Copy certificates
mkdir ssl
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
```

### Self-signed Certificates (Development)
```bash
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes
```

## 🧪 Testing

### Run Tests
```bash
npm test                # Run all tests
npm run test:client     # Frontend tests
npm run test:server     # Backend tests
```

### Test Coverage
- Unit tests for components and services
- Integration tests for API endpoints
- End-to-end tests for critical user flows

## 📝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

**Database Connection Failed**
```bash
# Check MySQL status
sudo systemctl status mongod

# Start MySQL
sudo systemctl start mongod
```

**Port Already in Use**
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

**Build Errors**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Getting Help
- 📧 Email: support@mydiary.ai
- 💬 Discord: [Join our community](https://discord.gg/mydiary)
- 🐛 Issues: [GitHub Issues](https://github.com/mydiary/issues)

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Real-time collaboration
- [ ] Advanced AI features
- [ ] Voice-to-text entries
- [ ] Social sharing features
- [ ] Plugin system
- [ ] Multi-language support

---

Made with ❤️ by the MyDiary AI Team
