import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data (order matters for FK constraints)
  await prisma.funnelEvent.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.routingRule.deleteMany();
  await prisma.question.deleteMany();
  await prisma.step.deleteMany();
  await prisma.insuranceType.deleteMany();

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 12);
  await prisma.adminUser.upsert({
    where: { email: "admin@insurecompare.com" },
    update: {},
    create: { email: "admin@insurecompare.com", password: hashedPassword, name: "Admin" },
  });

  // ─── Insurance Types ───
  const autoType = await prisma.insuranceType.create({ data: { name: "auto", label: "Auto Insurance", icon: "car", order: 0 } });
  const homeType = await prisma.insuranceType.create({ data: { name: "home", label: "Home Insurance", icon: "home", order: 1 } });
  const healthType = await prisma.insuranceType.create({ data: { name: "health", label: "Health Insurance", icon: "health", order: 2 } });
  const lifeType = await prisma.insuranceType.create({ data: { name: "life", label: "Life Insurance", icon: "life", order: 3 } });
  const bizType = await prisma.insuranceType.create({ data: { name: "business", label: "Business Insurance", icon: "business", order: 4 } });

  // ═══════════════════════════════════════════════
  // AUTO INSURANCE — 14 steps, 1-2 questions each
  // ═══════════════════════════════════════════════
  const autoSteps = [
    { title: "What's your ZIP code?", desc: "We'll find the best rates in your area", order: 0,
      questions: [{ label: "ZIP Code", fieldName: "zipCode", fieldType: "zip", placeholder: "Enter your ZIP code", required: true, order: 0 }] },
    { title: "Are you currently insured?", desc: "This helps us find the right coverage", order: 1,
      questions: [{ label: "Currently Insured", fieldName: "currentlyInsured", fieldType: "radio", required: true, order: 0, options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] }] },
    { title: "Who's your current carrier?", desc: "We'll compare against your current rate", order: 2,
      questions: [{ label: "Current Carrier", fieldName: "currentCarrier", fieldType: "radio", required: true, order: 0,
        options: [{ value: "allstate", label: "Allstate" }, { value: "geico", label: "GEICO" }, { value: "progressive", label: "Progressive" }, { value: "statefarm", label: "State Farm" }, { value: "other", label: "Other" }, { value: "none", label: "None" }] }] },
    { title: "What year is your vehicle?", desc: "Newer vehicles may qualify for additional discounts", order: 3,
      questions: [{ label: "Vehicle Year", fieldName: "vehicleYear", fieldType: "select", required: true, order: 0,
        options: Array.from({ length: 15 }, (_, i) => { const y = String(2026 - i); return { value: y, label: y }; }) }] },
    { title: "What's your vehicle?", desc: "Tell us the make and model", order: 4,
      questions: [
        { label: "Vehicle Make", fieldName: "vehicleMake", fieldType: "text", placeholder: "e.g. Toyota, Honda, Ford", required: true, order: 0 },
        { label: "Vehicle Model", fieldName: "vehicleModel", fieldType: "text", placeholder: "e.g. Camry, Civic, F-150", required: true, order: 1 },
      ] },
    { title: "How many vehicles do you have?", order: 5,
      questions: [{ label: "Number of Vehicles", fieldName: "vehicleCount", fieldType: "radio", required: true, order: 0,
        options: [{ value: "1", label: "1 Vehicle" }, { value: "2", label: "2 Vehicles" }, { value: "3+", label: "3 or More" }] }] },
    { title: "Do you own your home?", desc: "Homeowners often qualify for bundling discounts", order: 6,
      questions: [{ label: "Homeowner", fieldName: "homeowner", fieldType: "radio", required: true, order: 0,
        options: [{ value: "yes", label: "Yes, I Own" }, { value: "no", label: "No, I Rent" }] }] },
    { title: "What's your marital status?", desc: "Married drivers often get lower rates", order: 7,
      questions: [{ label: "Married", fieldName: "married", fieldType: "radio", required: true, order: 0,
        options: [{ value: "yes", label: "Married" }, { value: "no", label: "Single" }] }] },
    { title: "What's your gender?", order: 8,
      questions: [{ label: "Gender", fieldName: "gender", fieldType: "radio", required: true, order: 0,
        options: [{ value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "other", label: "Non-binary" }] }] },
    { title: "What's your age range?", order: 9,
      questions: [{ label: "Age", fieldName: "age", fieldType: "radio", required: true, order: 0,
        options: [{ value: "16-24", label: "16-24" }, { value: "25-34", label: "25-34" }, { value: "35-49", label: "35-49" }, { value: "50-64", label: "50-64" }, { value: "65+", label: "65+" }] }] },
    { title: "Estimate your credit score", desc: "Better credit usually means lower premiums", order: 10,
      questions: [{ label: "Credit Score", fieldName: "creditScore", fieldType: "radio", required: true, order: 0,
        options: [{ value: "excellent", label: "Excellent (750+)" }, { value: "good", label: "Good (700-749)" }, { value: "fair", label: "Fair (650-699)" }, { value: "poor", label: "Poor (<650)" }] }] },
    { title: "Any accidents in the past 3 years?", order: 11,
      questions: [{ label: "Accidents", fieldName: "accidents", fieldType: "radio", required: true, order: 0,
        options: [{ value: "none", label: "None" }, { value: "1", label: "1 Accident" }, { value: "2+", label: "2 or More" }] }] },
    { title: "What coverage level do you want?", order: 12,
      questions: [{ label: "Coverage Level", fieldName: "coverageLevel", fieldType: "radio", required: true, order: 0,
        options: [{ value: "minimum", label: "State Minimum" }, { value: "standard", label: "Standard" }, { value: "full", label: "Full Coverage" }, { value: "premium", label: "Premium" }] }] },
    { title: "What's your name?", desc: "Almost done! Just need your contact info", order: 13,
      questions: [
        { label: "First Name", fieldName: "firstName", fieldType: "text", placeholder: "First name", required: true, order: 0 },
        { label: "Last Name", fieldName: "lastName", fieldType: "text", placeholder: "Last name", required: true, order: 1 },
      ] },
    { title: "Where should we send your quotes?", desc: "We'll email your personalized quotes", order: 14,
      questions: [
        { label: "Email Address", fieldName: "email", fieldType: "email", placeholder: "you@example.com", required: true, order: 0 },
        { label: "Phone Number", fieldName: "phone", fieldType: "tel", placeholder: "(555) 123-4567", required: true, order: 1 },
      ] },
  ];

  for (const s of autoSteps) {
    const step = await prisma.step.create({
      data: { insuranceTypeId: autoType.id, title: s.title, description: s.desc || null, order: s.order },
    });
    await prisma.question.createMany({
      data: s.questions.map((q) => ({ stepId: step.id, ...q })),
    });
  }

  // ═══════════════════════════════════════════════
  // HOME INSURANCE — 10 steps
  // ═══════════════════════════════════════════════
  const homeSteps = [
    { title: "What's your ZIP code?", desc: "We'll find home insurance rates in your area", order: 0,
      questions: [{ label: "ZIP Code", fieldName: "zipCode", fieldType: "zip", placeholder: "Enter your ZIP code", required: true, order: 0 }] },
    { title: "What type of property?", order: 1,
      questions: [{ label: "Property Type", fieldName: "propertyType", fieldType: "radio", required: true, order: 0,
        options: [{ value: "single_family", label: "Single Family" }, { value: "condo", label: "Condo/Townhome" }, { value: "multi_family", label: "Multi-Family" }, { value: "mobile", label: "Mobile Home" }] }] },
    { title: "When was it built?", desc: "Newer homes may qualify for lower rates", order: 2,
      questions: [{ label: "Year Built", fieldName: "yearBuilt", fieldType: "text", placeholder: "e.g. 1995", required: true, order: 0 }] },
    { title: "How big is your home?", order: 3,
      questions: [{ label: "Square Footage", fieldName: "sqft", fieldType: "number", placeholder: "e.g. 2000", required: true, order: 0 }] },
    { title: "What type of roof?", order: 4,
      questions: [{ label: "Roof Type", fieldName: "roofType", fieldType: "radio", required: true, order: 0,
        options: [{ value: "asphalt", label: "Asphalt Shingles" }, { value: "metal", label: "Metal" }, { value: "tile", label: "Tile" }, { value: "other", label: "Other" }] }] },
    { title: "Estimated home value?", order: 5,
      questions: [{ label: "Home Value", fieldName: "homeValue", fieldType: "radio", required: true, order: 0,
        options: [{ value: "under_200k", label: "Under $200K" }, { value: "200_400k", label: "$200K-$400K" }, { value: "400_700k", label: "$400K-$700K" }, { value: "over_700k", label: "Over $700K" }] }] },
    { title: "Any claims in the past 5 years?", order: 6,
      questions: [{ label: "Claims", fieldName: "claims", fieldType: "radio", required: true, order: 0,
        options: [{ value: "0", label: "None" }, { value: "1", label: "1 Claim" }, { value: "2+", label: "2 or More" }] }] },
    { title: "What's your name?", desc: "Almost done!", order: 7,
      questions: [
        { label: "First Name", fieldName: "firstName", fieldType: "text", placeholder: "First name", required: true, order: 0 },
        { label: "Last Name", fieldName: "lastName", fieldType: "text", placeholder: "Last name", required: true, order: 1 },
      ] },
    { title: "Where should we send your quotes?", order: 8,
      questions: [
        { label: "Email Address", fieldName: "email", fieldType: "email", placeholder: "you@example.com", required: true, order: 0 },
        { label: "Phone Number", fieldName: "phone", fieldType: "tel", placeholder: "(555) 123-4567", required: true, order: 1 },
      ] },
  ];

  for (const s of homeSteps) {
    const step = await prisma.step.create({
      data: { insuranceTypeId: homeType.id, title: s.title, description: s.desc || null, order: s.order },
    });
    await prisma.question.createMany({
      data: s.questions.map((q) => ({ stepId: step.id, ...q })),
    });
  }

  // ═══════════════════════════════════════════════
  // HEALTH INSURANCE — 8 steps
  // ═══════════════════════════════════════════════
  const healthSteps = [
    { title: "What's your ZIP code?", desc: "Health plans vary by region", order: 0,
      questions: [{ label: "ZIP Code", fieldName: "zipCode", fieldType: "zip", placeholder: "Enter your ZIP code", required: true, order: 0 }] },
    { title: "Who needs coverage?", order: 1,
      questions: [{ label: "Coverage For", fieldName: "coverageFor", fieldType: "radio", required: true, order: 0,
        options: [{ value: "individual", label: "Just Me" }, { value: "couple", label: "Me & Spouse" }, { value: "family", label: "My Family" }, { value: "child", label: "My Child" }] }] },
    { title: "What's your date of birth?", order: 2,
      questions: [{ label: "Date of Birth", fieldName: "dob", fieldType: "date", required: true, order: 0 }] },
    { title: "What's your annual household income?", desc: "You may qualify for subsidies", order: 3,
      questions: [{ label: "Income", fieldName: "income", fieldType: "radio", required: true, order: 0,
        options: [{ value: "under_30k", label: "Under $30K" }, { value: "30_50k", label: "$30K-$50K" }, { value: "50_100k", label: "$50K-$100K" }, { value: "over_100k", label: "Over $100K" }] }] },
    { title: "What's your name?", desc: "Almost done!", order: 4,
      questions: [
        { label: "First Name", fieldName: "firstName", fieldType: "text", placeholder: "First name", required: true, order: 0 },
        { label: "Last Name", fieldName: "lastName", fieldType: "text", placeholder: "Last name", required: true, order: 1 },
      ] },
    { title: "Where should we send your quotes?", order: 5,
      questions: [
        { label: "Email Address", fieldName: "email", fieldType: "email", placeholder: "you@example.com", required: true, order: 0 },
        { label: "Phone Number", fieldName: "phone", fieldType: "tel", placeholder: "(555) 123-4567", required: true, order: 1 },
      ] },
  ];

  for (const s of healthSteps) {
    const step = await prisma.step.create({
      data: { insuranceTypeId: healthType.id, title: s.title, description: s.desc || null, order: s.order },
    });
    await prisma.question.createMany({
      data: s.questions.map((q) => ({ stepId: step.id, ...q })),
    });
  }

  // ═══════════════════════════════════════════════
  // LIFE INSURANCE — 9 steps
  // ═══════════════════════════════════════════════
  const lifeSteps = [
    { title: "What's your ZIP code?", order: 0,
      questions: [{ label: "ZIP Code", fieldName: "zipCode", fieldType: "zip", placeholder: "Enter your ZIP code", required: true, order: 0 }] },
    { title: "What's your date of birth?", order: 1,
      questions: [{ label: "Date of Birth", fieldName: "dob", fieldType: "date", required: true, order: 0 }] },
    { title: "What's your gender?", order: 2,
      questions: [{ label: "Gender", fieldName: "gender", fieldType: "radio", required: true, order: 0,
        options: [{ value: "male", label: "Male" }, { value: "female", label: "Female" }] }] },
    { title: "Do you use tobacco?", desc: "This significantly affects life insurance rates", order: 3,
      questions: [{ label: "Tobacco Use", fieldName: "tobacco", fieldType: "radio", required: true, order: 0,
        options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] }] },
    { title: "How much coverage do you need?", order: 4,
      questions: [{ label: "Coverage Amount", fieldName: "coverageAmount", fieldType: "radio", required: true, order: 0,
        options: [{ value: "100k", label: "$100,000" }, { value: "250k", label: "$250,000" }, { value: "500k", label: "$500,000" }, { value: "1m", label: "$1,000,000" }] }] },
    { title: "What's your name?", desc: "Almost done!", order: 5,
      questions: [
        { label: "First Name", fieldName: "firstName", fieldType: "text", placeholder: "First name", required: true, order: 0 },
        { label: "Last Name", fieldName: "lastName", fieldType: "text", placeholder: "Last name", required: true, order: 1 },
      ] },
    { title: "Where should we send your quotes?", order: 6,
      questions: [
        { label: "Email Address", fieldName: "email", fieldType: "email", placeholder: "you@example.com", required: true, order: 0 },
        { label: "Phone Number", fieldName: "phone", fieldType: "tel", placeholder: "(555) 123-4567", required: true, order: 1 },
      ] },
  ];

  for (const s of lifeSteps) {
    const step = await prisma.step.create({
      data: { insuranceTypeId: lifeType.id, title: s.title, description: s.desc || null, order: s.order },
    });
    await prisma.question.createMany({
      data: s.questions.map((q) => ({ stepId: step.id, ...q })),
    });
  }

  // ═══════════════════════════════════════════════
  // BUSINESS INSURANCE — 9 steps
  // ═══════════════════════════════════════════════
  const bizSteps = [
    { title: "What's your business ZIP code?", order: 0,
      questions: [{ label: "ZIP Code", fieldName: "zipCode", fieldType: "zip", placeholder: "Enter your ZIP code", required: true, order: 0 }] },
    { title: "What type of business?", order: 1,
      questions: [{ label: "Business Type", fieldName: "businessType", fieldType: "radio", required: true, order: 0,
        options: [{ value: "llc", label: "LLC" }, { value: "sole_prop", label: "Sole Proprietor" }, { value: "corp", label: "Corporation" }, { value: "partnership", label: "Partnership" }] }] },
    { title: "What's your industry?", order: 2,
      questions: [{ label: "Industry", fieldName: "industry", fieldType: "text", placeholder: "e.g. Restaurant, Tech, Retail", required: true, order: 0 }] },
    { title: "How many employees?", order: 3,
      questions: [{ label: "Employees", fieldName: "employees", fieldType: "radio", required: true, order: 0,
        options: [{ value: "1", label: "Just Me" }, { value: "2-10", label: "2-10" }, { value: "11-50", label: "11-50" }, { value: "50+", label: "50+" }] }] },
    { title: "What's your annual revenue?", order: 4,
      questions: [{ label: "Revenue", fieldName: "revenue", fieldType: "radio", required: true, order: 0,
        options: [{ value: "under_100k", label: "Under $100K" }, { value: "100_500k", label: "$100K-$500K" }, { value: "500k_1m", label: "$500K-$1M" }, { value: "over_1m", label: "Over $1M" }] }] },
    { title: "What's your name?", desc: "Almost done!", order: 5,
      questions: [
        { label: "Full Name", fieldName: "fullName", fieldType: "text", placeholder: "Your full name", required: true, order: 0 },
        { label: "Business Name", fieldName: "businessName", fieldType: "text", placeholder: "Your business name", required: true, order: 1 },
      ] },
    { title: "Where should we send your quotes?", order: 6,
      questions: [
        { label: "Email Address", fieldName: "email", fieldType: "email", placeholder: "you@example.com", required: true, order: 0 },
        { label: "Phone Number", fieldName: "phone", fieldType: "tel", placeholder: "(555) 123-4567", required: true, order: 1 },
      ] },
  ];

  for (const s of bizSteps) {
    const step = await prisma.step.create({
      data: { insuranceTypeId: bizType.id, title: s.title, description: s.desc || null, order: s.order },
    });
    await prisma.question.createMany({
      data: s.questions.map((q) => ({ stepId: step.id, ...q })),
    });
  }

  // ─── Routing Rules ───
  await prisma.routingRule.createMany({
    data: [
      { insuranceTypeId: autoType.id, name: "Premium Leads → Geico", companyName: "Geico", priority: 10, conditions: [{ field: "creditScore", operator: "equals", value: "excellent" }], weight: 100, enabled: true },
      { insuranceTypeId: autoType.id, name: "Standard Leads → Progressive", companyName: "Progressive", priority: 5, conditions: [], weight: 100, enabled: true, dailyCap: 50 },
      { insuranceTypeId: homeType.id, name: "All Home Leads → State Farm", companyName: "State Farm", priority: 10, conditions: [], weight: 100, enabled: true },
    ],
  });

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
