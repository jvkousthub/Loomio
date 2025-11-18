/**
 * Custom Jest Reporter
 * Automatically generates test documentation after each test run
 */

const TestReporter = require('./testReporter');

class CustomJestReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
    this.reporter = new TestReporter();
  }

  onRunStart() {
    console.log('\n🧪 Starting test execution...\n');
  }

  onTestResult(test, testResult, aggregatedResult) {
    const suiteName = testResult.testFilePath.split(/[\\/]/).pop().replace('.test.js', '');
    const suite = this.reporter.addSuite(suiteName);
    
    testResult.testResults.forEach(result => {
      const status = result.status === 'passed' ? 'passed' : 
                    result.status === 'failed' ? 'failed' : 'skipped';
      
      const error = result.failureMessages && result.failureMessages.length > 0
        ? new Error(result.failureMessages.join('\n'))
        : null;
      
      this.reporter.addTest(
        suite,
        result.title,
        status,
        error,
        result.duration || 0
      );
    });
  }

  onRunComplete(contexts, results) {
    this.reporter.testResults.summary.duration = results.testResults.reduce(
      (total, result) => total + (result.perfStats.end - result.perfStats.start),
      0
    );

    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Execution Summary');
    console.log('='.repeat(60));
    console.log(`Total: ${this.reporter.testResults.summary.total}`);
    console.log(`✅ Passed: ${this.reporter.testResults.summary.passed}`);
    console.log(`❌ Failed: ${this.reporter.testResults.summary.failed}`);
    console.log(`⏭️  Skipped: ${this.reporter.testResults.summary.skipped}`);
    
    const passRate = this.reporter.testResults.summary.total > 0
      ? ((this.reporter.testResults.summary.passed / this.reporter.testResults.summary.total) * 100).toFixed(2)
      : 0;
    console.log(`📈 Success Rate: ${passRate}%`);
    console.log('='.repeat(60) + '\n');

    // Save reports
    this.reporter.saveReport('both');
    
    console.log('✨ Test documentation generated successfully!\n');
  }
}

module.exports = CustomJestReporter;
