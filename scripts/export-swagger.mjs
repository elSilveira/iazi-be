// Script para exportar o contrato OpenAPI gerado pelo swaggerSpec (ESM)
import fs from 'fs';
import path from 'path';
import swaggerSpec from '../src/swaggerConfig.js';

const outputPath = path.resolve('./swagger.json');
fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2), 'utf-8');
console.log('Swagger JSON exportado para', outputPath);
