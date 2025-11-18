#!/bin/bash

# Newman Test Runner Script
# Runs Postman collection with Newman

echo "========================================="
echo "Running Loomio API Tests with Newman"
echo "========================================="

# Check if Newman is installed
if ! command -v newman &> /dev/null
then
    echo "Newman is not installed. Installing now..."
    npm install -g newman newman-reporter-htmlextra
fi

# Create results directory
mkdir -p tests/api/results

# Run tests
newman run tests/api/postman-collection.json \
  -e tests/api/postman-environment.json \
  --reporters cli,json,htmlextra \
  --reporter-json-export tests/api/results/newman-report.json \
  --reporter-htmlextra-export tests/api/results/newman-report.html \
  --reporter-htmlextra-darkTheme \
  --timeout-request 10000 \
  --bail

# Check exit code
if [ $? -eq 0 ]; then
    echo "========================================="
    echo "All tests passed! ✓"
    echo "HTML Report: tests/api/results/newman-report.html"
    echo "========================================="
    exit 0
else
    echo "========================================="
    echo "Some tests failed! ✗"
    echo "Check report: tests/api/results/newman-report.html"
    echo "========================================="
    exit 1
fi
