# Newman Test Runner Script for Windows
# Runs Postman collection with Newman

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Running Loomio API Tests with Newman" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Check if Newman is installed
$newmanInstalled = Get-Command newman -ErrorAction SilentlyContinue

if (-not $newmanInstalled) {
    Write-Host "Newman is not installed. Installing now..." -ForegroundColor Yellow
    npm install -g newman newman-reporter-htmlextra
}

# Create results directory
New-Item -ItemType Directory -Force -Path "tests\api\results" | Out-Null

# Run tests
newman run tests\api\postman-collection.json `
  -e tests\api\postman-environment.json `
  --reporters cli,json,htmlextra `
  --reporter-json-export tests\api\results\newman-report.json `
  --reporter-htmlextra-export tests\api\results\newman-report.html `
  --reporter-htmlextra-darkTheme `
  --timeout-request 10000 `
  --bail

# Check exit code
if ($LASTEXITCODE -eq 0) {
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "All tests passed! ✓" -ForegroundColor Green
    Write-Host "HTML Report: tests\api\results\newman-report.html" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Green
    exit 0
} else {
    Write-Host "=========================================" -ForegroundColor Red
    Write-Host "Some tests failed! ✗" -ForegroundColor Red
    Write-Host "Check report: tests\api\results\newman-report.html" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Red
    exit 1
}
