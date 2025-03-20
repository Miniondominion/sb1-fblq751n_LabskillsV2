# Lab Skills App v2

A comprehensive system for managing and documenting laboratory skills and certifications.

## Features

- User authentication with role-based access (Student, Instructor, Admin)
- Skills management with customizable verification forms
- Student progress tracking
- Instructor assignment and verification system
- Category-based skill organization

## Tech Stack

- React with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Supabase for backend and authentication
- React Router for navigation
- React Query for data fetching
- Lucide React for icons

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and update with your Supabase credentials
4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

The following environment variables are required:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Project Structure

- `/src/components`: React components
- `/src/contexts`: React context providers
- `/src/lib`: Utility functions and configurations
- `/src/pages`: Page components
- `/src/types`: TypeScript type definitions
- `/supabase/migrations`: Database migration files

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

MIT