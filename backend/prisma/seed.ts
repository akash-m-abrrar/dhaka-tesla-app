import { prisma } from "../src/config/database.js";
import { ZoneType } from "../src/generated/prisma/client.js";

const INITIAL_ZONES = [
  {
    name: "Uttara Sector 3 Hub",
    type: ZoneType.POINT,
    latitude: 23.8698,
    longitude: 90.3996,
  },
  {
    name: "Gulshan 2 Circle",
    type: ZoneType.POINT,
    latitude: 23.7925,
    longitude: 90.4167,
  },
  {
    name: "Banani Commercial Area",
    type: ZoneType.AREA,
    latitude: 23.7937,
    longitude: 90.4047,
  },
  {
    name: "Dhanmondi 27",
    type: ZoneType.AREA,
    latitude: 23.7542,
    longitude: 90.3766,
  },
  {
    name: "Motijheel Commercial Zone",
    type: ZoneType.AREA,
    latitude: 23.733,
    longitude: 90.4172,
  },
  {
    name: "Dhaka Airport Express Station",
    type: ZoneType.POINT,
    latitude: 23.8513,
    longitude: 90.4077,
  },
] as const;

async function main(): Promise<void> {
  console.log("Seeding baseline zone data...");

  for (const zone of INITIAL_ZONES) {
    const result = await prisma.zone.upsert({
      where: { name: zone.name },
      update: {
        type: zone.type,
        latitude: zone.latitude,
        longitude: zone.longitude,
      },
      create: {
        name: zone.name,
        type: zone.type,
        latitude: zone.latitude,
        longitude: zone.longitude,
      },
    });
    console.log(`Seeded zone: ${result.name} (${result.type})`);
  }

  console.log("Zone seeding completed successfully.");
}

main()
  .catch((e: unknown) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
