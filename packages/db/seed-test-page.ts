import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const userId = "test-user-id";

    // Upsert user
    await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: {
            id: userId,
            email: "test@tratohive.com",
            name: "Test User",
        },
    });

    const pageId = "test-page-id";

    // Upsert page
    await prisma.page.upsert({
        where: { id: pageId },
        update: {},
        create: {
            id: pageId,
            title: "Test Editor Page",
        },
    });

    console.log(`Seeded Page: ${pageId}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
