import * as XLSX from 'xlsx';
import * as path from 'path';

const filePath = path.join(__dirname, '../Recursos/PRUEBA-HORARIO SEPT 2025 - ENERO 2026.xlsx');
const workbook = XLSX.readFile(filePath);

const sheetName = 'HORARIOS';
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as string[][];

console.log(`\n--- Scanning for Days in ${sheetName} ---`);

const days = ['LUNES', 'MARTES', 'MIÉRCOLES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'SABADO'];

data.forEach((row, index) => {
    const firstCell = String(row[0]).toUpperCase();
    // Check if the cell contains any of the day names
    const foundDay = days.find(day => firstCell.includes(day));

    if (foundDay) {
        console.log(`Found ${foundDay} at Row ${index}`);
    }
});
