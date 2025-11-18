#!/bin/bash

# LaTeX Test Report Compiler for Unix/Linux/Mac

REPORT_ID="${1:-latest}"

echo "====================================="
echo "LaTeX Test Report Compiler"
echo "====================================="
echo ""

LATEX_DIR="tests/reports/latex"
PDF_DIR="tests/reports/pdf"

# Check if pdflatex is installed
if ! command -v pdflatex &> /dev/null; then
    echo "⚠️  pdflatex not found!"
    echo ""
    echo "To compile LaTeX to PDF, install a LaTeX distribution:"
    echo "  • Ubuntu/Debian: sudo apt-get install texlive-latex-base texlive-latex-extra"
    echo "  • macOS: brew install --cask mactex"
    echo "  • Or: TeX Live (https://www.tug.org/texlive/)"
    echo ""
    echo "LaTeX source files are available in: $LATEX_DIR"
    echo ""
    exit 0
fi

# Create PDF directory
mkdir -p "$PDF_DIR"

echo "📁 LaTeX Directory: $LATEX_DIR"
echo "📁 PDF Output Directory: $PDF_DIR"
echo ""

# Get all LaTeX files
if [ "$REPORT_ID" == "latest" ]; then
    LATEX_FILES="$LATEX_DIR/latest*.tex"
else
    LATEX_FILES="$LATEX_DIR/*$REPORT_ID*.tex"
fi

FILE_COUNT=$(ls $LATEX_FILES 2>/dev/null | wc -l)

if [ "$FILE_COUNT" -eq 0 ]; then
    echo "❌ No LaTeX files found for report: $REPORT_ID"
    exit 1
fi

echo "Found $FILE_COUNT LaTeX file(s) to compile"
echo ""

COMPILED=0
FAILED=0

for file in $LATEX_FILES; do
    filename=$(basename "$file")
    echo "📄 Compiling: $filename"
    
    # Change to latex directory for compilation
    cd "$LATEX_DIR"
    
    # Compile (run twice for proper references)
    pdflatex -interaction=nonstopmode "$filename" > /dev/null 2>&1
    pdflatex -interaction=nonstopmode "$filename" > /dev/null 2>&1
    
    cd - > /dev/null
    
    # Check if PDF was created
    PDF_NAME="${filename%.tex}.pdf"
    PDF_PATH="$LATEX_DIR/$PDF_NAME"
    
    if [ -f "$PDF_PATH" ]; then
        # Move PDF to output directory
        DEST_PATH="$PDF_DIR/$PDF_NAME"
        mv "$PDF_PATH" "$DEST_PATH"
        echo "   ✅ Success: $DEST_PATH"
        ((COMPILED++))
        
        # Clean up auxiliary files
        rm -f "$LATEX_DIR/${filename%.tex}.aux"
        rm -f "$LATEX_DIR/${filename%.tex}.log"
        rm -f "$LATEX_DIR/${filename%.tex}.out"
        rm -f "$LATEX_DIR/${filename%.tex}.toc"
    else
        echo "   ❌ Failed to compile"
        ((FAILED++))
    fi
    echo ""
done

echo "====================================="
echo "Compilation Summary"
echo "====================================="
echo "✅ Compiled: $COMPILED"
echo "❌ Failed: $FAILED"
echo ""

if [ "$COMPILED" -gt 0 ]; then
    echo "📂 PDF files saved to: $PDF_DIR"
    echo ""
    
    # Open the master report if it exists (macOS)
    MASTER_PDF="$PDF_DIR/latest_master_report.pdf"
    if [ -f "$MASTER_PDF" ] && [ "$(uname)" == "Darwin" ]; then
        echo "Opening master report..."
        open "$MASTER_PDF"
    fi
fi

exit 0
