# 🚀 Firestore Security Rules - Deployment Instructions

## Quick Start (Automated)

If you have PowerShell available, run:

```powershell
.\scripts\deploy-rules.ps1
```

This script will guide you through all the steps automatically.

---

## Manual Deployment Steps

Follow these steps if you prefer to deploy manually or if the script doesn't work:

### Step 1: Login to Firebase

Open your terminal in the project directory and run:

```bash
npx firebase login
```

This will open a browser window. Sign in with your Google account that has access to your Firebase project.

**Verify login:**
```bash
npx firebase projects:list
```

You should see a list of your Firebase projects.

### Step 2: Get Your Firebase Project ID

You have several options:

**Option A: From your .env file**
- If you have a `.env` file, look for `VITE_FIREBASE_PROJECT_ID`
- Example: `VITE_FIREBASE_PROJECT_ID=my-project-12345`

**Option B: From Firebase Console**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the ⚙️ (gear icon) → Project Settings
4. Look for "Project ID" in the General tab

**Option C: From the projects list**
```bash
npx firebase projects:list
```
This will show all your projects with their IDs.

### Step 3: Update .firebaserc

Edit `.firebaserc` and replace `your-project-id-here` with your actual project ID:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

**Example:**
```json
{
  "projects": {
    "default": "regain-app-2024"
  }
}
```

### Step 4: Deploy Security Rules

Once `.firebaserc` is updated, deploy the rules:

```bash
npm run firebase:deploy-rules
```

Or directly:
```bash
npx firebase deploy --only firestore:rules
```

### Step 5: Verify Deployment

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules** tab
4. Verify that your rules are displayed (should match `firestore.rules`)

---

## Alternative: Using Firebase CLI Interactive Setup

If you prefer, Firebase CLI can help you set up the project:

```bash
npx firebase init firestore
```

This will:
- Ask you to select or create a project
- Automatically configure `.firebaserc` and `firebase.json`
- Optionally deploy rules (you can skip this and use `npm run firebase:deploy-rules` instead)

**Note:** If you run `firebase init`, it may modify `firebase.json`. Our current `firebase.json` is already configured correctly, so you can say "No" to overwriting it, or manually merge any changes.

---

## Troubleshooting

### Error: "Project not found"
- Verify the project ID in `.firebaserc` is correct
- Ensure you're logged in with `firebase login`
- Check that your account has access to the project

### Error: "Permission denied"
- Your account needs "Editor" or "Owner" role on the Firebase project
- Contact your project administrator to grant permissions

### Error: "Rules deployment failed"
- Check `firestore.rules` syntax using Firebase Console Rules Playground
- Ensure you have network connectivity
- Verify Firebase CLI is up to date: `npm install -g firebase-tools@latest`

### Rules deployed but app still has errors
- Rules take effect immediately after deployment
- Check browser console for specific permission errors
- Verify users are authenticated before accessing Firestore
- Test with Firebase Console Rules Playground

---

## Post-Deployment Testing

After deploying, test these scenarios:

1. ✅ **Authenticated user can access their own data**
   - Login to your app
   - Verify you can read/write your profile

2. ✅ **Authenticated user cannot access other users' data**
   - Try accessing `users/{differentUserId}` in browser console
   - Should receive permission denied error

3. ✅ **Unauthenticated access is blocked**
   - Logout
   - Attempt to access Firestore data
   - Should be blocked

4. ✅ **Collection queries are protected**
   - Try listing all users: `collection(db, 'users')`
   - Should be denied

---

## Quick Reference Commands

```bash
# Login to Firebase
npx firebase login

# List available projects
npx firebase projects:list

# Set project (alternative to editing .firebaserc)
npx firebase use --add

# Deploy security rules
npm run firebase:deploy-rules

# View current rules
npx firebase firestore:rules:get

# Test rules locally (requires emulator setup)
npm run firebase:test-rules
```

---

## Status Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Logged in to Firebase (`firebase login`)
- [ ] Project ID configured in `.firebaserc`
- [ ] Security rules deployed (`npm run firebase:deploy-rules`)
- [ ] Rules verified in Firebase Console
- [ ] Application tested and working

---

**Next Steps**: Once deployed, your Firestore database will be protected. Monitor your Firebase Console for any permission errors and adjust rules as needed.

