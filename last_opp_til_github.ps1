# PowerShell script for å laste opp til GitHub
# Kjør dette scriptet etter at du har opprettet repository på GitHub

Write-Host "=== Last opp Neon Snake Deluxe til GitHub ===" -ForegroundColor Green
Write-Host ""

# Naviger til prosjektmappen
$projectPath = "C:\Users\skogm\OneDrive\Dokumenter\Python script"
Set-Location $projectPath

Write-Host "Prosjektmappe: $projectPath" -ForegroundColor Yellow
Write-Host ""

# Spør om GitHub brukernavn
$username = Read-Host "Skriv inn ditt GitHub brukernavn"

if ([string]::IsNullOrWhiteSpace($username)) {
    Write-Host "Feil: Du må skrive inn brukernavn!" -ForegroundColor Red
    exit
}

$repoName = "neon-snake-deluxe"
$repoUrl = "https://github.com/$username/$repoName.git"

Write-Host ""
Write-Host "Repository URL: $repoUrl" -ForegroundColor Cyan
Write-Host ""

# Sjekk om git er initialisert
if (-not (Test-Path ".git")) {
    Write-Host "Initialiserer Git..." -ForegroundColor Yellow
    git init
}

# Legg til alle filer
Write-Host "Legger til filer..." -ForegroundColor Yellow
git add .

# Commit
Write-Host "Lager commit..." -ForegroundColor Yellow
git commit -m "Initial commit - Neon Snake Deluxe"

# Sett hovedgren
Write-Host "Setter hovedgren..." -ForegroundColor Yellow
git branch -M main

# Legg til remote (fjern hvis den allerede finnes)
Write-Host "Legger til GitHub repository..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin $repoUrl

# Push til GitHub
Write-Host ""
Write-Host "Laster opp til GitHub..." -ForegroundColor Yellow
Write-Host "Du blir kanskje bedt om å logge inn på GitHub." -ForegroundColor Cyan
Write-Host ""

git push -u origin main

Write-Host ""
Write-Host "=== Ferdig! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Neste steg:" -ForegroundColor Yellow
Write-Host "1. Gå til: https://github.com/$username/$repoName" -ForegroundColor Cyan
Write-Host "2. Klikk Settings → Pages" -ForegroundColor Cyan
Write-Host "3. Velg 'GitHub Actions' under Source" -ForegroundColor Cyan
Write-Host "4. Vent 2-5 minutter på første deploy" -ForegroundColor Cyan
Write-Host ""

