import path from "path";
import { config } from "dotenv";

// Load .env from server root (parent of prisma folder)
config({ path: path.resolve(__dirname, "../.env") });

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create default admin user
  const password = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@procmvp.com" },
    update: {},
    create: {
      email: "admin@procmvp.com",
      password,
      name: "Admin User",
      role: "ADMIN",
    },
  });

  console.log(`✅ Admin user created: ${admin.email}`);

  // Create sample vendors
  const vendors = await Promise.all([
    prisma.vendor.create({
      data: {
        companyName: "ABC Steel Co.",
        country: "China",
        website: "https://abcsteel.example.com",
        companySize: "Large",
        yearsInBusiness: 15,
        manufacturingCapacity: "50,000 tons/year",
        minimumOrderQuantity: "100 pieces",
        leadTime: "25 days",
        qualityScore: 9.2,
        reliabilityScore: 9.5,
        performanceScore: 9.3,
        responseRate: 0.92,
        status: "ACTIVE",
        contacts: {
          createMany: {
            data: [
              { type: "email", value: "sales@abcsteel.example.com" },
              { type: "phone", value: "+86-21-12345678" },
            ],
          },
        },
        certifications: {
          createMany: {
            data: [
              { name: "ISO 9001", issuedBy: "SGS" },
              { name: "ISO 14001", issuedBy: "SGS" },
            ],
          },
        },
        products: {
          createMany: {
            data: [
              { productCategory: "Steel Pipes", moq: 100 },
              { productCategory: "Steel Plates", moq: 50 },
            ],
          },
        },
      },
    }),
    prisma.vendor.create({
      data: {
        companyName: "XYZ Metals Ltd",
        country: "India",
        website: "https://xyzmetals.example.com",
        companySize: "Medium",
        yearsInBusiness: 10,
        manufacturingCapacity: "30,000 tons/year",
        minimumOrderQuantity: "50 pieces",
        leadTime: "30 days",
        qualityScore: 8.5,
        reliabilityScore: 8.8,
        performanceScore: 8.6,
        responseRate: 0.85,
        status: "ACTIVE",
        contacts: {
          createMany: {
            data: [
              { type: "email", value: "info@xyzmetals.example.com" },
            ],
          },
        },
        certifications: {
          createMany: {
            data: [{ name: "ISO 9001", issuedBy: "TUV" }],
          },
        },
        products: {
          createMany: {
            data: [
              { productCategory: "Steel Pipes", moq: 50 },
              { productCategory: "Copper Fittings", moq: 200 },
            ],
          },
        },
      },
    }),
    prisma.vendor.create({
      data: {
        companyName: "Global Pipes Ltd",
        country: "UAE",
        website: "https://globalpipes.example.com",
        companySize: "Large",
        yearsInBusiness: 20,
        manufacturingCapacity: "80,000 tons/year",
        minimumOrderQuantity: "200 pieces",
        leadTime: "20 days",
        qualityScore: 9.8,
        reliabilityScore: 9.2,
        performanceScore: 9.5,
        responseRate: 0.95,
        status: "ACTIVE",
        contacts: {
          createMany: {
            data: [
              { type: "email", value: "procurement@globalpipes.example.com" },
              { type: "phone", value: "+971-4-1234567" },
            ],
          },
        },
        certifications: {
          createMany: {
            data: [
              { name: "ISO 9001", issuedBy: "Bureau Veritas" },
              { name: "API 5L", issuedBy: "API" },
            ],
          },
        },
        products: {
          createMany: {
            data: [{ productCategory: "Steel Pipes", moq: 200 }],
          },
        },
      },
    }),
  ]);

  console.log(`✅ ${vendors.length} sample vendors created`);
  console.log("🌱 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
