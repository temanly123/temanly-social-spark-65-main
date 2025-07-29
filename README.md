# Temanly - Social Companion Platform

A comprehensive social companion platform that connects users with verified talents for various social services including chat, calls, offline dates, and event companionship.

## 🌟 Features

### Core Platform Features
- **Multi-Service Booking**: Chat, voice calls, video calls, offline dates, party buddy, and rent-a-lover services
- **Comprehensive User System**: Separate flows for users and talents with complete verification
- **Advanced Talent Profiles**: Detailed profiles with interests, zodiac signs, love languages, and availability
- **Smart City Filtering**: Location-based talent discovery and filtering
- **Talent Level Progression**: Automatic progression from Fresh → Elite → VIP based on performance
- **Real-time Notifications**: WhatsApp integration for booking confirmations and updates

### Payment & Financial
- **Midtrans Integration**: Complete payment processing with multiple payment methods
- **Dynamic Commission System**: Variable commission rates based on talent levels (20%, 18%, 15%)
- **Comprehensive Financial Dashboard**: Real-time tracking of earnings, payouts, and platform revenue
- **Automated Payout System**: Talent earnings management with admin approval workflow

### Admin & Management
- **Complete Admin Dashboard**: User management, talent approval, financial oversight
- **Document Verification**: KTP/ID verification with admin review system
- **Review Management**: Admin verification of user reviews before publication
- **Real-time Analytics**: System statistics, booking trends, and performance metrics
- **Comprehensive Reporting**: Financial reports, user analytics, and system health monitoring

### Security & Verification
- **Multi-step Verification**: KTP upload, email verification, and WhatsApp verification
- **Document Management**: Secure file upload and storage with admin review
- **Role-based Access Control**: Separate permissions for users, talents, and admins
- **Production-ready Security**: Row-level security, input validation, and secure authentication

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Tailwind CSS** for responsive design
- **shadcn/ui** for consistent UI components
- **React Router** for navigation
- **Vite** for fast development and building

### Backend & Infrastructure
- **Supabase** for database, authentication, and storage
- **PostgreSQL** with advanced features and triggers
- **Edge Functions** for serverless backend logic
- **Real-time subscriptions** for live updates

### Integrations
- **Midtrans** for payment processing
- **TextMeBot** for WhatsApp notifications
- **Supabase Storage** for document and image management

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Midtrans account (for payments)
- TextMeBot API access (for WhatsApp)

### Installation

1. **Clone the repository**:
```bash
git clone <repository-url>
cd temanly-social-spark
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
cp .env.example .env.local
```

Fill in your configuration values:
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_MIDTRANS_CLIENT_KEY=your-midtrans-client-key
VITE_TEXTMEBOT_API_KEY=jYg9R67hoNMT
# ... other variables
```

4. **Set up the database**:
```bash
# Apply database migrations
supabase db push

# Set up storage buckets
supabase storage create documents
supabase storage create profile-images
```

5. **Start the development server**:
```bash
npm run dev
```

## 📊 System Architecture

### Key User Flows
1. **User Registration & Verification**: Complete KTP, email, and WhatsApp verification
2. **Talent Onboarding**: Detailed profile setup with service configuration
3. **Booking Process**: Service selection, payment, and WhatsApp coordination
4. **Admin Management**: Real-time oversight and approval workflows

### Security Features
- Row-level security policies
- Encrypted data storage
- Secure file upload with admin review
- Rate limiting and abuse prevention

## 🚀 Deployment

See `DEPLOYMENT.md` for comprehensive deployment instructions.

### Quick Deploy
1. Set up Supabase project and apply migrations
2. Configure Midtrans and WhatsApp integrations
3. Deploy to Vercel with environment variables
4. Run production tests at `/production-test`

## 📈 Production Testing

Access `/production-test` for comprehensive system testing including:
- Database connectivity
- Payment system integration
- WhatsApp notifications
- File upload functionality
- Admin dashboard access

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow TypeScript best practices
4. Add tests for new features
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Temanly** - Connecting people through meaningful social experiences. 💖

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
