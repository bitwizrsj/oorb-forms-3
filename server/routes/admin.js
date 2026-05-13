import express from 'express';
import User from '../models/User.js';
import Form from '../models/Form.js';
import Response from '../models/Response.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Super Admin only.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

router.post('/make-me-admin', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { role: 'admin' },
      { new: true }
    );
    res.json({ message: 'Success! You are now a Super Admin.', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/analytics', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [totalUsers, totalForms, totalResponses, allForms] = await Promise.all([
      User.countDocuments(),
      Form.countDocuments(),
      Response.countDocuments(),
      Form.find({}, 'views viewsByCountry viewsByDate createdAt')
    ]);

    let totalViews = 0;
    const globalViewsByCountry = {};
    const globalViewsByDate = {};
    const globalFormsByDate = {};

    allForms.forEach(form => {
      totalViews += form.views || 0;
      
      const formDate = new Date(form.createdAt).toISOString().split('T')[0];
      globalFormsByDate[formDate] = (globalFormsByDate[formDate] || 0) + 1;

      if (form.viewsByDate) {
        for (const [date, count] of form.viewsByDate.entries()) {
          globalViewsByDate[date] = (globalViewsByDate[date] || 0) + count;
        }
      }

      if (form.viewsByCountry) {
        for (const [country, count] of form.viewsByCountry.entries()) {
          globalViewsByCountry[country] = (globalViewsByCountry[country] || 0) + count;
        }
      }
    });

    const chartData = Object.keys(globalViewsByDate).sort().map(date => ({
      date,
      views: globalViewsByDate[date],
      newForms: globalFormsByDate[date] || 0
    }));

    const countryData = Object.keys(globalViewsByCountry).map(country => ({
      name: country,
      value: globalViewsByCountry[country]
    })).sort((a, b) => b.value - a.value).slice(0, 10);

    res.json({
      totalUsers,
      totalForms,
      totalViews,
      totalResponses,
      chartData,
      countryData
    });
  } catch (error) {
    console.error('Admin route error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
