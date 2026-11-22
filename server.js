require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('node:path');

const app = express();
const port = Number(process.env.PORT || 3001);
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusfind';

const listingSchema = new mongoose.Schema({
  kind: { type: String, enum: ['lost', 'found'], required: true },
  title: { type: String, required: true, trim: true, maxlength: 80 },
  category: { type: String, required: true, trim: true, maxlength: 40 },
  description: { type: String, required: true, trim: true, maxlength: 600 },
  location: { type: String, required: true, trim: true, maxlength: 100 },
  date: { type: Date, required: true },
  status: { type: String, enum: ['open', 'resolved'], default: 'open' }
}, { timestamps: true });

const Listing = mongoose.model('Listing', listingSchema);
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.get('/api/listings', async (req, res, next) => {
  try {
    const filter = {};
    if (['lost', 'found'].includes(req.query.kind)) filter.kind = req.query.kind;
    if (req.query.status === 'open' || req.query.status === 'resolved') filter.status = req.query.status;
    const listings = await Listing.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    res.json(listings);
  } catch (error) { next(error); }
});

app.post('/api/listings', async (req, res, next) => {
  try {
    const allowed = ['kind', 'title', 'category', 'description', 'location', 'date'];
    const payload = Object.fromEntries(allowed.map(key => [key, req.body?.[key]]));
    const listing = await Listing.create(payload);
    res.status(201).json(listing);
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ error: 'Please check the required fields and try again.' });
    }
    next(error);
  }
});

app.patch('/api/listings/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid listing ID.' });
    if (!['open', 'resolved'].includes(req.body?.status)) return res.status(400).json({ error: 'Choose a valid status.' });
    const listing = await Listing.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });
    res.json(listing);
  } catch (error) { next(error); }
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found.' }));
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

mongoose.connect(mongoUri)
  .then(() => app.listen(port, () => console.log(`CampusFind is running at http://localhost:${port}`)))
  .catch(error => {
    console.error('Could not connect to MongoDB. Check that MongoDB is running and MONGODB_URI is correct.');
    console.error(error.message);
    process.exit(1);
  });


