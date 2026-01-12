# Firestore Security Rules Deployment Script
# This script helps you deploy Firestore security rules to Firebase

Write-Host "`n=== Firestore Security Rules Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if Firebase CLI is available
Write-Host "Step 1: Checking Firebase CLI..." -ForegroundColor Yellow
$firebaseVersion = npx firebase --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Firebase CLI found: $firebaseVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Firebase CLI not found. Please run: npm install" -ForegroundColor Red
    exit 1
}

# Step 2: Check if user is logged in
Write-Host "`nStep 2: Checking Firebase authentication..." -ForegroundColor Yellow
$projects = npx firebase projects:list 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ You are logged in to Firebase" -ForegroundColor Green
    Write-Host "`nAvailable projects:" -ForegroundColor Cyan
    Write-Host $projects
} else {
    Write-Host "❌ Not logged in to Firebase" -ForegroundColor Red
    Write-Host "`nPlease run the following command in your terminal:" -ForegroundColor Yellow
    Write-Host "  npx firebase login" -ForegroundColor White
    Write-Host "`nThis will open a browser window for authentication." -ForegroundColor Gray
    exit 1
}

# Step 3: Check .firebaserc
Write-Host "`nStep 3: Checking project configuration..." -ForegroundColor Yellow
$firebasercPath = Join-Path $PSScriptRoot ".." ".firebaserc"
if (Test-Path $firebasercPath) {
    $firebaserc = Get-Content $firebasercPath | ConvertFrom-Json
    $projectId = $firebaserc.projects.default
    
    if ($projectId -eq "your-project-id-here") {
        Write-Host "⚠️  Project ID not configured in .firebaserc" -ForegroundColor Yellow
        Write-Host "`nPlease update .firebaserc with your Firebase project ID." -ForegroundColor Yellow
        Write-Host "You can find it:" -ForegroundColor Gray
        Write-Host "  1. In your .env file as VITE_FIREBASE_PROJECT_ID" -ForegroundColor Gray
        Write-Host "  2. In Firebase Console > Project Settings > General" -ForegroundColor Gray
        Write-Host "  3. From the list above (if available)" -ForegroundColor Gray
        Write-Host "`nOr run: firebase use --add" -ForegroundColor White
        exit 1
    } else {
        Write-Host "✅ Project ID configured: $projectId" -ForegroundColor Green
    }
} else {
    Write-Host "❌ .firebaserc file not found" -ForegroundColor Red
    exit 1
}

# Step 4: Check firestore.rules exists
Write-Host "`nStep 4: Checking security rules file..." -ForegroundColor Yellow
$rulesPath = Join-Path $PSScriptRoot ".." "firestore.rules"
if (Test-Path $rulesPath) {
    Write-Host "✅ firestore.rules file found" -ForegroundColor Green
} else {
    Write-Host "❌ firestore.rules file not found" -ForegroundColor Red
    exit 1
}

# Step 5: Deploy rules
Write-Host "`nStep 5: Deploying security rules..." -ForegroundColor Yellow
Write-Host "⚠️  WARNING: This will deploy rules to your Firebase project!" -ForegroundColor Yellow
Write-Host "Project: $projectId" -ForegroundColor Cyan
Write-Host ""

$confirm = Read-Host "Do you want to proceed? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host "`nDeploying..." -ForegroundColor Cyan
$deployOutput = npx firebase deploy --only firestore:rules 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Security rules deployed successfully!" -ForegroundColor Green
    Write-Host "`nRules are now active on your Firebase project." -ForegroundColor Green
    Write-Host "Verify in Firebase Console: https://console.firebase.google.com/project/$projectId/firestore/rules" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Deployment failed!" -ForegroundColor Red
    Write-Host $deployOutput
    exit 1
}

Write-Host "`n=== Deployment Complete ===" -ForegroundColor Cyan

