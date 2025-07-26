import ClientProfile from '../models/ClientProfile.js';
import ClientDaily from '../models/ClientDaily.js';

// Get all clients for the authenticated user
export const getUserClients = async (req, res) => {
  try {
    const clients = await ClientProfile.find({ Daddy: req.userId });
    return res.status(200).json(clients);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get a specific client by ID (only if owned by the user)
export const getClientById = async (req, res) => {
  try {
    const { clientId } = req.params;
    const client = await ClientProfile.findOne({ 
      _id: clientId, 
      Daddy: req.userId 
    });
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found or access denied.' });
    }
    
    return res.status(200).json(client);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get client daily data for a specific date
export const getClientDailyData = async (req, res) => {
  try {
    const { clientId, date } = req.params;
    
    // First verify the client belongs to the user
    const client = await ClientProfile.findOne({ 
      _id: clientId, 
      Daddy: req.userId 
    });
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found or access denied.' });
    }
    
    // Get daily data for the specified date
    const dailyData = await ClientDaily.findOne({ 
      clientId: clientId, 
      date: date 
    });
    
    if (!dailyData) {
      return res.status(404).json({ message: 'No data found for this date.' });
    }
    
    return res.status(200).json(dailyData);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all daily data for a specific client
export const getClientAllDailyData = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    // First verify the client belongs to the user
    const client = await ClientProfile.findOne({ 
      _id: clientId, 
      Daddy: req.userId 
    });
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found or access denied.' });
    }
    
    // Get all daily data for the client
    const dailyData = await ClientDaily.find({ clientId: clientId }).sort({ date: -1 });
    
    return res.status(200).json(dailyData);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Create a new client profile
export const createClient = async (req, res) => {
  try {
    const { deviceName, display_name, tags, location, system_info } = req.body;
    
    if (!deviceName) {
      return res.status(400).json({ message: 'Device name is required.' });
    }
    
    const client = new ClientProfile({
      deviceName,
      display_name,
      tags,
      location,
      system_info,
      Daddy: req.userId
    });
    
    await client.save();
    return res.status(201).json(client);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update a client profile
export const updateClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    const updates = req.body;
    
    // Remove Daddy from updates to prevent ownership change
    delete updates.Daddy;
    
    const client = await ClientProfile.findOneAndUpdate(
      { _id: clientId, Daddy: req.userId },
      updates,
      { new: true }
    );
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found or access denied.' });
    }
    
    return res.status(200).json(client);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete a client profile
export const deleteClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const client = await ClientProfile.findOneAndDelete({ 
      _id: clientId, 
      Daddy: req.userId 
    });
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found or access denied.' });
    }
    
    // Also delete all associated daily data
    await ClientDaily.deleteMany({ clientId: clientId });
    
    return res.status(200).json({ message: 'Client and associated data deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get client statistics/summary
export const getClientStats = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    // First verify the client belongs to the user
    const client = await ClientProfile.findOne({ 
      _id: clientId, 
      Daddy: req.userId 
    });
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found or access denied.' });
    }
    
    // Get basic stats
    const totalDailyRecords = await ClientDaily.countDocuments({ clientId: clientId });
    const latestDailyRecord = await ClientDaily.findOne({ clientId: clientId }).sort({ date: -1 });
    
    const stats = {
      client: client,
      totalDailyRecords,
      latestActivity: latestDailyRecord ? latestDailyRecord.date : null,
      lastSeen: client.last_seen
    };
    
    return res.status(200).json(stats);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 

// Get client daily data for a specific month (calendar view)
export const getClientMonthlyData = async (req, res) => {
  try {
    const { clientId, year, month } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // Validate year and month
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ message: 'Invalid year or month format.' });
    }
    
    // First verify the client belongs to the user
    const client = await ClientProfile.findOne({ 
      _id: clientId, 
      Daddy: req.userId 
    });
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found or access denied.' });
    }
    
    // Create date range for the month
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0); // Last day of the month
    
    // Format dates as strings for comparison (assuming date format is YYYY-MM-DD)
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get daily data for the month with pagination
    const dailyData = await ClientDaily.find({ 
      clientId: clientId,
      date: { 
        $gte: startDateStr, 
        $lte: endDateStr 
      }
    })
    .sort({ date: 1 })
    .skip(skip)
    .limit(parseInt(limit))
    .select('date total_active_time_ms total_sessions total_words_typed total_keystrokes cognitive_behavior content_stats last_updated');
    
    // Get total count for pagination
    const totalCount = await ClientDaily.countDocuments({ 
      clientId: clientId,
      date: { 
        $gte: startDateStr, 
        $lte: endDateStr 
      }
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;
    
    // Get summary stats for the month
    const monthlyStats = await ClientDaily.aggregate([
      {
        $match: {
          clientId: clientId,
          date: { $gte: startDateStr, $lte: endDateStr }
        }
      },
      {
        $group: {
          _id: null,
          totalActiveTime: { $sum: '$total_active_time_ms' },
          totalSessions: { $sum: '$total_sessions' },
          totalWordsTyped: { $sum: '$total_words_typed' },
          totalKeystrokes: { $sum: '$total_keystrokes' },
          activeDays: { $sum: 1 },
          avgTypingSpeed: { $avg: '$cognitive_behavior.avg_typing_speed_wpm' },
          maxTypingSpeed: { $max: '$cognitive_behavior.peak_typing_speed_wpm' }
        }
      }
    ]);
    
    const response = {
      client: {
        _id: client._id,
        deviceName: client.deviceName,
        display_name: client.display_name
      },
      month: {
        year: yearNum,
        month: monthNum,
        startDate: startDateStr,
        endDate: endDateStr
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      },
      monthlyStats: monthlyStats[0] || {
        totalActiveTime: 0,
        totalSessions: 0,
        totalWordsTyped: 0,
        totalKeystrokes: 0,
        activeDays: 0,
        avgTypingSpeed: 0,
        maxTypingSpeed: 0
      },
      dailyData
    };
    
    return res.status(200).json(response);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all clients with their monthly summary for calendar view
export const getAllClientsMonthlyData = async (req, res) => {
  try {
    const { year, month } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    // Validate year and month
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ message: 'Invalid year or month format.' });
    }
    
    // Create date range for the month
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get all clients for the user
    const clients = await ClientProfile.find({ Daddy: req.userId })
      .skip(skip)
      .limit(parseInt(limit))
      .select('_id deviceName display_name last_seen total_sessions');
    
    // Get total count for pagination
    const totalCount = await ClientProfile.countDocuments({ Daddy: req.userId });
    
    // Get monthly summary for each client
    const clientsWithMonthlyData = await Promise.all(
      clients.map(async (client) => {
        const monthlyData = await ClientDaily.aggregate([
          {
            $match: {
              clientId: client._id,
              date: { $gte: startDateStr, $lte: endDateStr }
            }
          },
          {
            $group: {
              _id: null,
              totalActiveTime: { $sum: '$total_active_time_ms' },
              totalSessions: { $sum: '$total_sessions' },
              totalWordsTyped: { $sum: '$total_words_typed' },
              totalKeystrokes: { $sum: '$total_keystrokes' },
              activeDays: { $sum: 1 },
              avgTypingSpeed: { $avg: '$cognitive_behavior.avg_typing_speed_wpm' },
              maxTypingSpeed: { $max: '$cognitive_behavior.peak_typing_speed_wpm' }
            }
          }
        ]);
        
        return {
          client: {
            _id: client._id,
            deviceName: client.deviceName,
            display_name: client.display_name,
            last_seen: client.last_seen,
            total_sessions: client.total_sessions
          },
          monthlyData: monthlyData[0] || {
            totalActiveTime: 0,
            totalSessions: 0,
            totalWordsTyped: 0,
            totalKeystrokes: 0,
            activeDays: 0,
            avgTypingSpeed: 0,
            maxTypingSpeed: 0
          }
        };
      })
    );
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;
    
    const response = {
      month: {
        year: yearNum,
        month: monthNum,
        startDate: startDateStr,
        endDate: endDateStr
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      },
      clients: clientsWithMonthlyData
    };
    
    return res.status(200).json(response);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 