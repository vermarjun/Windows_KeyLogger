import express from 'express';
import { 
  getAllClients, 
  getClientById, 
  getClientDailyData, 
  getClientAllDailyData,
  createClient,
  updateClient,
  updateClientConfig,
  deleteClient,
  getClientStats,
  getClientMonthlyData,
  getAllClientsMonthlyData
} from '../controllers/clientController.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get all clients for the authenticated user
router.get('/', getAllClients);

// Create a new client
router.post('/', createClient);

// Get a specific client by ID
router.get('/:clientId', getClientById);

// Get client statistics/summary
router.get('/:clientId/stats', getClientStats);

// Get all daily data for a specific client
router.get('/:clientId/daily', getClientAllDailyData);

// Get client daily data for a specific date
router.get('/:clientId/daily/:date', getClientDailyData);

// Get client monthly data for calendar view (with pagination)
router.get('/:clientId/monthly/:year/:month', getClientMonthlyData);

// Update a client profile
router.put('/:clientId', updateClient);

// Update client config and tags
router.put('/:clientId/config', updateClientConfig);

// Delete a client profile
router.delete('/:clientId', deleteClient);

// Calendar routes (for all clients)
// Get all clients with monthly summary for calendar view
router.get('/calendar/:year/:month', getAllClientsMonthlyData);

export default router; 