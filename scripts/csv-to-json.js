const fs = require('fs');
const path = require('path');

// Function to convert CSV to JSON
function csvToJson(csvFilePath, jsonFilePath) {
    try {
        // Read CSV file
        const csvData = fs.readFileSync(csvFilePath, 'utf8');
        const lines = csvData.trim().split('\n');
        
        // Get headers from first line
        const headers = lines[0].split(',');
        
        // Convert each line to JSON object
        const jsonData = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const obj = {};
            
            headers.forEach((header, index) => {
                let value = values[index];
                
                // Clean up the value
                if (value) {
                    value = value.trim();
                    
                    // Convert numeric values
                    if (header === 'id' || header === 'year' || header === 'price' || 
                        header === 'ram_gb' || header === 'storage_gb' || 
                        header === 'display_size_inch' || header === 'refresh_rate' || 
                        header === 'battery_wh' || header === 'weight_kg') {
                        value = parseFloat(value);
                    }
                }
                
                obj[header] = value;
            });
            
            jsonData.push(obj);
        }
        
        // Write JSON file
        fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2));
        console.log(`✅ Successfully converted ${csvFilePath} to ${jsonFilePath}`);
        console.log(`📊 Total laptops: ${jsonData.length}`);
        
        // Show sample data
        console.log('\n📋 Sample laptop data:');
        console.log(JSON.stringify(jsonData[0], null, 2));
        
        return jsonData;
    } catch (error) {
        console.error('❌ Error converting CSV to JSON:', error);
        return null;
    }
}

// Convert the laptop dataset
const csvPath = path.join(__dirname, '../data/laptop_dataset_1200_rows.csv');
const jsonPath = path.join(__dirname, '../data/laptops-full.json');

csvToJson(csvPath, jsonPath);

// Also create a sample file with first 50 laptops for testing
const sampleJsonPath = path.join(__dirname, '../data/laptops-sample.json');
const fullData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const sampleData = fullData.slice(0, 50);
fs.writeFileSync(sampleJsonPath, JSON.stringify(sampleData, null, 2));
console.log(`\n📝 Created sample file with ${sampleData.length} laptops: ${sampleJsonPath}`);