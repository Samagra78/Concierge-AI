import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { requireAuth, signAuthToken, setAuthCookie, clearAuthCookie } from '../middleware/auth';

const router = Router();

const serializeUser = (user: any) => ({
  id: user._id,
  email: user.email,
  name: user.name,
  phoneNumber: user.phoneNumber || '',
  homeCity: user.homeCity || '',
  countryOfResidence: user.countryOfResidence || '',
  preferredCurrency: user.preferredCurrency || 'INR',
  timezone: user.timezone || '',
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  role: user.role,
  onboardingCompleted: user.onboardingCompleted,
  preferences: user.preferences,
  workspace: user.workspace,
  language: user.language,
  budgetDefaults: user.budgetDefaults,
  defaultAddresses: user.defaultAddresses,
});

// POST /auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, language, phoneNumber, homeCity, countryOfResidence, timezone } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ success: false, error: 'Email, password, and name are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      res.status(409).json({ success: false, error: 'An account with this email already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      name: name.trim(),
      phoneNumber: typeof phoneNumber === 'string' ? phoneNumber.trim() : undefined,
      homeCity: typeof homeCity === 'string' ? homeCity.trim() : undefined,
      countryOfResidence: typeof countryOfResidence === 'string' ? countryOfResidence.trim() : undefined,
      timezone: typeof timezone === 'string' ? timezone.trim() : undefined,
      preferredCurrency: 'INR',
      lastLoginAt: new Date(),
      language: language || 'en',
      budgetDefaults: { currency: 'INR' },
      role: 'user',
      onboardingCompleted: false,
    });

    const token = signAuthToken({
      userId: newUser._id.toString(),
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    });

    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      user: serializeUser(newUser),
      token, // Also return in body for clients that prefer Bearer token
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    user.lastLoginAt = new Date();
    await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: user.lastLoginAt } });

    const token = signAuthToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    setAuthCookie(res, token);

    res.json({
      success: true,
      user: serializeUser(user),
      token,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /auth/logout
router.post('/logout', (_req: Request, res: Response): void => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /auth/me
router.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId).select('-passwordHash');
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      user: serializeUser(user),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.patch('/preferences', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const preferences = req.body?.preferences;
    if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)) {
      res.status(400).json({ success: false, error: 'A preferences object is required' });
      return;
    }
    const { budgetPerDay, luxuryLevel, maxDailyWalkKm, earliestWakeTime, crowdTolerance, interests, lifestyleRules } = preferences;
    if (!Number.isFinite(budgetPerDay) || !Number.isFinite(luxuryLevel) || !Number.isFinite(maxDailyWalkKm) || typeof earliestWakeTime !== 'string' || !['Low', 'Medium', 'High'].includes(crowdTolerance) || !Array.isArray(interests) || !lifestyleRules || typeof lifestyleRules !== 'object') {
      res.status(400).json({ success: false, error: 'Preferences are incomplete or invalid' });
      return;
    }
    const user = await User.findByIdAndUpdate(
      req.user?.userId,
      { $set: { preferences, onboardingCompleted: true, 'budgetDefaults.currency': 'INR' } },
      { new: true, runValidators: true }
    ).select('-passwordHash');
    if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }
    res.json({ success: true, user: serializeUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.patch('/profile', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const allowed = ['name', 'phoneNumber', 'homeCity', 'countryOfResidence', 'preferredCurrency'] as const;
    const updates: Record<string, string> = {};
    for (const field of allowed) {
      const value = req.body?.[field];
      if (value === undefined) continue;
      if (typeof value !== 'string') {
        res.status(400).json({ success: false, error: `Invalid ${field}.` });
        return;
      }
      updates[field] = value.trim();
    }
    if (!Object.keys(updates).length || (updates.name !== undefined && !updates.name)) {
      res.status(400).json({ success: false, error: 'Provide a valid profile field to update.' });
      return;
    }
    if (updates.preferredCurrency && updates.preferredCurrency.toUpperCase() !== 'INR') {
      res.status(400).json({ success: false, error: 'Only INR is currently supported.' });
      return;
    }
    if (updates.preferredCurrency) updates.preferredCurrency = 'INR';
    const user = await User.findByIdAndUpdate(req.user?.userId, { $set: updates }, { new: true, runValidators: true });
    if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }
    res.json({ success: true, user: serializeUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.patch('/workspace', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { tripOverview, itineraryDays, expenses, tripPages, activeTripId, pastTrips } = req.body || {};
    const workspaceUpdates: Record<string, unknown> = {};
    if (tripOverview && typeof tripOverview === 'object') workspaceUpdates['workspace.tripOverview'] = tripOverview;
    if (Array.isArray(itineraryDays)) workspaceUpdates['workspace.itineraryDays'] = itineraryDays;
    if (Array.isArray(expenses)) workspaceUpdates['workspace.expenses'] = expenses;
    if (Array.isArray(tripPages)) workspaceUpdates['workspace.tripPages'] = tripPages;
    if (activeTripId === null || typeof activeTripId === 'string') workspaceUpdates['workspace.activeTripId'] = activeTripId;
    if (Array.isArray(pastTrips)) workspaceUpdates['workspace.pastTrips'] = pastTrips;
    if (!Object.keys(workspaceUpdates).length) {
      res.status(400).json({ success: false, error: 'Provide trip details, itinerary days, or an expense ledger to save.' });
      return;
    }
    const user = await User.findByIdAndUpdate(
      req.user?.userId,
      { $set: workspaceUpdates },
      { new: true, runValidators: true }
    ).select('-passwordHash');
    if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }
    res.json({ success: true, workspace: user.workspace });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
