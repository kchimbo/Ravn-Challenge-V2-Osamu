import { PrismaClient } from '@prisma/client';

const prismaClient = new PrismaClient();

const main = async () => {
  const products = [
    {
      name: 'Isabelle Pineapple Cakes',
      description: '',
      price: 1899,
      stock: 3,
      category: {
        connectOrCreate: {
          where: {
            slug: 'biscuits-and-crackers',
          },
          create: {
            name: 'Biscuits & Crackers',
            slug: 'biscuits-and-crackers',
          },
        },
      },
    },
    {
      name: 'Khon Guan Fancy Gem Cookies',
      description: '',
      price: 299,
      stock: 3,
      category: {
        connectOrCreate: {
          where: {
            slug: 'biscuits-and-crackers',
          },
          create: {
            name: 'Biscuits & Crackers',
            slug: 'biscuits-and-crackers',
          },
        },
      },
    },
  ];

  await prismaClient.$transaction(
    products.map((product) =>
      prismaClient.product.create({
        data: product,
      }),
    ),
  );
};

main()
  .catch((error) => {
    console.log(error);
    process.exit(1);
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
