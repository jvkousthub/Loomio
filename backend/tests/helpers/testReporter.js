/**
 * Test Reporter
 * Generates detailed test documentation after each run
 */

const fs = require('fs');
const path = require('path');

class TestReporter {
  constructor() {
    this.testResults = {
      timestamp: new Date().toISOString(),
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0
      },
      suites: [],
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        database: process.env.DB_NAME || 'loomio_test'
      }
    };
  }

  addSuite(suiteName) {
    const suite = {
      name: suiteName,
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      startTime: new Date()
    };
    this.testResults.suites.push(suite);
    return suite;
  }

  addTest(suite, testName, status, error = null, duration = 0) {
    const test = {
      name: testName,
      status,
      duration,
      error: error ? {
        message: error.message,
        stack: error.stack
      } : null,
      timestamp: new Date().toISOString()
    };
    
    suite.tests.push(test);
    suite[status]++;
    this.testResults.summary[status]++;
    this.testResults.summary.total++;
  }

  generateMarkdownReport() {
    const lines = [];
    
    lines.push('# Test Execution Report');
    lines.push('');
    lines.push(`**Generated:** ${new Date(this.testResults.timestamp).toLocaleString()}`);
    lines.push('');
    
    // Summary section
    lines.push('## Summary');
    lines.push('');
    lines.push('| Metric | Value |');
    lines.push('|--------|-------|');
    lines.push(`| Total Tests | ${this.testResults.summary.total} |`);
    lines.push(`| ✅ Passed | ${this.testResults.summary.passed} |`);
    lines.push(`| ❌ Failed | ${this.testResults.summary.failed} |`);
    lines.push(`| ⏭️ Skipped | ${this.testResults.summary.skipped} |`);
    lines.push(`| Duration | ${this.testResults.summary.duration}ms |`);
    
    const passRate = this.testResults.summary.total > 0 
      ? ((this.testResults.summary.passed / this.testResults.summary.total) * 100).toFixed(2)
      : 0;
    lines.push(`| Success Rate | ${passRate}% |`);
    lines.push('');

    // Environment section
    lines.push('## Environment');
    lines.push('');
    lines.push('| Key | Value |');
    lines.push('|-----|-------|');
    lines.push(`| Node Version | ${this.testResults.environment.nodeVersion} |`);
    lines.push(`| Platform | ${this.testResults.environment.platform} |`);
    lines.push(`| Database | ${this.testResults.environment.database} |`);
    lines.push('');

    // Test suites section
    lines.push('## Test Suites');
    lines.push('');
    
    this.testResults.suites.forEach(suite => {
      const suiteTotal = suite.tests.length;
      const suitePassRate = suiteTotal > 0 
        ? ((suite.passed / suiteTotal) * 100).toFixed(2)
        : 0;
      
      lines.push(`### ${suite.name}`);
      lines.push('');
      lines.push(`**Success Rate:** ${suitePassRate}% (${suite.passed}/${suiteTotal} passed)`);
      lines.push('');
      lines.push('| Test | Status | Duration |');
      lines.push('|------|--------|----------|');
      
      suite.tests.forEach(test => {
        const statusIcon = test.status === 'passed' ? '✅' : 
                          test.status === 'failed' ? '❌' : '⏭️';
        lines.push(`| ${test.name} | ${statusIcon} ${test.status} | ${test.duration}ms |`);
      });
      lines.push('');
      
      // Show failures
      const failures = suite.tests.filter(t => t.status === 'failed');
      if (failures.length > 0) {
        lines.push('#### Failures');
        lines.push('');
        failures.forEach(test => {
          lines.push(`**${test.name}**`);
          lines.push('```');
          lines.push(test.error.message);
          lines.push('```');
          lines.push('');
        });
      }
    });

    return lines.join('\n');
  }

  generateHTMLReport() {
    const passRate = this.testResults.summary.total > 0 
      ? ((this.testResults.summary.passed / this.testResults.summary.total) * 100).toFixed(2)
      : 0;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Report - ${new Date(this.testResults.timestamp).toLocaleDateString()}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { opacity: 0.9; font-size: 1.1em; }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 40px;
            background: #f8f9fa;
        }
        .stat-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            text-align: center;
            transition: transform 0.3s;
        }
        .stat-card:hover { transform: translateY(-5px); }
        .stat-card .value {
            font-size: 2.5em;
            font-weight: bold;
            margin: 10px 0;
        }
        .stat-card .label {
            color: #666;
            text-transform: uppercase;
            font-size: 0.85em;
            letter-spacing: 1px;
        }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .content { padding: 40px; }
        .suite {
            margin-bottom: 40px;
            border: 1px solid #e9ecef;
            border-radius: 12px;
            overflow: hidden;
        }
        .suite-header {
            background: #f8f9fa;
            padding: 20px;
            border-bottom: 2px solid #dee2e6;
        }
        .suite-header h3 {
            font-size: 1.5em;
            color: #333;
            margin-bottom: 10px;
        }
        .suite-stats {
            display: flex;
            gap: 20px;
            font-size: 0.9em;
        }
        .test-list {
            list-style: none;
        }
        .test-item {
            padding: 15px 20px;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .test-item:last-child { border-bottom: none; }
        .test-item:hover { background: #f8f9fa; }
        .test-name { flex: 1; }
        .test-status {
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
            margin-right: 15px;
        }
        .test-status.passed { background: #d4edda; color: #155724; }
        .test-status.failed { background: #f8d7da; color: #721c24; }
        .test-status.skipped { background: #fff3cd; color: #856404; }
        .test-duration { color: #6c757d; font-size: 0.9em; }
        .error-details {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 8px;
            padding: 15px;
            margin: 10px 20px;
            color: #721c24;
        }
        .error-details pre {
            margin-top: 10px;
            padding: 10px;
            background: white;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 0.85em;
        }
        .progress-bar {
            height: 30px;
            background: #e9ecef;
            border-radius: 15px;
            overflow: hidden;
            margin: 20px 0;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #28a745, #20c997);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            transition: width 1s ease;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #6c757d;
            border-top: 1px solid #e9ecef;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Test Execution Report</h1>
            <p>${new Date(this.testResults.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="stat-card">
                <div class="label">Total Tests</div>
                <div class="value">${this.testResults.summary.total}</div>
            </div>
            <div class="stat-card">
                <div class="label">Passed</div>
                <div class="value passed">✅ ${this.testResults.summary.passed}</div>
            </div>
            <div class="stat-card">
                <div class="label">Failed</div>
                <div class="value failed">❌ ${this.testResults.summary.failed}</div>
            </div>
            <div class="stat-card">
                <div class="label">Success Rate</div>
                <div class="value" style="color: ${passRate >= 80 ? '#28a745' : passRate >= 60 ? '#ffc107' : '#dc3545'}">${passRate}%</div>
            </div>
        </div>

        <div class="content">
            <h2 style="margin-bottom: 20px;">Test Suites</h2>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${passRate}%">${passRate}%</div>
            </div>
            
            ${this.testResults.suites.map(suite => {
                const suiteTotal = suite.tests.length;
                const suitePassRate = suiteTotal > 0 
                    ? ((suite.passed / suiteTotal) * 100).toFixed(2)
                    : 0;
                
                return `
                <div class="suite">
                    <div class="suite-header">
                        <h3>${suite.name}</h3>
                        <div class="suite-stats">
                            <span class="passed">✅ ${suite.passed} passed</span>
                            <span class="failed">❌ ${suite.failed} failed</span>
                            <span>📊 ${suitePassRate}% success rate</span>
                        </div>
                    </div>
                    <ul class="test-list">
                        ${suite.tests.map(test => `
                            <li class="test-item">
                                <span class="test-name">${test.name}</span>
                                <span class="test-status ${test.status}">${test.status.toUpperCase()}</span>
                                <span class="test-duration">${test.duration}ms</span>
                            </li>
                            ${test.error ? `
                                <div class="error-details">
                                    <strong>Error:</strong> ${test.error.message}
                                    <pre>${test.error.stack || ''}</pre>
                                </div>
                            ` : ''}
                        `).join('')}
                    </ul>
                </div>
                `;
            }).join('')}
        </div>

        <div class="footer">
            <p>Generated by Loomio Test Suite | Node ${this.testResults.environment.nodeVersion} | ${this.testResults.environment.platform}</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  saveReport(format = 'both') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportsDir = path.join(__dirname, '../reports');
    
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    if (format === 'markdown' || format === 'both') {
      const mdPath = path.join(reportsDir, `test-report-${timestamp}.md`);
      fs.writeFileSync(mdPath, this.generateMarkdownReport());
      console.log(`\n📄 Markdown report saved: ${mdPath}`);
    }

    if (format === 'html' || format === 'both') {
      const htmlPath = path.join(reportsDir, `test-report-${timestamp}.html`);
      fs.writeFileSync(htmlPath, this.generateHTMLReport());
      console.log(`🌐 HTML report saved: ${htmlPath}`);
      
      // Also save as latest.html for easy access
      const latestPath = path.join(reportsDir, 'latest.html');
      fs.writeFileSync(latestPath, this.generateHTMLReport());
      console.log(`🌐 Latest report: ${latestPath}`);
    }

    // Save JSON for programmatic access
    const jsonPath = path.join(reportsDir, `test-report-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(this.testResults, null, 2));
    console.log(`📊 JSON report saved: ${jsonPath}\n`);

    return {
      markdown: format !== 'html' ? path.join(reportsDir, `test-report-${timestamp}.md`) : null,
      html: format !== 'markdown' ? path.join(reportsDir, `test-report-${timestamp}.html`) : null,
      json: jsonPath,
      latest: format !== 'markdown' ? path.join(reportsDir, 'latest.html') : null
    };
  }
}

module.exports = TestReporter;
