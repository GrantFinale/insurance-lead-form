import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 12);
  await prisma.adminUser.upsert({
    where: { email: "admin@insurecompare.com" },
    update: {},
    create: { email: "admin@insurecompare.com", password: hashedPassword, name: "Admin" },
  });

  // Insurance Types
  const autoType = await prisma.insuranceType.upsert({
    where: { name: "auto" },
    update: {},
    create: { name: "auto", label: "Auto Insurance", icon: "car", order: 0 },
  });

  const homeType = await prisma.insuranceType.upsert({
    where: { name: "home" },
    update: {},
    create: { name: "home", label: "Home Insurance", icon: "home", order: 1 },
  });

  const healthType = await prisma.insuranceType.upsert({
    where: { name: "health" },
    update: {},
    create: { name: "health", label: "Health Insurance", icon: "health", order: 2 },
  });

  const lifeType = await prisma.insuranceType.upsert({
    where: { name: "life" },
    update: {},
    create: { name: "life", label: "Life Insurance", icon: "life", order: 3 },
  });

  const bizType = await prisma.insuranceType.upsert({
    where: { name: "business" },
    update: {},
    create: { name: "business", label: "Business Insurance", icon: "business", order: 4 },
  });

  // ============ AUTO INSURANCE STEPS ============
  // Step 1: Location & Basic Info
  const autoStep1 = await prisma.step.create({
    data: {
      insuranceTypeId: autoType.id,
      title: "Let's start with your location",
      description: "We'll find the best rates in your area",
      order: 0,
    },
  });

  await prisma.question.createMany({
    data: [
      { stepId: autoStep1.id, label: "ZIP Code", fieldName: "zipCode", fieldType: "zip", placeholder: "Enter your ZIP code", required: true, order: 0 },
      {
        stepId: autoStep1.id, label: "Age", fieldName: "age", fieldType: "select", required: true, order: 1,
        options: [
          { value: "16-20", label: "16-20" }, { value: "21-24", label: "21-24" }, { value: "25-34", label: "25-34" },
          { value: "35-44", label: "35-44" }, { value: "45-54", label: "45-54" }, { value: "55-64", label: "55-64" }, { value: "65+", label: "65+" },
        ],
      },
      {
        stepId: autoStep1.id, label: "Current Insurance Carrier", fieldName: "currentCarrier", fieldType: "select", required: true, order: 2,
        options: [
          { value: "allstate", label: "AllState" }, { value: "geico", label: "Geico" }, { value: "progressive", label: "Progressive" },
          { value: "statefarm", label: "State Farm" }, { value: "usaa", label: "USAA" }, { value: "liberty", label: "Liberty Mutual" },
          { value: "nationwide", label: "Nationwide" }, { value: "farmers", label: "Farmers" }, { value: "travelers", label: "Travelers" },
          { value: "other", label: "Other" }, { value: "none", label: "Not Currently Insured" },
        ],
      },
      { stepId: autoStep1.id, label: "Are you married?", fieldName: "married", fieldType: "radio", required: true, order: 3, options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
      { stepId: autoStep1.id, label: "Do you own your home?", fieldName: "homeowner", fieldType: "radio", required: true, order: 4, options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
    ],
  });

  // Step 2: Vehicle Information
  const autoStep2 = await prisma.step.create({
    data: {
      insuranceTypeId: autoType.id,
      title: "Tell us about your vehicle",
      description: "This helps us find accurate quotes",
      order: 1,
    },
  });

  await prisma.question.createMany({
    data: [
      {
        stepId: autoStep2.id, label: "Vehicle Year", fieldName: "vehicleYear", fieldType: "select", required: true, order: 0,
        options: Array.from({ length: 15 }, (_, i) => {
          const year = String(2026 - i);
          return { value: year, label: year };
        }),
      },
      { stepId: autoStep2.id, label: "Vehicle Make", fieldName: "vehicleMake", fieldType: "text", placeholder: "e.g. Toyota, Honda, Ford", required: true, order: 1 },
      { stepId: autoStep2.id, label: "Vehicle Model", fieldName: "vehicleModel", fieldType: "text", placeholder: "e.g. Camry, Civic, F-150", required: true, order: 2 },
      { stepId: autoStep2.id, label: "How many vehicles?", fieldName: "vehicleCount", fieldType: "select", required: true, order: 3, options: [{ value: "1", label: "1" }, { value: "2", label: "2" }, { value: "3+", label: "3 or more" }] },
    ],
  });

  // Step 3: Driver Information
  const autoStep3 = await prisma.step.create({
    data: {
      insuranceTypeId: autoType.id,
      title: "Driver information",
      description: "Tell us about yourself",
      order: 2,
    },
  });

  await prisma.question.createMany({
    data: [
      {
        stepId: autoStep3.id, label: "Gender", fieldName: "gender", fieldType: "radio", required: true, order: 0,
        options: [{ value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "other", label: "Non-binary" }],
      },
      {
        stepId: autoStep3.id, label: "Credit Score (estimate)", fieldName: "creditScore", fieldType: "select", required: true, order: 1,
        options: [
          { value: "excellent", label: "Excellent (750+)" }, { value: "good", label: "Good (700-749)" },
          { value: "fair", label: "Fair (650-699)" }, { value: "poor", label: "Poor (below 650)" },
        ],
      },
      {
        stepId: autoStep3.id, label: "Any accidents or violations in the past 3 years?", fieldName: "accidents", fieldType: "radio", required: true, order: 2,
        options: [{ value: "none", label: "None" }, { value: "1", label: "1" }, { value: "2+", label: "2 or more" }],
      },
      {
        stepId: autoStep3.id, label: "Coverage level", fieldName: "coverageLevel", fieldType: "radio", required: true, order: 3,
        options: [
          { value: "minimum", label: "State Minimum" }, { value: "standard", label: "Standard" },
          { value: "full", label: "Full Coverage" }, { value: "premium", label: "Premium" },
        ],
      },
    ],
  });

  // Step 4: Contact Information
  const autoStep4 = await prisma.step.create({
    data: {
      insuranceTypeId: autoType.id,
      title: "Almost done! Get your quotes",
      description: "We need your contact info to deliver personalized quotes",
      order: 3,
    },
  });

  await prisma.question.createMany({
    data: [
      { stepId: autoStep4.id, label: "First Name", fieldName: "firstName", fieldType: "text", placeholder: "First name", required: true, order: 0 },
      { stepId: autoStep4.id, label: "Last Name", fieldName: "lastName", fieldType: "text", placeholder: "Last name", required: true, order: 1 },
      { stepId: autoStep4.id, label: "Email Address", fieldName: "email", fieldType: "email", placeholder: "you@example.com", required: true, order: 2 },
      { stepId: autoStep4.id, label: "Phone Number", fieldName: "phone", fieldType: "tel", placeholder: "(555) 123-4567", required: true, order: 3 },
      { stepId: autoStep4.id, label: "Street Address", fieldName: "address", fieldType: "text", placeholder: "123 Main St", required: false, order: 4 },
    ],
  });

  // ============ HOME INSURANCE STEPS ============
  const homeStep1 = await prisma.step.create({
    data: { insuranceTypeId: homeType.id, title: "Property Location", description: "Where is the property you want to insure?", order: 0 },
  });
  await prisma.question.createMany({
    data: [
      { stepId: homeStep1.id, label: "ZIP Code", fieldName: "zipCode", fieldType: "zip", placeholder: "Enter ZIP code", required: true, order: 0 },
      { stepId: homeStep1.id, label: "Property Type", fieldName: "propertyType", fieldType: "select", required: true, order: 1, options: [{ value: "single_family", label: "Single Family Home" }, { value: "condo", label: "Condo/Townhouse" }, { value: "multi_family", label: "Multi-Family" }, { value: "mobile", label: "Mobile Home" }] },
      { stepId: homeStep1.id, label: "Year Built", fieldName: "yearBuilt", fieldType: "text", placeholder: "e.g. 1995", required: true, order: 2 },
      { stepId: homeStep1.id, label: "Square Footage", fieldName: "sqft", fieldType: "number", placeholder: "e.g. 2000", required: true, order: 3 },
    ],
  });

  const homeStep2 = await prisma.step.create({
    data: { insuranceTypeId: homeType.id, title: "Property Details", description: "Help us understand your home", order: 1 },
  });
  await prisma.question.createMany({
    data: [
      { stepId: homeStep2.id, label: "Roof Type", fieldName: "roofType", fieldType: "select", required: true, order: 0, options: [{ value: "asphalt", label: "Asphalt Shingles" }, { value: "metal", label: "Metal" }, { value: "tile", label: "Tile" }, { value: "other", label: "Other" }] },
      { stepId: homeStep2.id, label: "Estimated Home Value", fieldName: "homeValue", fieldType: "select", required: true, order: 1, options: [{ value: "under_200k", label: "Under $200,000" }, { value: "200_400k", label: "$200,000 - $400,000" }, { value: "400_700k", label: "$400,000 - $700,000" }, { value: "over_700k", label: "Over $700,000" }] },
      { stepId: homeStep2.id, label: "Claims in the past 5 years?", fieldName: "claims", fieldType: "radio", required: true, order: 2, options: [{ value: "0", label: "None" }, { value: "1", label: "1" }, { value: "2+", label: "2 or more" }] },
    ],
  });

  const homeStep3 = await prisma.step.create({
    data: { insuranceTypeId: homeType.id, title: "Get Your Home Insurance Quotes", description: "Enter your contact info to receive quotes", order: 2 },
  });
  await prisma.question.createMany({
    data: [
      { stepId: homeStep3.id, label: "First Name", fieldName: "firstName", fieldType: "text", placeholder: "First name", required: true, order: 0 },
      { stepId: homeStep3.id, label: "Last Name", fieldName: "lastName", fieldType: "text", placeholder: "Last name", required: true, order: 1 },
      { stepId: homeStep3.id, label: "Email Address", fieldName: "email", fieldType: "email", placeholder: "you@example.com", required: true, order: 2 },
      { stepId: homeStep3.id, label: "Phone Number", fieldName: "phone", fieldType: "tel", placeholder: "(555) 123-4567", required: true, order: 3 },
    ],
  });

  // ============ HEALTH INSURANCE STEPS ============
  const healthStep1 = await prisma.step.create({
    data: { insuranceTypeId: healthType.id, title: "Your Health Coverage Needs", order: 0 },
  });
  await prisma.question.createMany({
    data: [
      { stepId: healthStep1.id, label: "ZIP Code", fieldName: "zipCode", fieldType: "zip", placeholder: "Enter ZIP code", required: true, order: 0 },
      { stepId: healthStep1.id, label: "Who needs coverage?", fieldName: "coverageFor", fieldType: "select", required: true, order: 1, options: [{ value: "individual", label: "Just Me" }, { value: "couple", label: "Me & Spouse" }, { value: "family", label: "My Family" }, { value: "child", label: "My Child" }] },
      { stepId: healthStep1.id, label: "Date of Birth", fieldName: "dob", fieldType: "date", required: true, order: 2 },
      { stepId: healthStep1.id, label: "Annual Household Income", fieldName: "income", fieldType: "select", required: true, order: 3, options: [{ value: "under_30k", label: "Under $30,000" }, { value: "30_50k", label: "$30,000 - $50,000" }, { value: "50_100k", label: "$50,000 - $100,000" }, { value: "over_100k", label: "Over $100,000" }] },
    ],
  });

  const healthStep2 = await prisma.step.create({
    data: { insuranceTypeId: healthType.id, title: "Get Your Health Quotes", order: 1 },
  });
  await prisma.question.createMany({
    data: [
      { stepId: healthStep2.id, label: "First Name", fieldName: "firstName", fieldType: "text", required: true, order: 0 },
      { stepId: healthStep2.id, label: "Last Name", fieldName: "lastName", fieldType: "text", required: true, order: 1 },
      { stepId: healthStep2.id, label: "Email", fieldName: "email", fieldType: "email", required: true, order: 2 },
      { stepId: healthStep2.id, label: "Phone", fieldName: "phone", fieldType: "tel", required: true, order: 3 },
    ],
  });

  // ============ LIFE INSURANCE STEPS ============
  const lifeStep1 = await prisma.step.create({
    data: { insuranceTypeId: lifeType.id, title: "Life Insurance Basics", order: 0 },
  });
  await prisma.question.createMany({
    data: [
      { stepId: lifeStep1.id, label: "ZIP Code", fieldName: "zipCode", fieldType: "zip", required: true, order: 0 },
      { stepId: lifeStep1.id, label: "Date of Birth", fieldName: "dob", fieldType: "date", required: true, order: 1 },
      { stepId: lifeStep1.id, label: "Gender", fieldName: "gender", fieldType: "radio", required: true, order: 2, options: [{ value: "male", label: "Male" }, { value: "female", label: "Female" }] },
      { stepId: lifeStep1.id, label: "Do you use tobacco?", fieldName: "tobacco", fieldType: "radio", required: true, order: 3, options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
      { stepId: lifeStep1.id, label: "Coverage Amount", fieldName: "coverageAmount", fieldType: "select", required: true, order: 4, options: [{ value: "100k", label: "$100,000" }, { value: "250k", label: "$250,000" }, { value: "500k", label: "$500,000" }, { value: "1m", label: "$1,000,000" }] },
    ],
  });

  const lifeStep2 = await prisma.step.create({
    data: { insuranceTypeId: lifeType.id, title: "Get Your Life Insurance Quotes", order: 1 },
  });
  await prisma.question.createMany({
    data: [
      { stepId: lifeStep2.id, label: "First Name", fieldName: "firstName", fieldType: "text", required: true, order: 0 },
      { stepId: lifeStep2.id, label: "Last Name", fieldName: "lastName", fieldType: "text", required: true, order: 1 },
      { stepId: lifeStep2.id, label: "Email", fieldName: "email", fieldType: "email", required: true, order: 2 },
      { stepId: lifeStep2.id, label: "Phone", fieldName: "phone", fieldType: "tel", required: true, order: 3 },
    ],
  });

  // ============ BUSINESS INSURANCE STEPS ============
  const bizStep1 = await prisma.step.create({
    data: { insuranceTypeId: bizType.id, title: "Your Business", order: 0 },
  });
  await prisma.question.createMany({
    data: [
      { stepId: bizStep1.id, label: "ZIP Code", fieldName: "zipCode", fieldType: "zip", required: true, order: 0 },
      { stepId: bizStep1.id, label: "Business Type", fieldName: "businessType", fieldType: "select", required: true, order: 1, options: [{ value: "llc", label: "LLC" }, { value: "sole_prop", label: "Sole Proprietorship" }, { value: "corp", label: "Corporation" }, { value: "partnership", label: "Partnership" }] },
      { stepId: bizStep1.id, label: "Industry", fieldName: "industry", fieldType: "text", placeholder: "e.g. Restaurant, Tech, Retail", required: true, order: 2 },
      { stepId: bizStep1.id, label: "Number of Employees", fieldName: "employees", fieldType: "select", required: true, order: 3, options: [{ value: "1", label: "Just me" }, { value: "2-10", label: "2-10" }, { value: "11-50", label: "11-50" }, { value: "50+", label: "50+" }] },
      { stepId: bizStep1.id, label: "Annual Revenue", fieldName: "revenue", fieldType: "select", required: true, order: 4, options: [{ value: "under_100k", label: "Under $100,000" }, { value: "100_500k", label: "$100,000 - $500,000" }, { value: "500k_1m", label: "$500,000 - $1M" }, { value: "over_1m", label: "Over $1M" }] },
    ],
  });

  const bizStep2 = await prisma.step.create({
    data: { insuranceTypeId: bizType.id, title: "Get Your Business Insurance Quotes", order: 1 },
  });
  await prisma.question.createMany({
    data: [
      { stepId: bizStep2.id, label: "Full Name", fieldName: "fullName", fieldType: "text", required: true, order: 0 },
      { stepId: bizStep2.id, label: "Business Name", fieldName: "businessName", fieldType: "text", required: true, order: 1 },
      { stepId: bizStep2.id, label: "Email", fieldName: "email", fieldType: "email", required: true, order: 2 },
      { stepId: bizStep2.id, label: "Phone", fieldName: "phone", fieldType: "tel", required: true, order: 3 },
    ],
  });

  // ============ SAMPLE ROUTING RULES ============
  await prisma.routingRule.createMany({
    data: [
      {
        insuranceTypeId: autoType.id,
        name: "Premium Leads → Geico",
        companyName: "Geico",
        priority: 10,
        conditions: [{ field: "creditScore", operator: "equals", value: "excellent" }],
        weight: 100,
        enabled: true,
      },
      {
        insuranceTypeId: autoType.id,
        name: "Standard Leads → Progressive",
        companyName: "Progressive",
        priority: 5,
        conditions: [],
        weight: 100,
        enabled: true,
        dailyCap: 50,
      },
      {
        insuranceTypeId: homeType.id,
        name: "All Home Leads → State Farm",
        companyName: "State Farm",
        priority: 10,
        conditions: [],
        weight: 100,
        enabled: true,
      },
    ],
  });

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
