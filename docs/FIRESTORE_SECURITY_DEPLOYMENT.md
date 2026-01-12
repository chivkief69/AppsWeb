# Firestore Security Rules Deployment Guide

## ✅ Implementation Status

Firestore security rules have been **implemented** in `firestore.rules`. The rules need to be **deployed to Firebase** to take effect.

## 🔒 Security Rules Overview

The implemented rules enforce:

- ✅ **User isolation**: Users can only access their own data (`users/{userId}`)
- ✅ **Authentication required**: All operations require valid authentication
- ✅ **Sub-collection protection**: All sub-collections (trainingSystems, milestones, workouts, sessions) are protected
- ✅ **Collection-level queries blocked**: Prevents listing all users
- ✅ **Field validation**: Validates email and role fields on write
- ✅ **Default deny**: All undefined collections are denied by default

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] Firebase project created
- [ ] Firebase CLI installed (will be installed via `npm install`)
- [ ] Firebase project ID available
- [ ] Access to deploy to Firebase project

## 🚀 Deployment Steps

### Step 1: Update Project Configuration

Edit `.firebaserc` and replace `your-project-id-here` with your actual Firebase project ID:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

**To find your project ID:**
- Check Firebase Console → Project Settings → General → Project ID
- Or check your `.env` file: `VITE_FIREBASE_PROJECT_ID`

### Step 2: Install Dependencies

```bash
npm install
```

This will install `firebase-tools` as a dev dependency.

### Step 3: Login to Firebase

```bash
firebase login
```

This will open a browser window for authentication. You need to be authenticated with an account that has permission to deploy to your Firebase project.

### Step 4: Deploy Security Rules

```bash
npm run firebase:deploy-rules
```

Or directly:
```bash
firebase deploy --only firestore:rules
```

### Step 5: Verify Deployment

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules** tab
4. Verify that your rules are displayed and match `firestore.rules`

## 🧪 Testing Rules Locally (Optional)

Before deploying to production, you can test rules locally using Firebase Emulator:

```bash
# Install emulator (if not already installed)
firebase init emulators

# Start emulators
firebase emulators:start

# In another terminal, test rules
npm run firebase:test-rules
```

## ⚠️ Important Notes

### Rules Take Effect Immediately

Once deployed, rules are **active immediately**. Make sure:

1. Your application code is already using authenticated Firebase Auth
2. Users are properly authenticated before accessing Firestore
3. You've tested the rules work with your application flow

### Testing After Deployment

After deployment, test these scenarios:

1. ✅ Authenticated user can read/write their own data
2. ✅ Authenticated user **cannot** read another user's data
3. ✅ Authenticated user **cannot** write to another user's document
4. ✅ Unauthenticated user **cannot** access any data
5. ✅ User **cannot** list all users in the collection

### Rollback (If Needed)

If you need to rollback rules:

1. Edit rules in Firebase Console → Firestore → Rules
2. Revert to previous version using Firebase Console version history
3. Or redeploy previous version of `firestore.rules` file

## 🔍 Verification Checklist

After deployment, verify:

- [ ] Rules are visible in Firebase Console
- [ ] Application still works for authenticated users
- [ ] Users can access their own data
- [ ] Users cannot access other users' data (test with different accounts)
- [ ] Unauthenticated access is blocked
- [ ] No errors in browser console related to Firestore permissions

## 📚 Additional Resources

- [Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Rules Playground](https://console.firebase.google.com/project/_/firestore/rules) - Test rules in Firebase Console
- [Security Rules Best Practices](https://firebase.google.com/docs/firestore/security/rules-conditions)

## 🆘 Troubleshooting

### Error: "Project not found"
- Verify project ID in `.firebaserc` matches your Firebase project
- Ensure you're logged in with `firebase login`

### Error: "Permission denied"
- Verify your account has "Firebase Admin" or "Editor" role on the project
- Contact project owner to grant permissions

### Error: "Rules deployment failed"
- Check `firestore.rules` syntax for errors
- Use Firebase Console Rules Playground to test syntax
- Verify you have network connectivity

### Application breaks after deployment
- Check browser console for specific permission errors
- Verify users are authenticated before accessing Firestore
- Review `dbService.js` to ensure it's using authenticated user IDs

---

**Status**: ✅ Rules implemented | ⚠️ Ready for deployment

