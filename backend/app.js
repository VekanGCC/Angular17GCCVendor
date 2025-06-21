const express = require('express');
const app = express();
const adminRoutes = require('./routes/admin');
const vendorRoutes = require('./routes/vendor');
const clientRoutes = require('./routes/client');
const skillsRoutes = require('./routes/skills');

// Mount routers
app.use('/api/admin', adminRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/skills', skillsRoutes);

// ... existing code ... 