# Autism Detection Application

A Next.js application designed to help identify autism spectrum traits through advanced eye-tracking technology. This application provides a scientifically-backed, non-invasive tool for assessing visual tracking patterns that may indicate autism spectrum characteristics.

## Purpose

The primary goal of this application is to provide an accessible, early-stage screening tool for autism spectrum traits based on eye movement patterns. Research has shown that individuals on the autism spectrum often display distinctive eye-tracking patterns when following visual stimuli. This application captures and analyzes these patterns to help identify potential indicators, which can lead to earlier intervention and support.

## Key Features

- **Eye Tracking Assessment**: Non-invasive test that tracks eye movements while following a moving target
- **Real-time Analysis**: Processes eye movement data to detect patterns associated with autism traits
- **Visual Reporting**: Provides clear visualization of tracking patterns and assessment results
- **Accuracy-based Risk Assessment**: Categorizes results based on tracking accuracy thresholds
- **User Authentication**: Secure sign-up/login with Clerk Authentication
- **Responsive Design**: Works on desktop, tablet, and mobile devices with webcam support

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Authentication**: Clerk
- **State Management**: Zustand
- **AI/ML Components**: TensorFlow.js, BlazeFace for face detection
- **Data Visualization**: Canvas API for eye movement visualization
- **Testing**: Jest, React Testing Library

## Eye Tracking Technology

The application uses TensorFlow.js and face detection models to track eye movements in real-time through the user's webcam. This approach allows for accessible testing without specialized hardware.

### How Eye Tracking Works

1. **Face Detection**: The application uses BlazeFace (a lightweight face detection model) to locate the user's face in the webcam feed
2. **Eye Position Tracking**: Once the face is detected, the system tracks the position of the eyes
3. **Pattern Analysis**: As the user follows a moving ball in a square pattern, the application recorded eye movement data
4. **Data Processing**: Eye movement data is analyzed for:
   - **Tracking Accuracy**: How precisely the eyes follow the target
   - **Wiggle Score**: Measurement of unwanted vertical/horizontal movements
   - **Square Pattern Detection**: Whether the eyes follow the expected square pattern
   - **Saccade Frequency**: Rapid eye movements between points
   - **Fixation Duration**: How long the eyes remain fixed on specific points

### Risk Assessment Criteria

The application uses research-backed thresholds to assess risk levels:

- **80% or higher tracking accuracy**: Perfectly normal eye tracking (Low Risk)
- **Above 60% tracking accuracy**: Good eye tracking (Low Risk)
- **55-60% tracking accuracy**: Moderate Risk
- **Below 55% tracking accuracy**: High Risk

## Page Structure and Flow

### Home Page (`/`)
The landing page with an introduction to the application, its purpose, and guidance on getting started.

### Eye Tracking Test (`/eye-tracking-test`)
The main assessment page with the following phases:
1. **Introduction Phase**: Explains the test procedure and prepares the user
2. **Setup Phase**: Configures the webcam and ensures proper face detection
3. **Ready Phase**: Final instructions before starting the test
4. **Testing Phase**: The actual eye tracking test where users follow a moving ball in a square pattern
5. **Results Phase**: Displays comprehensive results including:
   - Risk assessment based on tracking accuracy
   - Square pattern detection status
   - Detailed metrics (saccade frequency, fixation duration, etc.)
   - Personalized interpretation and suggestions

### Test Calculation Page (`/test-calc`)
A development and validation page that shows how the eye tracking calculations work with test data of varying accuracy levels. This page demonstrates the relationship between eye movement patterns and calculated risk assessments.

### Ball Animation Page (`/ball`)
A simplified version of the eye tracking test that only shows the ball animation component. Useful for testing and demonstration purposes.

### Eye Detector Page (`/eye-detector`)
A diagnostic page that demonstrates real-time eye detection using the webcam feed.

### Dashboard (`/dashboard`)
User dashboard to access past assessments and start new tests (requires authentication).

## How the Components Work Together

### Testing Process Flow

1. **Initial Setup**: The user grants webcam permission and positions themselves in front of their camera
2. **Calibration**: The system detects the face and eyes to ensure proper tracking
3. **Test Execution**: A ball moves in a square pattern, and the user is instructed to follow it with their eyes
4. **Data Collection**: The application collects approximately 30 seconds of eye movement data
5. **Analysis**: The collected data is processed to calculate key metrics:
   - **Wiggle Score**: Converted to a tracking accuracy percentage (higher is better)
   - **Square Pattern Detection**: Determines if the eyes follow the expected pattern
   - **Saccade Frequency**: Measures rapid eye movements
   - **Fixation Duration**: Assesses attention focus capability
6. **Results Generation**: Based on these metrics, the system generates a risk assessment and personalized feedback

### Key Components

- **WebcamFeed**: Captures video input and processes it for eye tracking
- **AnimatedBall**: Renders the moving target that follows a square pattern
- **EyePathCanvas**: Visualizes the eye movement paths compared to the ideal square pattern
- **EyeTrackingVisualizer**: Provides heat maps and trail visualizations of eye movements
- **ResultsPhase**: Displays comprehensive analysis and recommendations

## Getting Started

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory with the following variables:

```
# Clerk Authentication (required for auth features)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> Note: Authentication is only required for dashboard features. The eye tracking test can be used without authentication.

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser
6. Navigate to the eye tracking test page to start an assessment

## Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Webcam access
- Good lighting conditions for optimal face detection
- Stable internet connection for initial loading of ML models

## Privacy Considerations

- All eye tracking processing happens locally in the browser
- No video data is sent to external servers
- Assessment results can be saved to user accounts if authenticated

## Available Scripts

- `npm run dev`: Run the development server
- `npm run build`: Build the application for production
- `npm start`: Start the production server
- `npm run lint`: Run ESLint to check for code quality issues
- `npm test`: Run tests

## Learn More

- [TensorFlow.js Documentation](https://www.tensorflow.org/js)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Research on Eye Tracking and Autism](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5970267/)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
