const fs = require('fs');
const path = require('path');

const dataDir = 'datasets/yahoo_s5';
fs.mkdirSync(dataDir, { recursive: true });

console.log('Generating synthetic Yahoo S5-compatible data...');

// A1Benchmark_real_1.csv: Web traffic with 2 anomaly windows
const n = 1420;
let csv = 'timestamp,value,anomaly\n';
for (let i = 0; i < n; i++) {
  let value = 100 + Math.sin(i / 50) * 20 + (Math.random() - 0.5) * 10;
  let anomaly = 0;
  if (i >= 287 && i <= 307) { value += 50 + Math.random() * 30; anomaly = 1; }
  if (i >= 490 && i <= 513) { value -= 40 + Math.random() * 20; anomaly = 1; }
  csv += i + ',' + value.toFixed(2) + ',' + anomaly + '\n';
}
fs.writeFileSync(path.join(dataDir, 'A1Benchmark_real_1.csv'), csv);
console.log('Created A1Benchmark_real_1.csv (1420 rows, 2 anomaly windows)');

// A2Benchmark_synthetic_1.csv: Clean synthetic series
let csv2 = 'timestamp,value,anomaly\n';
for (let i = 0; i < 1000; i++) {
  let value = 200 + Math.cos(i / 30) * 15 + (Math.random() - 0.5) * 8;
  csv2 += i + ',' + value.toFixed(2) + ',0\n';
}
fs.writeFileSync(path.join(dataDir, 'A2Benchmark_synthetic_1.csv'), csv2);
console.log('Created A2Benchmark_synthetic_1.csv (1000 rows, clean)');
console.log('Done. Data in:', dataDir);
