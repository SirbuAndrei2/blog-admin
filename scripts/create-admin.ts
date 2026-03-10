import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('Usage: npx tsx scripts/create-admin.ts <email> <password> [name]');
        process.exit(1);
    }

    const [email, password, ...nameParts] = args;
    const name = nameParts.length > 0 ? nameParts.join(' ') : 'Admin User';

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                name,
            },
            create: {
                email,
                password: hashedPassword,
                name,
            },
        });
        console.log(`Admin user ${user.email} created/updated successfully!`);
    } catch (error) {
        console.error('Failed to create admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
