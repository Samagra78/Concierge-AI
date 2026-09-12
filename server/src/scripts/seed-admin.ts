import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db';
import { User } from '../models/User';
// Require keeps the client demo data as the seed source without pulling client files into server tsc's rootDir.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {
  initialTravelerDNA, initialTripOverview, initialUserProfile,
  initialPastTrips, initialItineraryDays, smartDiscoveryPlaces,
} = require('../../../client/src/data/mockData.ts');

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminName = process.env.ADMIN_NAME?.trim() || email?.split('@')[0].split(/[._-]/)[0].replace(/^./, (letter) => letter.toUpperCase());
  const password = process.env.ADMIN_PASSWORD;
  if (!email) throw new Error('Set ADMIN_EMAIL in the root .env before seeding.');
  if (!password) throw new Error('Set ADMIN_PASSWORD in the root .env before seeding.');
  if (password.length < 6) throw new Error('ADMIN_PASSWORD must be at least 6 characters.');
  const db = await connectDB();
  if (!db) throw new Error('MongoDB is unavailable; admin seed was not written.');
  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email, name: adminName || initialUserProfile.name,
        passwordHash: await bcrypt.hash(password, 10),
      });
    }
    user.passwordHash = await bcrypt.hash(password, 10);
    user.name = adminName || initialUserProfile.name;
    user.role = 'admin';
    user.onboardingCompleted = true;
    user.preferences = initialTravelerDNA as unknown as Record<string, unknown>;
    user.budgetDefaults = { maxBudget: initialTripOverview.totalBudget, currency: 'INR' };
    user.workspace = {
      userProfile: { ...initialUserProfile, name: user.name, avatarUrl: '' },
      tripOverview: initialTripOverview,
      itineraryDays: initialItineraryDays,
      pastTrips: initialPastTrips,
      discoveredPlaces: smartDiscoveryPlaces,
    };
    await user.save();
    console.log(`Admin account ready: ${email}`);
  } finally {
    await disconnectDB();
  }
}

seedAdmin().catch(async (error) => {
  console.error(`Admin seed failed: ${(error as Error).message}`);
  await disconnectDB();
  process.exitCode = 1;
});
