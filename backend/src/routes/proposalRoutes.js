/**
 * Proposal Routes
 * Listing submitted proposals and accepting/rejecting proposals
 */

import express from 'express';
import { query } from '../config/database.js';
import { authenticateUser } from '../middleware/auth.js';
import { errorResponse, successResponse } from '../utils/responseHandler.js';

const router = express.Router();

/**
 * GET /api/proposals/freelancer
 * Fetch all proposals submitted by the authenticated freelancer
 */
router.get('/freelancer', authenticateUser, async (req, res) => {
  try {
    if (req.user.role !== 'freelancer') {
      return errorResponse(res, 403, 'Only Freelancers can view submitted proposals.');
    }

    const freelancerId = req.user.id;

    const result = await query(
      `SELECT
        pr.*,
        p.title AS project_title,
        p.category AS project_category,
        p.budget AS project_budget,
        p.client_name AS project_client_name,
        p.status AS project_status
       FROM proposals pr
       JOIN projects p ON p.id = pr.project_id
       WHERE pr.freelancer_id = $1
       ORDER BY pr.created_at DESC`,
      [freelancerId]
    );

    return successResponse(res, 200, 'Proposals fetched successfully', result.rows);
  } catch (error) {
    console.error('Get freelancer proposals error:', error);
    return errorResponse(res, 500, 'Failed to fetch proposals', { detail: error.message });
  }
});

/**
 * PATCH /api/proposals/:id/status
 * Project owner updates status of a proposal (Accepted / Rejected)
 */
router.patch('/:id/status', authenticateUser, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return errorResponse(res, 403, 'Only Client project owners can accept or decline proposals.');
    }

    const clientId = req.user.id;
    const proposalId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (!['Accepted', 'Rejected'].includes(status)) {
      return errorResponse(res, 400, 'Status must be either "Accepted" or "Rejected"');
    }

    // Verify client owns the project for this proposal
    const proposalCheck = await query(
      `SELECT pr.id, pr.project_id, p.client_id
       FROM proposals pr
       JOIN projects p ON p.id = pr.project_id
       WHERE pr.id = $1`,
      [proposalId]
    );

    if (proposalCheck.rowCount === 0) {
      return errorResponse(res, 404, 'Proposal not found');
    }

    const proposal = proposalCheck.rows[0];
    if (proposal.client_id && proposal.client_id !== clientId) {
      return errorResponse(res, 403, 'Unauthorized to update this proposal');
    }

    const result = await query(
      `UPDATE proposals SET status = $1 WHERE id = $2 RETURNING *`,
      [status, proposalId]
    );

    return successResponse(res, 200, `Proposal ${status.toLowerCase()} successfully`, result.rows[0]);
  } catch (error) {
    console.error('Update proposal status error:', error);
    return errorResponse(res, 500, 'Failed to update proposal status', { detail: error.message });
  }
});

export default router;
