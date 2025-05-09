// Script para exportar o contrato OpenAPI gerado pelo swaggerSpec
// Salva o JSON em swagger.json na raiz do projeto

const fs = require('fs');
const path = require('path');

// Tente importar do src/swagger.ts, se não, tente src/swaggerConfig.ts
let swaggerSpec;
try {
  swaggerSpec = require('../src/swagger').swaggerSpec || require('../src/swagger');
} catch (e) {
  try {
    swaggerSpec = require('../src/swaggerConfig').default || require('../src/swaggerConfig');
  } catch (err) {
    console.error('Não foi possível importar swaggerSpec de src/swagger.ts nem src/swaggerConfig.ts');
    process.exit(1);
  }
}

const outputPath = path.resolve(__dirname, '../swagger.json');
fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2), 'utf-8');
console.log('Swagger JSON exportado para', outputPath);
