import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seedRequest(input: {
  title: string;
  description: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "needs_revision";
  createdById: string;
  assignedToId: string;
}) {
  const existing = await prisma.request.findFirst({
    where: {
      title: input.title,
      createdById: input.createdById,
    },
  });

  if (existing) {
    return prisma.request.update({
      where: { id: existing.id },
      data: {
        description: input.description,
        amount: input.amount,
        status: input.status,
        assignedToId: input.assignedToId,
      },
    });
  }

  return prisma.request.create({
    data: input,
  });
}

async function main() {
  const managerPassword = process.env.SEED_MANAGER_PASSWORD || "Manager@123";
  const employeePassword = process.env.SEED_EMPLOYEE_PASSWORD || "Employee@123";

  const managerHash = await bcrypt.hash(managerPassword, 12);
  const employeeHash = await bcrypt.hash(employeePassword, 12);

  const manager = await prisma.user.upsert({
    where: { email: "manager@hooshpod.ai" },
    update: {},
    create: {
      name: "مدیر سیستم",
      email: "manager@hooshpod.ai",
      passwordHash: managerHash,
      role: "manager",
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: "employee@hooshpod.ai" },
    update: {},
    create: {
      name: "کارمند نمونه",
      email: "employee@hooshpod.ai",
      passwordHash: employeeHash,
      role: "employee",
    },
  });

  const requests = await Promise.all([
    seedRequest({
      title: "خرید لپ تاپ برای تیم طراحی",
      description:
        "درخواست خرید دو دستگاه لپ تاپ برای اعضای جدید تیم طراحی به منظور شروع پروژه فصل جدید.",
      amount: 245000000,
      status: "pending",
      createdById: employee.id,
      assignedToId: manager.id,
    }),
    seedRequest({
      title: "پرداخت هزینه دوره آموزشی React پیشرفته",
      description:
        "ثبت هزینه دوره آموزشی برای ارتقای مهارت توسعه رابط کاربری و بهبود کیفیت خروجی تیم.",
      amount: 18500000,
      status: "approved",
      createdById: employee.id,
      assignedToId: manager.id,
    }),
    seedRequest({
      title: "خرید مانیتور 34 اینچ",
      description:
        "درخواست خرید مانیتور اولتراواید برای تحلیل داده و توسعه داشبوردهای داخلی شرکت.",
      amount: 39000000,
      status: "needs_revision",
      createdById: employee.id,
      assignedToId: manager.id,
    }),
  ]);

  console.log("Seeded users:", {
    manager: manager.email,
    employee: employee.email,
  });
  console.log("Seeded requests:", requests.map((request) => request.title));
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
