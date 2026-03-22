
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@scaleaki.com';
    console.log(`Attempting to clean up existing user: ${email}`);

    try {
        // deleteMany returns { count: number } and doesn't try to return the full object, 
        // avoiding enum validation errors if the record has invalid data.
        const result = await prisma.user.deleteMany({
            where: { email: email }
        });
        console.log(`Deleted ${result.count} user(s).`);
    } catch (error) {
        console.warn('Warning during deleteMany:', error);
    }

    const password = 'AdminScaleaki!2024';
    const hashedPassword = await bcrypt.hash(password, 12);

    console.log('Creating new admin user...');

    try {
        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: 'Administrador Principal',
                role: 'admin',
                plan: 'anual', // Valid enum
                isActive: true,
                emailConfirmed: true
            }
        });
        console.log('SUCCESS: Admin user created/reset with password: AdminScaleaki!2024');
    } catch (error) {
        console.error('Error creating admin user:', error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
