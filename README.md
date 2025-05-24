# Arcade Compliance Management System

A comprehensive compliance management system for arcade operators, built with Next.js 14, NextAuth, Prisma, and integrated with MCP (Model Context Protocol) for gambling compliance tools.

## Features

### 🎯 Core Functionality

- **User Authentication**: Secure signup/login with email verification
- **6-Step Onboarding Process**: Complete setup for new arcade operators
- **Compliance Dashboard**: Real-time overview of compliance status
- **MCP Integration**: Access to gambling compliance tools and resources

### 🔐 Authentication & Security

- NextAuth.js with credentials provider
- Email verification system via Resend
- Secure password hashing with bcryptjs
- Session-based authentication

### 📋 Onboarding Flow

1. **Organization Details**: Company information and contact details
2. **Key Personnel**: Staff roles and responsibilities
3. **Licensing Information**: Permits and regulatory compliance
4. **Arcade Setup**: Location and operational details
5. **Machine Inventory**: Gaming equipment tracking
6. **Final Review**: Complete setup verification

### 🎰 Compliance Management

- Real-time compliance status monitoring
- Risk assessment tools
- Document management
- Training requirements tracking
- Incident reporting system

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Authentication**: NextAuth.js
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Email**: Resend service
- **MCP Integration**: Gambling compliance server
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Resend API key for email services

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/arcade-compliance.git
cd arcade-compliance
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**
   Create a `.env.local` file:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/arcade_compliance"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Email (Resend)
RESEND_API_KEY="your-resend-api-key"
FROM_EMAIL="noreply@yourdomain.com"
```

4. **Set up the database**

```bash
npm run db:generate
npm run db:push
```

5. **Start the development server**

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## MCP Server Integration

This application includes an integrated MCP server that provides gambling compliance tools:

### Available Tools

- `get_compliance_documents`: Retrieve compliance documentation
- `get_training_requirements`: Access staff training requirements
- `get_guidelines`: Get specific compliance guidelines
- `search_compliance_info`: Search across compliance content
- `get_risk_assessment_templates`: Access risk assessment tools
- `start_risk_assessment`: Begin risk assessment process
- `submit_risk_assessment`: Submit completed assessments
- `generate_compliance_action_plan`: Create action plans

### MCP Server Setup

The MCP server is located in `mcp-server/` and can be built separately:

```bash
cd mcp-server
npm install
npm run build
```

## Project Structure

```
arcade-compliance/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Main dashboard
│   │   └── onboarding/        # Onboarding flow
│   ├── components/            # React components
│   │   ├── auth/              # Authentication components
│   │   ├── layout/            # Layout components
│   │   ├── onboarding/        # Onboarding forms
│   │   └── ui/                # UI components
│   ├── lib/                   # Utility libraries
│   └── types/                 # TypeScript type definitions
├── prisma/                    # Database schema and migrations
├── mcp-server/               # MCP compliance server
└── public/                   # Static assets
```

## API Routes

### Authentication

- `POST /api/auth/signup` - User registration
- `GET /api/auth/verify-email` - Email verification
- `POST /api/send-verification-email` - Resend verification email

### Onboarding

- `GET/POST /api/onboarding/status` - Onboarding progress
- `POST /api/onboarding/organization` - Organization details
- `POST /api/onboarding/key-personnel` - Key personnel information
- `POST /api/onboarding/licensing` - Licensing information

### Compliance

- `GET /api/compliance/overview` - Compliance dashboard data
- `GET/POST /api/arcades` - Arcade management
- `POST /api/send-email` - Email notifications

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

### Environment Variables for Production

```env
DATABASE_URL="your-production-database-url"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-production-secret"
RESEND_API_KEY="your-resend-api-key"
FROM_EMAIL="noreply@yourdomain.com"
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions, please open an issue in the GitHub repository.
