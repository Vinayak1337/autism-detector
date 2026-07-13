# Browser Eye-Tracking Screening Prototype

An experimental, non-diagnostic screening prototype that explores eye-tracking patterns in the browser using TensorFlow.js/BlazeFace. This is not a medical or diagnostic tool.

## Disclaimer

This software is an experimental technical prototype. Its outputs have not been clinically validated and must not be used to diagnose, rule out, predict, or make decisions about autism or any health condition. Tracking summaries and labels produced by the app are implementation-defined demonstrations, not medical findings. Consult a qualified healthcare professional for medical guidance.

## Purpose

The project explores whether webcam-based face landmarks can support an accessible browser experiment for collecting and visualizing gaze-following data. It demonstrates real-time tracking, metric calculation, and results presentation without specialized eye-tracking hardware.

## Key features

- **Eye-tracking session:** tracks eye movement while the user follows a moving target
- **Real-time metrics:** computes implementation-defined movement and accuracy measurements
- **Visual summaries:** renders eye paths, heat maps, trails, and metric cards
- **Prototype result bands:** groups tracking accuracy into demonstration-only labels with no clinical meaning
- **User authentication:** optional sign-up and sign-in with Clerk for dashboard features
- **Responsive interface:** supports modern desktop, tablet, and mobile browsers with webcam access

## Technology stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Authentication:** Clerk
- **State management:** Zustand
- **Browser ML:** TensorFlow.js and BlazeFace face detection
- **Visualization:** Canvas API
- **Testing:** Jest and React Testing Library

## Eye-tracking implementation

TensorFlow.js and BlazeFace process the webcam feed in the browser. Video frames are used to locate the face and estimate eye positions; raw video is not uploaded by the tracking flow.

### How it works

1. **Face detection:** BlazeFace locates the user's face in the webcam feed.
2. **Eye position estimation:** the app derives eye positions from the detected landmarks.
3. **Target following:** the user follows a ball moving in a square path.
4. **Data processing:** the app calculates:
   - **Tracking accuracy:** proximity between the estimated gaze path and target path
   - **Wiggle score:** horizontal and vertical movement variation
   - **Square-pattern detection:** similarity to the expected square path
   - **Saccade frequency:** rapid changes between estimated eye positions
   - **Fixation duration:** time spent around a location

These metrics describe the prototype's tracking output only. They do not establish or imply a relationship to a medical condition.

## Page structure and flow

### Home page (`/`)

Introduces the experiment and links to the tracking flow.

### Eye-tracking session (`/eye-tracking-test`)

The main flow contains:

1. **Introduction:** explains the procedure.
2. **Setup:** requests camera access and checks face detection.
3. **Ready:** presents final instructions.
4. **Tracking:** records estimated eye positions while the target moves.
5. **Results:** shows prototype-defined metrics and visualizations with no clinical interpretation.

### Calculation sandbox (`/test-calc`)

A development page for inspecting how sample tracking data changes the prototype's calculations and display bands.

### Ball animation (`/ball`)

Runs the target animation independently for development and demonstration.

### Eye detector (`/eye-detector`)

Demonstrates real-time webcam face and eye-position detection.

### Dashboard (`/dashboard`)

Provides authenticated access to saved experimental sessions and the new-session flow.

## Component flow

1. The user grants webcam permission and positions their face in frame.
2. The app confirms that BlazeFace can locate the face and eye landmarks.
3. A ball moves through a square path while the browser records estimated eye positions.
4. The client processes the collected points into movement and path-following metrics.
5. The results view renders those metrics and path visualizations as an experimental summary.

Key components include:

- **WebcamFeed:** captures local video frames for browser-side processing
- **AnimatedBall:** renders the square-path target
- **EyePathCanvas:** compares the estimated eye path with the target path
- **EyeTrackingVisualizer:** renders heat-map and trail views
- **ResultsPhase:** presents the non-clinical experimental summary

## Privacy

- Eye-tracking and face-detection processing runs locally in the browser.
- The tracking flow does not upload webcam video.
- Authenticated users can save generated session summaries to their accounts.

## Run locally

```bash
git clone https://github.com/Vinayak1337/autism-detector.git
cd autism-detector
npm install
```

Create `.env.local` with the environment variables needed for Clerk-backed dashboard features:

```dotenv
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL
NEXT_PUBLIC_CLERK_SIGN_UP_URL
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
NEXT_PUBLIC_APP_URL
DATABASE_URL
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The tracking flow needs a modern browser, webcam permission, and adequate lighting.

## Available scripts

- `npm run dev` — start the development server
- `npm run build` — create a production build
- `npm start` — serve the production build
- `npm run lint` — run ESLint
- `npm test` — run tests

## License

This project is licensed under the MIT License. See `LICENSE` for details.
