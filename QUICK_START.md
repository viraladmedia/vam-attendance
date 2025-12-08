# VAM Attendance - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (for backend)

### Installation

1. **Install Dependencies**
```bash
npm install
# or
yarn install
```

2. **Set Up Environment Variables**
Create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. **Run Development Server**
```bash
npm run dev
# or
yarn dev
```

4. **Open in Browser**
Navigate to `http://localhost:3000`

## 📁 Project Structure

### Key Directories
- `app/` - Next.js app directory with all pages and routes
- `components/` - Reusable React components
  - `layout/` - Header and Footer
  - `dashboard/` - Dashboard-specific components
  - `ui/` - UI library components
- `lib/` - Utility functions, helpers, and services
- `public/` - Static assets

## 🛣️ Available Routes

### Public Routes
- `/` - Homepage
- `/features` - Features page
- `/pricing` - Pricing plans
- `/about` - About page
- `/contact` - Contact form
- `/login` - Login page
- `/signup` - Registration page
- `/privacy` - Privacy policy
- `/terms` - Terms of service

### Protected Dashboard Routes
- `/dashboard` - Overview/statistics
- `/dashboard/attendance` - Attendance management
- `/dashboard/profile` - User profile
- `/dashboard/settings` - Settings

## 💡 Key Features

### Authentication
- Email/Password login
- Google OAuth
- GitHub OAuth
- Session management with Supabase

### Dashboard
- Attendance tracking and management
- Student and teacher management
- Attendance reports and analytics
- Session creation and tracking

### User Features
- Profile management
- Settings (notifications, security, data)
- Account management
- Two-factor authentication

## 🎨 Styling

### Tailwind CSS
- Version: v4
- Configuration: `tailwind.config.js`
- Global styles: `app/globals.css`

### Color System
```
Primary: Fuchsia (600)
Secondary: Cyan (600)
Neutral: Slate (50-900)
Success: Green (600)
Warning: Yellow (600)
Error: Red (600)
Info: Blue (600)
```

## 📦 Component Examples

### Using the Header Component
```tsx
import { Header } from "@/components/layout/Header";

export default function Page() {
  return (
    <>
      <Header />
      {/* Your content */}
    </>
  );
}
```

### Using Helper Functions
```tsx
import { formatDate, calculateAttendancePercentage, getInitials } from "@/lib/helpers";

const date = formatDate(new Date()); // "Dec 8, 2024"
const percentage = calculateAttendancePercentage(45, 50); // 90
const initials = getInitials("John Doe"); // "JD"
```

### Using UI Components
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
</Card>
```

## 🔄 API Integration

### Supabase Client
```tsx
import { getBrowserSupabase } from "@/lib/supabase/client";

const supabase = await getBrowserSupabase();
const { data, error } = await supabase
  .from('table_name')
  .select('*');
```

## 🧪 Testing

### Running Tests
```bash
npm run test
# or
yarn test
```

### Running Linter
```bash
npm run lint
# or
yarn lint
```

## 🚢 Deployment

### Build Production
```bash
npm run build
npm run start
```

### Deploy to Vercel
```bash
vercel
```

## 📚 Useful Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Radix UI Components](https://www.radix-ui.com)
- [Lucide Icons](https://lucide.dev)

## 🐛 Troubleshooting

### Port 3000 Already in Use
```bash
lsof -i :3000
kill -9 <PID>
```

### Module Not Found
```bash
rm -rf node_modules
npm install
```

### Supabase Connection Issues
- Check `.env.local` file
- Verify Supabase URL and API key
- Check network connection

## 📞 Support

For issues or questions:
- Check the [CODE_REVIEW_SUMMARY.md](./CODE_REVIEW_SUMMARY.md)
- Review component documentation
- Check Supabase logs
- Contact: support@vamattendance.com

## 📝 Development Tips

1. **Use TypeScript**: Leverage strict typing for better development experience
2. **Component Reusability**: Create small, reusable components
3. **Utility Functions**: Use helpers from `lib/helpers.ts` to avoid duplication
4. **Environment Variables**: Keep sensitive data in `.env.local`
5. **Git Commits**: Make atomic commits with clear messages
6. **Code Review**: Review changes before pushing to main

## 🎯 Next Steps

1. Connect authentication to Supabase
2. Implement attendance data persistence
3. Add email notifications
4. Setup Stripe for payments
5. Add analytics tracking
6. Create unit tests
7. Deploy to production

---

**Version**: 1.0.0
**Last Updated**: December 8, 2024
