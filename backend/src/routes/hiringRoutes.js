/**
 * Hiring Requests Routes
 * Direct client-to-freelancer hiring requests and accept/reject flow
 */

import express from 'express';
import { query } from '../config/database.js';
import { authenticateUser } from '../middleware/auth.js';
import { errorResponse, successResponse } from '../utils/responseHandler.js';

const router = express.Router();

/**
 * POST /api/hiring-requests
 * Client sends a direct hiring offer to a freelancer
 */
router.post('/', authenticateUser, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return errorResponse(res, 403, 'Only Client accounts can send direct hiring offers.');
    }

    const clientId = req.user.id;
    const { freelancer_id, project_title, message, budget } = req.body;

    if (!freelancer_id) {
      return errorResponse(res, 400, 'Freelancer ID is required');
    }

    if (!project_title || !project_title.trim()) {
      return errorResponse(res, 400, 'Project title is required');
    }

    if (!message || !message.trim()) {
      return errorResponse(res, 400, 'Message is required');
    }

    if (!budget || !budget.trim()) {
      return errorResponse(res, 400, 'Budget is required');
    }

    // Verify freelancer exists and is indeed a freelancer
    const freelancerCheck = await query(
      "SELECT id, full_name, email, account_type FROM users WHERE id = $1 AND account_type = 'freelancer'",
      [freelancer_id]
    );

    if (freelancerCheck.rowCount === 0) {
      return errorResponse(res, 404, 'Freelancer not found or is not a freelancer account');
    }

    const result = await query(
      `INSERT INTO hiring_requests (client_id, freelancer_id, project_title, message, budget, status)
       VALUES ($1, $2, $3, $4, $5, 'Pending')
       RETURNING *`,
      [clientId, freelancer_id, project_title.trim(), message.trim(), budget.trim()]
    );

    return successResponse(res, 201, 'Hiring request sent successfully', result.rows[0]);
  } catch (error) {
    console.error('Create hiring request error:', error);
    return errorResponse(res, 500, 'Failed to send hiring request', { detail: error.message });
  }
});

/**
 * GET /api/hiring-requests/freelancer
 * Incoming hiring requests for the authenticated freelancer
 */
router.get('/freelancer', authenticateUser, async (req, res) => {
  try {
    if (req.user.role !== 'freelancer') {
      return errorResponse(res, 403, 'Only Freelancers can view incoming offers.');
    }

    const freelancerId = req.user.id;

    const result = await query(
      `SELECT
        hr.*,
        u.full_name AS client_name,
        u.email AS client_email,
        u.location AS client_location
       FROM hiring_requests hr
       JOIN users u ON u.id = hr.client_id
       WHERE hr.freelancer_id = $1
       ORDER BY hr.created_at DESC`,
      [freelancerId]
    );

    return successResponse(res, 200, 'Hiring requests fetched successfully', result.rows);
  } catch (error) {
    console.error('Get freelancer hiring requests error:', error);
    return errorResponse(res, 500, 'Failed to fetch hiring requests', { detail: error.message });
  }
});

/**
 * GET /api/hiring-requests/client
 * Outgoing hiring requests sent by the authenticated client
 */
router.get('/client', authenticateUser, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return errorResponse(res, 403, 'Only Clients can view sent hiring offers.');
    }

    const clientId = req.user.id;

    const result = await query(
      `SELECT
        hr.*,
        u.full_name AS freelancer_name,
        u.email AS freelancer_email,
        u.profile_title AS freelancer_title,
        u.avatar_url AS freelancer_avatar,
        u.location AS freelancer_location
       FROM hiring_requests hr
       JOIN users u ON u.id = hr.freelancer_id
       WHERE hr.client_id = $1
       ORDER BY hr.created_at DESC`,
      [clientId]
    );

    return successResponse(res, 200, 'Sent hiring requests fetched successfully', result.rows);
  } catch (error) {
    console.error('Get client hiring requests error:', error);
    return errorResponse(res, 500, 'Failed to fetch sent hiring requests', { detail: error.message });
  }
});

/**
 * PATCH /api/hiring-requests/:id/status
 * Freelancer updates status of hiring request (Accepted / Rejected)
 */
router.patch('/:id/status', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const requestId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (!['Accepted', 'Rejected'].includes(status)) {
      return errorResponse(res, 400, 'Status must be either "Accepted" or "Rejected"');
    }

    const result = await query(
      `UPDATE hiring_requests
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND (freelancer_id = $3 OR client_id = $3)
       RETURNING *`,
      [status, requestId, userId]
    );

    if (result.rowCount === 0) {
      return errorResponse(res, 404, 'Hiring request not found or unauthorized');
    }

    return successResponse(res, 200, `Hiring request ${status.toLowerCase()} successfully`, result.rows[0]);
  } catch (error) {
    console.error('Update hiring request status error:', error);
    return errorResponse(res, 500, 'Failed to update hiring request status', { detail: error.message });
  }
});

export default router;
