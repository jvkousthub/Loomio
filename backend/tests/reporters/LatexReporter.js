const fs = require('fs');
const path = require('path');
const { sequelize } = require('../../src/models');

/**
 * Custom Jest Reporter for generating LaTeX test reports
 * Reads database schema and generates detailed LaTeX documents for each test run
 */
class LaTeXReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
    this.testResults = [];
    this.databaseSchema = null;
    this.startTime = null;
  }

  async onRunStart() {
    this.startTime = new Date();
    console.log('\n📄 LaTeX Test Reporter Initialized');
    
    // Read database schema
    try {
      await this.loadDatabaseSchema();
    } catch (error) {
      console.error('Warning: Could not load database schema:', error.message);
    }
  }

  async loadDatabaseSchema() {
    try {
      const queryInterface = sequelize.getQueryInterface();
      const tables = await queryInterface.showAllTables();
      
      this.databaseSchema = {};
      
      for (const table of tables) {
        const columns = await queryInterface.describeTable(table);
        this.databaseSchema[table] = columns;
      }
      
      console.log(`✓ Loaded schema for ${tables.length} database tables`);
    } catch (error) {
      console.error('Error loading database schema:', error.message);
    }
  }

  onTestResult(test, testResult) {
    this.testResults.push({
      testPath: testResult.testFilePath,
      testResults: testResult.testResults,
      numPassingTests: testResult.numPassingTests,
      numFailingTests: testResult.numFailingTests,
      numPendingTests: testResult.numPendingTests,
      perfStats: testResult.perfStats,
      snapshot: testResult.snapshot
    });
  }

  async onRunComplete(contexts, results) {
    const endTime = new Date();
    const duration = endTime - this.startTime;

    console.log('\n📊 Generating LaTeX Test Reports...');

    // Create reports directory
    const reportsDir = path.join(process.cwd(), 'tests', 'reports', 'latex');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Copy Loomio logo to reports directory
    const logoSource = path.join(process.cwd(), '..', 'frontend', 'public', 'Loomio.png');
    const logoDest = path.join(reportsDir, 'Loomio.png');
    if (fs.existsSync(logoSource) && !fs.existsSync(logoDest)) {
      try {
        fs.copyFileSync(logoSource, logoDest);
        console.log('✓ Copied Loomio logo to reports directory');
      } catch (error) {
        console.warn('Warning: Could not copy logo:', error.message);
      }
    }

    // Generate timestamp for this run
    const timestamp = this.formatTimestamp(this.startTime);
    const runId = this.startTime.getTime();

    // Generate master report
    await this.generateMasterReport(results, reportsDir, timestamp, runId, duration);

    // Generate individual test suite reports
    for (let idx = 0; idx < this.testResults.length; idx++) {
      const testResult = this.testResults[idx];
      await this.generateTestSuiteReport(testResult, reportsDir, timestamp, runId, idx);
    }

    // Generate database schema report
    if (this.databaseSchema) {
      await this.generateDatabaseSchemaReport(reportsDir, timestamp, runId);
    }

    console.log(`\n✅ LaTeX Reports Generated:`);
    console.log(`   📁 Location: ${reportsDir}`);
    console.log(`   📄 Master Report: master_report_${runId}.tex`);
    console.log(`   📄 Individual Reports: ${this.testResults.length} files`);
    if (this.databaseSchema) {
      console.log(`   📄 Database Schema: db_schema_${runId}.tex`);
    }
    console.log(`\nTo compile: cd ${reportsDir} && pdflatex master_report_${runId}.tex`);
  }

  formatTimestamp(date) {
    return date.toISOString().replace(/[:.]/g, '-').slice(0, -5);
  }

  escapeLatex(text) {
    if (!text) return '';
    return String(text)
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/[&%$#_{}]/g, '\\$&')
      .replace(/~/g, '\\textasciitilde{}')
      .replace(/\^/g, '\\textasciicircum{}')
      .replace(/</g, '\\textless{}')
      .replace(/>/g, '\\textgreater{}');
  }

  async generateMasterReport(results, reportsDir, timestamp, runId, duration) {
    const latex = `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{geometry}
\\usepackage{xcolor}
\\usepackage{hyperref}
\\usepackage{listings}
\\usepackage{longtable}
\\usepackage{booktabs}
\\usepackage{graphicx}
\\usepackage{fancyhdr}
\\usepackage{amssymb}

\\geometry{margin=1in}
\\pagestyle{fancy}
\\fancyhf{}
\\lhead{\\includegraphics[height=0.5cm]{Loomio.png} Loomio Test Report}
\\rhead{${timestamp}}
\\cfoot{\\thepage}

\\definecolor{passcolor}{RGB}{46, 125, 50}
\\definecolor{failcolor}{RGB}{198, 40, 40}
\\definecolor{skipcolor}{RGB}{255, 152, 0}
\\definecolor{codebackground}{RGB}{245, 245, 245}

\\lstset{
  backgroundcolor=\\color{codebackground},
  basicstyle=\\ttfamily\\small,
  breaklines=true,
  frame=single,
  numbers=left,
  numberstyle=\\tiny,
  showstringspaces=false
}

\\hypersetup{
  colorlinks=true,
  linkcolor=blue,
  filecolor=magenta,
  urlcolor=cyan,
  pdftitle={Loomio Test Report - ${timestamp}},
  pdfauthor={Loomio Test Suite}
}

\\title{
  \\includegraphics[width=3cm]{Loomio.png}\\\\
  \\vspace{0.5cm}
  \\textbf{Loomio Platform Test Report}
}
\\author{
  \\textbf{Tested by:} J V Kousthub\\\\
  \\vspace{0.2cm}
  \\textbf{Date:} ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\\\\
  \\textbf{Time:} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
}
\\date{}

\\begin{document}

\\maketitle

\\vspace{1cm}
\\begin{center}
\\large
\\textbf{Database:} PostgreSQL on Render\\\\
\\textbf{Backend:} https://loomio.onrender.com
\\end{center}

\\newpage
\\tableofcontents
\\newpage

\\section{Executive Summary}

\\subsection{Test Run Overview}
\\begin{itemize}
  \\item \\textbf{Run ID:} ${runId}
  \\item \\textbf{Start Time:} ${this.startTime.toISOString()}
  \\item \\textbf{Duration:} ${(duration / 1000).toFixed(2)} seconds
  \\item \\textbf{Environment:} ${process.env.NODE_ENV || 'test'}
  \\item \\textbf{Node Version:} ${process.version}
\\end{itemize}

\\subsection{Results Summary}
\\begin{center}
\\begin{tabular}{lc}
\\toprule
\\textbf{Metric} & \\textbf{Count} \\\\
\\midrule
Total Test Suites & ${results.numTotalTestSuites} \\\\
Passed Test Suites & \\textcolor{passcolor}{${results.numPassedTestSuites}} \\\\
Failed Test Suites & \\textcolor{failcolor}{${results.numFailedTestSuites}} \\\\
\\midrule
Total Tests & ${results.numTotalTests} \\\\
Passed Tests & \\textcolor{passcolor}{${results.numPassedTests}} \\\\
Failed Tests & \\textcolor{failcolor}{${results.numFailedTests}} \\\\
Skipped Tests & \\textcolor{skipcolor}{${results.numPendingTests}} \\\\
\\midrule
Success Rate & ${((results.numPassedTests / results.numTotalTests) * 100).toFixed(2)}\\% \\\\
\\bottomrule
\\end{tabular}
\\end{center}

${results.numFailedTests > 0 ? `
\\subsection{Overall Status}
\\textcolor{failcolor}{\\textbf{FAILED}} - ${results.numFailedTests} test(s) failed.
` : `
\\subsection{Overall Status}
\\textcolor{passcolor}{\\textbf{PASSED}} - All tests passed successfully!
`}

\\newpage
\\section{Test Suites}

${this.generateTestSuitesSection()}

\\newpage
\\section{Database Schema}

The database schema used for testing is documented in a separate file: \\texttt{db\\_schema\\_${runId}.tex}

See Section \\ref{sec:db-tables} for table details.

\\section{Failed Tests}
${this.generateFailedTestsSection()}

\\section{Performance Metrics}
${this.generatePerformanceSection()}

\\section{Recommendations}

\\subsection{Action Items}
\\begin{itemize}
${results.numFailedTests > 0 ? `
  \\item \\textbf{Fix Failed Tests:} ${results.numFailedTests} test(s) require attention
` : ''}
${results.numPendingTests > 0 ? `
  \\item \\textbf{Complete Pending Tests:} ${results.numPendingTests} test(s) are skipped
` : ''}
  \\item Review test coverage and add missing test cases
  \\item Ensure all database models are properly tested
  \\item Update integration tests for new API endpoints
\\end{itemize}

\\section{Appendix}

\\subsection{Environment Variables}
\\begin{itemize}
  \\item NODE\\_ENV: ${this.escapeLatex(process.env.NODE_ENV || 'not set')}
  \\item DB\\_NAME: ${this.escapeLatex(process.env.DB_NAME || 'not set')}
  \\item JWT\\_SECRET: ${process.env.JWT_SECRET ? '[CONFIGURED]' : '[NOT SET]'}
\\end{itemize}

\\subsection{Related Documents}
\\begin{itemize}
  \\item Database Schema Report: \\texttt{db\\_schema\\_${runId}.tex}
${this.testResults.map((result) => {
  const descriptiveName = this.getDescriptiveReportName(result.testPath);
  return `  \\item ${this.escapeLatex(descriptiveName)}: \\texttt{${descriptiveName}\\_${runId}.tex}`;
}).join('\n')}
\\end{itemize}

\\end{document}
`;

    const filePath = path.join(reportsDir, `master_report_${runId}.tex`);
    fs.writeFileSync(filePath, latex);
    
    // Also create a 'latest' symlink
    const latestPath = path.join(reportsDir, 'latest_master_report.tex');
    fs.writeFileSync(latestPath, latex);
  }

  generateTestSuitesSection() {
    return this.testResults.map((result, idx) => {
      const suiteName = path.basename(result.testPath);
      const passed = result.numPassingTests;
      const failed = result.numFailingTests;
      const pending = result.numPendingTests;
      const total = passed + failed + pending;
      const descriptiveName = this.getDescriptiveReportName(result.testPath);

      return `\\subsection{${this.escapeLatex(suiteName)}}
\\begin{itemize}
  \\item \\textbf{File:} \\texttt{${this.escapeLatex(result.testPath)}}
  \\item \\textbf{Total Tests:} ${total}
  \\item \\textbf{Passed:} \\textcolor{passcolor}{${passed}}
  \\item \\textbf{Failed:} \\textcolor{failcolor}{${failed}}
  \\item \\textbf{Skipped:} \\textcolor{skipcolor}{${pending}}
  \\item \\textbf{Success Rate:} ${total > 0 ? ((passed / total) * 100).toFixed(2) : 0}\\%
\\end{itemize}

Detailed results available in: \\texttt{${descriptiveName}\\_${this.startTime.getTime()}.tex}
`;
    }).join('\n');
  }

  generateFailedTestsSection() {
    const failedTests = [];
    
    this.testResults.forEach((suite) => {
      suite.testResults.forEach((test) => {
        if (test.status === 'failed') {
          failedTests.push({
            suite: path.basename(suite.testPath),
            test: test.fullName,
            error: test.failureMessages.join('\n')
          });
        }
      });
    });

    if (failedTests.length === 0) {
      return '\\textcolor{passcolor}{No failed tests! All tests passed successfully.}';
    }

    return failedTests.map((test, idx) => `
\\subsection{Failed Test ${idx + 1}: ${this.escapeLatex(test.test)}}
\\textbf{Suite:} ${this.escapeLatex(test.suite)}

\\textbf{Error Message:}
\\begin{lstlisting}
${this.escapeLatex(test.error).substring(0, 1000)}
\\end{lstlisting}
`).join('\n');
  }

  generatePerformanceSection() {
    const avgDuration = this.testResults.reduce((sum, r) => 
      sum + (r.perfStats?.runtime || 0), 0) / this.testResults.length || 0;

    return `
\\begin{center}
\\begin{tabular}{lc}
\\toprule
\\textbf{Metric} & \\textbf{Value} \\\\
\\midrule
Average Suite Duration & ${avgDuration.toFixed(2)} ms \\\\
Total Test Suites & ${this.testResults.length} \\\\
Slowest Suite & ${Math.max(...this.testResults.map(r => r.perfStats?.runtime || 0)).toFixed(2)} ms \\\\
Fastest Suite & ${Math.min(...this.testResults.map(r => r.perfStats?.runtime || 0)).toFixed(2)} ms \\\\
\\bottomrule
\\end{tabular}
\\end{center}
`;
  }

  getDescriptiveReportName(testPath) {
    const filename = path.basename(testPath, '.test.js').replace('.fixed', '');
    const directory = path.basename(path.dirname(testPath));
    
    // Create descriptive name: directory-filename
    return `${directory}-${filename}-tests`;
  }

  async generateTestSuiteReport(testResult, reportsDir, timestamp, runId, idx) {
    const suiteName = path.basename(testResult.testPath);
    const descriptiveName = this.getDescriptiveReportName(testResult.testPath);

    const latex = `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{geometry}
\\usepackage{xcolor}
\\usepackage{hyperref}
\\usepackage{listings}
\\usepackage{longtable}
\\usepackage{booktabs}
\\usepackage{graphicx}
\\usepackage{fancyhdr}
\\usepackage{amssymb}

\\geometry{margin=1in}
\\pagestyle{fancy}
\\fancyhf{}
\\lhead{\\includegraphics[height=0.4cm]{Loomio.png} ${this.escapeLatex(descriptiveName)}}
\\rhead{${timestamp}}
\\cfoot{\\thepage}

\\definecolor{passcolor}{RGB}{46, 125, 50}
\\definecolor{failcolor}{RGB}{198, 40, 40}
\\definecolor{skipcolor}{RGB}{255, 152, 0}
\\definecolor{codebackground}{RGB}{245, 245, 245}

\\lstset{
  backgroundcolor=\\color{codebackground},
  basicstyle=\\ttfamily\\small,
  breaklines=true,
  frame=single,
  numbers=left,
  numberstyle=\\tiny,
  showstringspaces=false
}

\\title{
  \\includegraphics[width=2.5cm]{Loomio.png}\\\\
  \\vspace{0.3cm}
  \\textbf{Test Suite Report}\\\\
  ${this.escapeLatex(suiteName)}
}
\\author{
  \\textbf{Tested by:} J V Kousthub\\\\
  \\vspace{0.2cm}
  \\textbf{Date:} ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\\\\
  \\textbf{Time:} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
}
\\date{}

\\begin{document}

\\maketitle

\\vspace{0.5cm}
\\begin{center}
\\textbf{Database:} PostgreSQL on Render\\\\
\\textbf{Backend:} https://loomio.onrender.com
\\end{center}

\\newpage

\\section{Suite Information}
\\begin{itemize}
  \\item \\textbf{File:} \\texttt{${this.escapeLatex(testResult.testPath)}}
  \\item \\textbf{Run ID:} ${runId}
  \\item \\textbf{Execution Time:} ${testResult.perfStats?.runtime || 0} ms
\\end{itemize}

\\section{Test Results Summary}
\\begin{center}
\\begin{tabular}{lc}
\\toprule
\\textbf{Status} & \\textbf{Count} \\\\
\\midrule
\\textcolor{passcolor}{Passed} & ${testResult.numPassingTests} \\\\
\\textcolor{failcolor}{Failed} & ${testResult.numFailingTests} \\\\
\\textcolor{skipcolor}{Skipped} & ${testResult.numPendingTests} \\\\
\\midrule
Total & ${testResult.numPassingTests + testResult.numFailingTests + testResult.numPendingTests} \\\\
\\bottomrule
\\end{tabular}
\\end{center}

\\section{Individual Test Cases}

${this.generateIndividualTestCases(testResult)}

\\section{Database Interactions}

This test suite interacts with the following database tables:
${this.generateDatabaseInteractions(testResult.testPath)}

\\end{document}
`;

    const filePath = path.join(reportsDir, `${descriptiveName}_${runId}.tex`);
    const latestPath = path.join(reportsDir, `latest_${descriptiveName}.tex`);
    
    fs.writeFileSync(filePath, latex);
    
    // Create symlink or copy to "latest" version
    try {
      if (fs.existsSync(latestPath)) {
        fs.unlinkSync(latestPath);
      }
      fs.copyFileSync(filePath, latestPath);
    } catch (error) {
      console.warn(`Warning: Could not create latest link for ${descriptiveName}:`, error.message);
    }
  }

  generateIndividualTestCases(testResult) {
    return testResult.testResults.map((test, idx) => {
      const status = test.status === 'passed' ? 'passcolor' : 
                    test.status === 'failed' ? 'failcolor' : 'skipcolor';
      const statusText = test.status.toUpperCase();
      
      let content = `\\subsection{Test ${idx + 1}: ${this.escapeLatex(test.fullName || test.title)}}
\\textbf{Status:} \\textcolor{${status}}{${statusText}}\\\\
\\textbf{Duration:} ${test.duration || 0} ms

`;

      if (test.status === 'failed' && test.failureMessages.length > 0) {
        content += `\\textbf{Error Messages:}
\\begin{lstlisting}
${this.escapeLatex(test.failureMessages.join('\n')).substring(0, 800)}
\\end{lstlisting}

`;
      }

      if (test.status === 'passed') {
        content += `\\textcolor{passcolor}{\\checkmark~Test passed successfully}

`;
      }

      return content;
    }).join('\n');
  }

  generateDatabaseInteractions(testPath) {
    const fileContent = fs.readFileSync(testPath, 'utf-8');
    const models = [];
    
    // Extract model names from require statements
    const modelMatches = fileContent.match(/require\(['"](\.\.\/)*src\/models['"]\)/g);
    const specificModels = fileContent.match(/\b(User|Task|Community|Event|Notification|Attendance|LeaveRequest|Contribution|TaskTag|Subtask)\b/g);
    
    if (specificModels) {
      const uniqueModels = [...new Set(specificModels)];
      return `\\begin{itemize}
${uniqueModels.map(model => `  \\item \\texttt{${model}}`).join('\n')}
\\end{itemize}`;
    }
    
    return '\\textit{No explicit database model interactions detected in this test file.}';
  }

  async generateDatabaseSchemaReport(reportsDir, timestamp, runId) {
    if (!this.databaseSchema) {
      return;
    }

    const tables = Object.keys(this.databaseSchema).sort();

    const latex = `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{geometry}
\\usepackage{xcolor}
\\usepackage{hyperref}
\\usepackage{longtable}
\\usepackage{booktabs}
\\usepackage{array}
\\usepackage{graphicx}
\\usepackage{fancyhdr}

\\geometry{margin=0.75in}
\\pagestyle{fancy}
\\fancyhf{}
\\lhead{\\includegraphics[height=0.4cm]{Loomio.png} Database Schema}
\\rhead{${timestamp}}
\\cfoot{\\thepage}

\\title{
  \\includegraphics[width=2.5cm]{Loomio.png}\\\\
  \\vspace{0.3cm}
  \\textbf{Database Schema Report}\\\\
  Loomio Platform
}
\\author{Generated from Test Suite}
\\date{${timestamp}}

\\begin{document}

\\maketitle
\\tableofcontents
\\newpage

\\section{Overview}
\\label{sec:db-tables}

This document describes the database schema used by the Loomio platform during testing.

\\subsection{Schema Summary}
\\begin{itemize}
  \\item \\textbf{Total Tables:} ${tables.length}
  \\item \\textbf{Database:} ${process.env.DB_NAME || 'Not specified'}
  \\item \\textbf{Environment:} ${process.env.NODE_ENV || 'test'}
  \\item \\textbf{Generated:} ${timestamp}
\\end{itemize}

\\section{Table Definitions}

${tables.map(tableName => this.generateTableDefinition(tableName)).join('\n\\newpage\n')}

\\section{Relationships}

\\subsection{Key Relationships}
\\begin{itemize}
  \\item Users belong to Communities (many-to-many via UserCommunity)
  \\item Tasks are assigned to Users (many-to-many via TaskAssignment)
  \\item Tasks belong to Communities
  \\item Events belong to Communities
  \\item Notifications belong to Users and Communities
  \\item TaskTags belong to Communities and link to Tasks
  \\item Subtasks belong to Tasks
\\end{itemize}

\\end{document}
`;

    const filePath = path.join(reportsDir, `db_schema_${runId}.tex`);
    fs.writeFileSync(filePath, latex);
    
    // Also create a 'latest' version
    const latestPath = path.join(reportsDir, 'latest_db_schema.tex');
    fs.writeFileSync(latestPath, latex);
  }

  generateTableDefinition(tableName) {
    const columns = this.databaseSchema[tableName];
    const columnNames = Object.keys(columns);

    return `\\subsection{Table: ${this.escapeLatex(tableName)}}

\\begin{longtable}{|p{3cm}|p{2.5cm}|p{1.5cm}|p{1.5cm}|p{4cm}|}
\\hline
\\textbf{Column} & \\textbf{Type} & \\textbf{Null} & \\textbf{Key} & \\textbf{Default} \\\\
\\hline
\\endfirsthead
\\hline
\\textbf{Column} & \\textbf{Type} & \\textbf{Null} & \\textbf{Key} & \\textbf{Default} \\\\
\\hline
\\endhead
${columnNames.map(colName => {
  const col = columns[colName];
  return `${this.escapeLatex(colName)} & ${this.escapeLatex(col.type)} & ${col.allowNull ? 'YES' : 'NO'} & ${col.primaryKey ? 'PRI' : ''} & ${this.escapeLatex(col.defaultValue || '')} \\\\
\\hline`;
}).join('\n')}
\\end{longtable}

\\textbf{Column Count:} ${columnNames.length}
`;
  }
}

module.exports = LaTeXReporter;
