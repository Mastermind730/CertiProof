import { PrismaClient } from "@/generated/prisma";

declare global {
    let prisma: PrismaClient |undefined;
}

const client = new PrismaClient();

export default client;