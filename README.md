# Autism Detection Application

A Next.js application designed to help identify autism spectrum traits through simple, scientifically-backed assessments. This application provides an intuitive platform for conducting assessments and viewing results.

## Key Features

- **User Authentication**: Secure sign-up/login with Clerk Authentication
- **Interactive Assessments**: Multi-step assessment questionnaires
- **Dashboard**: View past reports and start new assessments
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Data Security**: Secure handling of sensitive assessment data

## Technology Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Authentication**: Clerk
- **Database**: MongoDB with Prisma ORM
- **State Management**: Zustand
- **Testing**: Jest, React Testing Library

## Project Structure

```
/autism-detector
├── /node_modules
├── /prisma            # Prisma schema and migrations
├── /public            # Static assets
├── /src
│   ├── /app           # Next.js App Router
│   │   ├── /dashboard # Dashboard and assessment pages
│   │   ├── /sign-in   # Authentication pages
│   │   └── /sign-up   
│   ├── /components    # Reusable UI components
│   ├── /features      # Feature-based components
│   ├── /hooks         # Custom React hooks
│   ├── /lib           # Utility libraries and configurations
│   ├── /styles        # Global styles and Tailwind customizations
│   └── /utils         # Utility functions
├── /__mocks__         # Jest mocks
├── /tests             # Test files
├── .env.example       # Example environment variables
├── .eslintrc.json     # ESLint configuration
├── .gitignore         # Git ignore file
├── .prettierrc        # Prettier configuration
├── babel.config.js    # Babel configuration
├── jest.config.js     # Jest configuration
├── jest.setup.js      # Jest setup file
├── next.config.js     # Next.js configuration
├── package.json       # Project dependencies
├── README.md          # Project documentation
└── tsconfig.json      # TypeScript configuration
```

## Getting Started

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up the environment variables:

```bash
cp .env.example .env
```

4. Edit the `.env` file with your MongoDB and Clerk credentials

5. Generate Prisma client:

```bash
npx prisma generate
```

6. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Testing

Run tests using Jest:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## User Flow

1. **Landing Page**: Users arrive at the homepage with information about the application
2. **Sign Up/Login**: New users create an account, returning users sign in
3. **Dashboard**: After authentication, users see their dashboard with options
4. **Start Assessment**: Users can start a new assessment
5. **Assessment Steps**: Multiple steps for gathering information
6. **Results**: View assessment results and recommendations
7. **Reports**: Access detailed reports of past assessments

## Available Scripts

- `npm run dev`: Run the development server
- `npm run build`: Build the application for production
- `npm start`: Start the production server
- `npm run lint`: Run ESLint to check for code quality issues
- `npm test`: Run tests
- `npm run test:watch`: Run tests in watch mode

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
