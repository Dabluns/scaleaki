const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.oferta.count({
        where: {
            isActive: true,
            status: 'ativa',
            AND: [
                { vsl: { not: null } },
                { vsl: { not: '' } }
            ]
        }
    });
    console.log(`Total ofertas com VSL: ${count}`);

    const sample = await prisma.oferta.findMany({
        where: {
            isActive: true,
            status: 'ativa',
            AND: [
                { vsl: { not: null } },
                { vsl: { not: '' } }
            ]
        },
        select: { id: true, titulo: true, vsl: true }
    });
    console.log('Amostra de ofertas com VSL:');
    console.log(JSON.stringify(sample, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
