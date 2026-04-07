/**
 * javaCalculator.js
 * 
 * Node.js bridge to call the Java EnergyCalculator utility.
 * This integrates Java into the Voltify MERN stack backend.
 * 
 * The Java class is compiled at: /java-utility/EnergyCalculator.class
 * It outputs key=value pairs which we parse here.
 */

const { exec } = require("child_process");
const path = require("path");

// Path to the compiled Java class directory
const JAVA_DIR = path.join(__dirname, "..", "..", "java-utility");

/**
 * Run the Java EnergyCalculator utility
 * @param {number} wattage     - Appliance wattage in Watts
 * @param {number} hoursPerDay - Daily usage in hours
 * @returns {Promise<object>}  - { monthlyUnits, monthlyBill, annualBill }
 */
function runJavaCalculator(wattage, hoursPerDay) {
  return new Promise((resolve, reject) => {
    const command = `java -cp "${JAVA_DIR}" EnergyCalculator ${wattage} ${hoursPerDay} 0`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(`Java execution failed: ${stderr || error.message}`));
      }

      // Parse key=value output from Java
      const result = {};
      stdout.trim().split("\n").forEach((line) => {
        const [key, value] = line.split("=");
        if (key && value) {
          result[key.trim()] = value.replace("INR", "").trim();
        }
      });

      resolve({
        monthlyUnits: parseFloat(result["MONTHLY_UNITS"]),
        monthlyBill:  parseFloat(result["MONTHLY_BILL"]),
        annualBill:   parseFloat(result["ANNUAL_BILL"]),
      });
    });
  });
}

module.exports = { runJavaCalculator };
