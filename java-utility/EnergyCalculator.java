import java.util.Scanner;

/**
 * Voltify - Energy Calculator Utility (Java)
 * 
 * This utility calculates:
 *   1. Monthly Electricity Bill based on appliances
 *   2. Annual Savings by switching to energy-efficient appliances
 *   3. Payback Period for buying a new energy-efficient appliance
 * 
 * It supports both interactive (menu-driven) and command-line argument modes,
 * so it can be integrated with the Node.js backend via child_process.
 * 
 * Usage (command-line):
 *   java EnergyCalculator <wattage> <hours_per_day> <rate_per_kwh>
 * 
 * Usage (interactive):
 *   java EnergyCalculator
 */
public class EnergyCalculator {

    // ── MSEDCL (Mahavitaran) LT-I Residential Tariff ─────────────────────────
    // Source: MERC MYT Order Case No. 226 of 2022 | FY 2024-25
    // Energy Charges (₹/kWh)
    static final double[] SLAB_LIMITS  = {100, 300, 500, Double.MAX_VALUE};
    static final double[] SLAB_RATES   = {4.71, 10.29, 14.55, 16.64}; // ₹/unit

    // Wheeling charge: ₹1.17/unit (applicable on all units consumed)
    static final double WHEELING_CHARGE = 1.17;

    // -----------------------------------------------------------------------
    // Core calculation methods
    // -----------------------------------------------------------------------

    /**
     * Calculate monthly electricity consumption in kWh (units)
     * @param wattage     - Power consumption of appliance in Watts
     * @param hoursPerDay - Daily usage in hours
     * @return units consumed per month
     */
    public static double monthlyUnits(double wattage, double hoursPerDay) {
        return (wattage * hoursPerDay * 30) / 1000.0;
    }

    /**
     * Calculate electricity bill using MSEDCL (Mahavitaran) LT-I slab rates
     * Includes: Energy Charges (slab-wise) + Wheeling Charge (₹1.17/unit)
     * Excludes: Fixed charges, Electricity Duty, Tax on Sale of Electricity
     * @param units - Monthly units consumed (kWh)
     * @return bill amount in ₹
     */
    public static double calculateBill(double units) {
        double energyCharge = 0;
        double remaining = units;

        double prev = 0;
        for (int i = 0; i < SLAB_LIMITS.length; i++) {
            double slabSize = SLAB_LIMITS[i] - prev;
            if (remaining <= 0) break;

            double consumed = Math.min(remaining, slabSize);
            energyCharge += consumed * SLAB_RATES[i];
            remaining -= consumed;
            prev = SLAB_LIMITS[i];
        }

        // Add wheeling charge on all units
        double wheelingCharge = units * WHEELING_CHARGE;

        return energyCharge + wheelingCharge;
    }

    /**
     * Payback period calculator for new appliance investment
     * @param oldWattage   - Current appliance wattage
     * @param newWattage   - New efficient appliance wattage
     * @param hoursPerDay  - Daily usage hours
     * @param newCost      - Price of new appliance in ₹
     * @return months to recover the investment
     */
    public static double paybackMonths(double oldWattage, double newWattage,
                                       double hoursPerDay, double newCost) {
        double oldUnits = monthlyUnits(oldWattage, hoursPerDay);
        double newUnits = monthlyUnits(newWattage, hoursPerDay);

        double oldBill  = calculateBill(oldUnits);
        double newBill  = calculateBill(newUnits);

        double monthlySavings = oldBill - newBill;
        if (monthlySavings <= 0) return -1; // No benefit
        return newCost / monthlySavings;
    }

    // -----------------------------------------------------------------------
    // CLI mode: called from Node.js via child_process.exec
    // java EnergyCalculator <wattage> <hours> <rate>
    // -----------------------------------------------------------------------
    public static void cliMode(String[] args) {
        double wattage    = Double.parseDouble(args[0]);
        double hoursPerDay = Double.parseDouble(args[1]);
        // args[2] is optional custom rate (ignored in slab mode, kept for compatibility)

        double units = monthlyUnits(wattage, hoursPerDay);
        double bill  = calculateBill(units);
        double annualBill = bill * 12;

        // Output as simple key=value for easy parsing by Node.js
        System.out.println("MONTHLY_UNITS="   + String.format("%.2f", units));
        System.out.println("MONTHLY_BILL=INR" + String.format("%.2f", bill));
        System.out.println("ANNUAL_BILL=INR"  + String.format("%.2f", annualBill));
    }

    // -----------------------------------------------------------------------
    // Interactive menu mode
    // -----------------------------------------------------------------------
    public static void interactiveMode() {
        Scanner sc = new Scanner(System.in);

        printBanner();

        boolean running = true;
        while (running) {
            System.out.println("\n╔══════════════════════════════════╗");
            System.out.println("║          MAIN MENU               ║");
            System.out.println("╠══════════════════════════════════╣");
            System.out.println("║  1. Monthly Bill Calculator      ║");
            System.out.println("║  2. Payback Period Calculator    ║");
            System.out.println("║  3. Slab Rate Info               ║");
            System.out.println("║  4. Exit                         ║");
            System.out.println("╚══════════════════════════════════╝");
            System.out.print("Choose option: ");

            int choice = sc.nextInt();

            switch (choice) {
                case 1 -> monthlyBillMenu(sc);
                case 2 -> paybackMenu(sc);
                case 3 -> showSlabRates();
                case 4 -> { running = false; System.out.println("\n✅ Goodbye! Save energy, save money! ⚡"); }
                default -> System.out.println("❌ Invalid option. Try again.");
            }
        }
        sc.close();
    }

    static void monthlyBillMenu(Scanner sc) {
        System.out.println("\n--- Monthly Bill Calculator ---");
        System.out.print("Enter appliance wattage (W): ");
        double wattage = sc.nextDouble();

        System.out.print("Enter daily usage (hours): ");
        double hours = sc.nextDouble();

        double units         = monthlyUnits(wattage, hours);
        double bill          = calculateBill(units);
        double energyPart    = bill - (units * WHEELING_CHARGE);
        double wheelingPart  = units * WHEELING_CHARGE;

        System.out.println("\n📊 Results:");
        System.out.printf("  Monthly Consumption : %.2f kWh (units)%n", units);
        System.out.printf("  Energy Charges      : ₹%.2f (slab-wise)%n", energyPart);
        System.out.printf("  Wheeling Charges    : ₹%.2f (₹1.17 × %.0f units)%n", wheelingPart, units);
        System.out.println("  ─────────────────────────────────────");
        System.out.printf("  Total Bill (approx) : ₹%.2f%n", bill);
        System.out.printf("  Annual Cost         : ₹%.2f%n", bill * 12);
        System.out.println("  ⚠ Excl. Fixed charges, Electricity Duty (16%), Tax");
    }

    static void paybackMenu(Scanner sc) {
        System.out.println("\n--- Payback Period Calculator ---");
        System.out.print("Current appliance wattage (W): ");
        double oldW = sc.nextDouble();

        System.out.print("New efficient appliance wattage (W): ");
        double newW = sc.nextDouble();

        System.out.print("Daily usage (hours): ");
        double hours = sc.nextDouble();

        System.out.print("Price of new appliance (₹): ");
        double cost = sc.nextDouble();

        double months = paybackMonths(oldW, newW, hours, cost);
        double oldBill = calculateBill(monthlyUnits(oldW, hours));
        double newBill = calculateBill(monthlyUnits(newW, hours));

        System.out.println("\n📊 Results:");
        System.out.printf("  Old Monthly Bill    : ₹%.2f%n", oldBill);
        System.out.printf("  New Monthly Bill    : ₹%.2f%n", newBill);
        System.out.printf("  Monthly Savings     : ₹%.2f%n", (oldBill - newBill));
        System.out.printf("  Annual  Savings     : ₹%.2f%n", (oldBill - newBill) * 12);

        if (months < 0) {
            System.out.println("  ⚠️  New appliance doesn't save energy!");
        } else {
            System.out.printf("  Payback Period      : %.1f months (%.1f years)%n",
                              months, months / 12.0);
        }
    }

    static void showSlabRates() {
        System.out.println("\n--- MSEDCL (Mahavitaran) LT-I Residential Tariff FY 2024-25 ---");
        System.out.println("  Energy Charges (slab-wise):");
        System.out.println("    0   - 100 units : ₹4.71 / unit");
        System.out.println("    101 - 300 units : ₹10.29 / unit");
        System.out.println("    301 - 500 units : ₹14.55 / unit");
        System.out.println("    500+    units   : ₹16.64 / unit");
        System.out.println("  Wheeling Charge   : ₹1.17 / unit (on all units)");
        System.out.println();
        System.out.println("  ⚠ Above rates EXCLUDE:");
        System.out.println("    - Fixed charges (based on sanctioned load)");
        System.out.println("    - Electricity Duty (16%)");
        System.out.println("    - Tax on Sale of Electricity");
        System.out.println("  Source: MERC MYT Order, Case No. 226 of 2022");
    }

    static void printBanner() {
        System.out.println("╔══════════════════════════════════════════╗");
        System.out.println("║    ⚡  VOLTIFY - Energy Calculator  ⚡   ║");
        System.out.println("║      Java Utility  |  Maharashtra        ║");
        System.out.println("╚══════════════════════════════════════════╝");
    }

    // -----------------------------------------------------------------------
    // Entry point
    // -----------------------------------------------------------------------
    public static void main(String[] args) {
        if (args.length >= 2) {
            // CLI mode - called programmatically from Node.js
            cliMode(args);
        } else {
            // Interactive mode - run manually / demo
            interactiveMode();
        }
    }
}
