# Hello Firebase Setup Guide 
test one

This guide reconstructs the setup steps and terminal commands used for the **Hello Firebase** proof of concept project.

## Purpose

Build a minimal **React + Vite + JavaScript** app and deploy it to **Firebase Hosting** from **GitHub Codespaces**.

## What this validates

- Codespaces works on iPad
- React app creation works
- Vite development flow works
- Firebase Hosting works
- You can edit, build, deploy, and open the app from a live URL

## Success criterion

You can change text in the app, redeploy, and see the update live.

---

## Step 1. Open your Codespace and verify the environment

Run these commands to confirm Node and npm are available and that the terminal is working:

```bash
node -v
npm -v
pwd
ls
```

You want a modern Node version available. If Node is missing or very old, fix that before continuing.

---

## Step 2. Create the React + Vite project

Scaffold the project with Vite:

```bash
npm create vite@latest hello-react-firebase -- --template react
```

This creates a new React project called `hello-react-firebase`.

---

## Step 3. Move into the project and install dependencies

```bash
cd hello-react-firebase
npm install
```

This installs the packages required by the project.

---

## Step 4. Start the development server

```bash
npm run dev
```

Open the forwarded preview URL from Codespaces and confirm the starter Vite app loads.

---

## Step 5. Replace the starter app with a minimal Hello World app

Replace the contents of `src/App.jsx` with:

```jsx
import { useState } from 'react'
import './index.css'

export default function App() {
  const [message, setMessage] = useState('Ready')

  function handleClick() {
    setMessage('It works')
  }

  return (
    <main className="app">
      <h1>Hello World</h1>
      <p>Current message: {message}</p>
      <button onClick={handleClick}>Change message</button>
    </main>
  )
}
```

Replace the contents of `src/index.css` with:

```css
:root {
  font-family: Arial, sans-serif;
  line-height: 1.5;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

#root {
  min-height: 100vh;
}

.app {
  min-height: 100vh;
  display: grid;
  place-content: center;
  gap: 1rem;
  text-align: center;
}

button {
  padding: 0.75rem 1rem;
  font-size: 1rem;
  cursor: pointer;
}
```

This gives you:
- one page
- one component
- one button
- one piece of state that changes

---

## Step 6. Test the edit and refresh loop

While the dev server is running:
- open the preview
- click the button
- confirm the message changes
- edit some text in `src/App.jsx`
- confirm the preview updates

This proves the local development loop is working.

---

## Step 7. Create a production build

```bash
npm run build
ls dist
```

This creates the production-ready files in the `dist` folder.

---

## Step 8. Install the Firebase CLI

```bash
npm install -g firebase-tools
```

Then log in:

```bash
firebase login
```

Follow the browser-based sign-in flow.

---

## Step 9. Initialise Firebase Hosting

Run:

```bash
firebase init hosting
```

When prompted, use these choices:

- **Use an existing project**
- choose your Firebase project
- set **public directory** to `dist`
- choose **Yes** for single-page app
- choose **No** when asked whether to overwrite `index.html`

These settings are important because Vite outputs the production build into `dist`.

---

## Step 10. Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

After deployment, Firebase will give you a hosted URL. Open it and confirm:
- the page loads
- the button works
- the message changes as expected

---

## Step 11. Validate the redeploy cycle

Make a small change in `src/App.jsx`, then run:

```bash
npm run build
firebase deploy --only hosting
```

Refresh the live site and confirm the change appears.

This proves the full edit, build, and deploy pipeline is working.

---

## Common pitfalls

### Wrong public directory
Firebase Hosting must point to:

```text
dist
```

Not `public`.

### Forgetting to rebuild
If you change the code and deploy without rebuilding, Firebase will upload the old build.

Always run:

```bash
npm run build
```

before:

```bash
firebase deploy --only hosting
```

### Overwriting the build output
When Firebase asks whether to overwrite `index.html`, choose **No**.

### Old Node version
If Vite or npm behaves oddly, check:

```bash
node -v
npm -v
```

---

## Full command list

```bash
node -v
npm -v
pwd
ls
npm create vite@latest hello-react-firebase -- --template react
cd hello-react-firebase
npm install
npm run dev
npm run build
ls dist
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy --only hosting
```

---

## Suggested milestone checklist

- Codespace opens successfully
- `node -v` and `npm -v` work
- Vite project is created
- `npm install` completes successfully
- `npm run dev` launches the app
- button click changes state
- `npm run build` creates the `dist` folder
- Firebase CLI installs and login works
- `firebase init hosting` is configured correctly
- `firebase deploy --only hosting` succeeds
- hosted URL opens correctly
- a later edit appears after rebuild and redeploy

---

## Recommended working pattern

Use this sequence each time:

1. Edit locally in Codespaces
2. Test with `npm run dev`
3. Build with `npm run build`
4. Deploy with `firebase deploy --only hosting`

That is the basic workflow for the Hello Firebase proof of concept.
