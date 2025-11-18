# LaTeX Test Report Compiler
# Compiles all generated LaTeX reports to PDF

param(
    [string]$ReportId = "latest"
)

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "LaTeX Test Report Compiler" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$latexDir = "tests\reports\latex"
$pdfDir = "tests\reports\pdf"

# Check if pdflatex is installed
$pdflatex = Get-Command pdflatex -ErrorAction SilentlyContinue
if (-not $pdflatex) {
    Write-Host "⚠️  pdflatex not found!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To compile LaTeX to PDF, install a LaTeX distribution:" -ForegroundColor Yellow
    Write-Host "  • Windows: MiKTeX (https://miktex.org/)" -ForegroundColor Yellow
    Write-Host "  • Or: TeX Live (https://www.tug.org/texlive/)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "LaTeX source files are available in: $latexDir" -ForegroundColor Cyan
    Write-Host ""
    exit 0
}

# Create PDF directory
if (-not (Test-Path $pdfDir)) {
    New-Item -ItemType Directory -Path $pdfDir -Force | Out-Null
}

Write-Host "📁 LaTeX Directory: $latexDir" -ForegroundColor Cyan
Write-Host "📁 PDF Output Directory: $pdfDir" -ForegroundColor Cyan
Write-Host ""

# Get all LaTeX files
if ($ReportId -eq "latest") {
    $latexFiles = Get-ChildItem -Path $latexDir -Filter "latest*.tex"
} else {
    $latexFiles = Get-ChildItem -Path $latexDir -Filter "*$ReportId*.tex"
}

if ($latexFiles.Count -eq 0) {
    Write-Host "❌ No LaTeX files found for report: $ReportId" -ForegroundColor Red
    exit 1
}

Write-Host "Found $($latexFiles.Count) LaTeX file(s) to compile" -ForegroundColor Green
Write-Host ""

$compiled = 0
$failed = 0

foreach ($file in $latexFiles) {
    Write-Host "📄 Compiling: $($file.Name)" -ForegroundColor Cyan
    
    # Change to latex directory for compilation
    Push-Location $latexDir
    
    # Compile (run twice for proper references)
    $output1 = pdflatex -interaction=nonstopmode -output-directory=. $file.Name 2>&1
    $output2 = pdflatex -interaction=nonstopmode -output-directory=. $file.Name 2>&1
    
    Pop-Location
    
    # Check if PDF was created
    $pdfName = $file.BaseName + ".pdf"
    $pdfPath = Join-Path $latexDir $pdfName
    
    if (Test-Path $pdfPath) {
        # Move PDF to output directory
        $destPath = Join-Path $pdfDir $pdfName
        Move-Item -Path $pdfPath -Destination $destPath -Force
        Write-Host "   ✅ Success: $destPath" -ForegroundColor Green
        $compiled++
        
        # Clean up auxiliary files
        Remove-Item (Join-Path $latexDir "$($file.BaseName).aux") -ErrorAction SilentlyContinue
        Remove-Item (Join-Path $latexDir "$($file.BaseName).log") -ErrorAction SilentlyContinue
        Remove-Item (Join-Path $latexDir "$($file.BaseName).out") -ErrorAction SilentlyContinue
        Remove-Item (Join-Path $latexDir "$($file.BaseName).toc") -ErrorAction SilentlyContinue
    } else {
        Write-Host "   ❌ Failed to compile" -ForegroundColor Red
        $failed++
    }
    Write-Host ""
}

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Compilation Summary" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "✅ Compiled: $compiled" -ForegroundColor Green
Write-Host "❌ Failed: $failed" -ForegroundColor Red
Write-Host ""

if ($compiled -gt 0) {
    Write-Host "📂 PDF files saved to: $pdfDir" -ForegroundColor Cyan
    Write-Host ""
    
    # Open the master report if it exists
    $masterPdf = Join-Path $pdfDir "latest_master_report.pdf"
    if (Test-Path $masterPdf) {
        Write-Host "Opening master report..." -ForegroundColor Cyan
        Start-Process $masterPdf
    }
}

exit 0
