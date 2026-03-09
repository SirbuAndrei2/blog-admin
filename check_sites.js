const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const sites = await prisma.site.findMany();
    console.log(JSON.stringify(sites, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
