/**
 * Project Routes
 * Posting jobs, fetching listings, search/filters, and project proposals
 */

import express from 'express';
import { query } from '../config/database.js';
import { authenticateUser } from '../middleware/auth.js';
import { errorResponse, successResponse } from '../utils/responseHandler.js';

const router = express.Router();

const toArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    return val.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

/**
 * GET /api/projects
 * List all projects with optional category filter and keyword search
 */
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;

    let sql = `
      SELECT
        p.id, p.client_id, p.title, p.description, p.category,
        p.budget, p.client_name, p.skills_required, p.status, p.posted_at,
        (SELECT COUNT(*)::int FROM proposals pr WHERE pr.project_id = p.id) AS proposals_count
      FROM projects p
      WHERE 1 = 1
    `;
    const params = [];

    if (category && category.trim() && category.toLowerCase() !== 'all') {
      params.push(category.trim());
      sql += ` AND LOWER(p.category) = LOWER($${params.length})`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      const pIndex = params.length;
      sql += ` AND (
        LOWER(p.title) LIKE $${pIndex} OR
        LOWER(p.description) LIKE $${pIndex} OR
        LOWER(p.client_name) LIKE $${pIndex} OR
        EXISTS (
          SELECT 1 FROM unnest(p.skills_required) s WHERE LOWER(s) LIKE $${pIndex}
        )
      )`;
    }

    sql += ' ORDER BY p.posted_at DESC';

    const result = await query(sql, params);
    return successResponse(res, 200, 'Projects fetched successfully', result.rows);
  } catch (error) {
    console.error('Get projects error:', error);
    return errorResponse(res, 500, 'Failed to fetch projects', { detail: error.message });
  }
});

/**
 * GET /api/projects/client/my
 * Get projects posted by the currently authenticated client
 */
router.get('/client/my', authenticateUser, async (req, res) => {
  try {
    const clientId = req.user.id;

    const result = await query(
      `SELECT
        p.*,
        (SELECT COUNT(*)::int FROM proposals pr WHERE pr.project_id = p.id) AS proposals_count
       FROM projects p
       WHERE p.client_id = $1
       ORDER BY p.posted_at DESC`,
      [clientId]
    );

    return successResponse(res, 200, 'Client projects fetched successfully', result.rows);
  } catch (error) {
    console.error('Get client projects error:', error);
    return errorResponse(res, 500, 'Failed to fetch client projects', { detail: error.message });
  }
});

/**
 * GET /api/projects/:id
 * Get single project by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) {
      return errorResponse(res, 400, 'Invalid project ID');
    }

    const result = await query(
      `SELECT
        p.*,
        u.full_name AS client_user_name,
        u.email AS client_email,
        (SELECT COUNT(*)::int FROM proposals pr WHERE pr.project_id = p.id) AS proposals_count
       FROM projects p
       LEFT JOIN users u ON u.id = p.client_id
       WHERE p.id = $1`,
      [projectId]
    );

    if (result.rowCount === 0) {
      return errorResponse(res, 404, 'Project not found');
    }

    return successResponse(res, 200, 'Project fetched successfully', result.rows[0]);
  } catch (error) {
    console.error('Get project by id error:', error);
    return errorResponse(res, 500, 'Failed to fetch project', { detail: error.message });
  }
});

/**
 * POST /api/projects
 * Post a new project (Client only)
 */
router.post('/', authenticateUser, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return errorResponse(res, 403, 'Only Client accounts can post projects.');
    }

    const clientId = req.user.id;
    const { title, description, category, budget, skills_required } = req.body;

    if (!title || !description || !category || !budget) {
      return errorResponse(res, 400, 'Title, description, category, and budget are required');
    }

    // Get client name
    const clientUser = await query('SELECT full_name FROM users WHERE id = $1', [clientId]);
    const clientName = clientUser.rows[0]?.full_name || req.user.name || 'Client';

    const result = await query(
      `INSERT INTO projects (client_id, title, description, category, budget, client_name, skills_required, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        clientId,
        title.trim(),
        description.trim(),
        category.trim(),
        budget.trim(),
        clientName,
        toArray(skills_required),
        'Open'
      ]
    );

    return successResponse(res, 201, 'Project created successfully', result.rows[0]);
  } catch (error) {
    console.error('Create project error:', error);
    return errorResponse(res, 500, 'Failed to create project', { detail: error.message });
  }
});

/**
 * POST /api/projects/:id/proposals
 * Submit proposal for a project (Freelancer only)
 */
router.post('/:id/proposals', authenticateUser, async (req, res) => {
  try {
    if (req.user.role !== 'freelancer') {
      return errorResponse(res, 403, 'Only Freelancer accounts can submit proposals.');
    }

    const freelancerId = req.user.id;
    const projectId = parseInt(req.params.id, 10);
    const { cover_letter, bid_amount, estimated_days } = req.body;

    if (isNaN(projectId)) {
      return errorResponse(res, 400, 'Invalid project ID');
    }

    if (!cover_letter || !cover_letter.trim()) {
      return errorResponse(res, 400, 'Cover letter is required');
    }

    if (!bid_amount || !bid_amount.trim()) {
      return errorResponse(res, 400, 'Bid amount is required');
    }

    // Check if project exists
    const projectCheck = await query('SELECT id, status FROM projects WHERE id = $1', [projectId]);
    if (projectCheck.rowCount === 0) {
      return errorResponse(res, 404, 'Project not found');
    }

    // Check if freelancer already applied
    const existing = await query(
      'SELECT id FROM proposals WHERE project_id = $1 AND freelancer_id = $2',
      [projectId, freelancerId]
    );

    if (existing.rowCount > 0) {
      return errorResponse(res, 409, 'You have already submitted a proposal for this project');
    }

    const result = await query(
      `INSERT INTO proposals (project_id, freelancer_id, cover_letter, bid_amount, estimated_days, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        projectId,
        freelancerId,
        cover_letter.trim(),
        bid_amount.trim(),
        parseInt(estimated_days, 10) || 7,
        'Pending'
      ]
    );

    return successResponse(res, 201, 'Proposal submitted successfully', result.rows[0]);
  } catch (error) {
    console.error('Submit proposal error:', error);
    return errorResponse(res, 500, 'Failed to submit proposal', { detail: error.message });
  }
});

/**
 * GET /api/projects/:id/proposals
 * Get all proposals for a project (Project owner only)
 */
router.get('/:id/proposals', authenticateUser, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) {
      return errorResponse(res, 400, 'Invalid project ID');
    }

    const result = await query(
      `SELECT
        pr.*,
        u.full_name AS freelancer_name,
        u.email AS freelancer_email,
        u.profile_title AS freelancer_title,
        u.avatar_url AS freelancer_avatar,
        u.location AS freelancer_location,
        u.skills AS freelancer_skills
       FROM proposals pr
       JOIN users u ON u.id = pr.freelancer_id
       WHERE pr.project_id = $1
       ORDER BY pr.created_at DESC`,
      [projectId]
    );

    return successResponse(res, 200, 'Proposals fetched successfully', result.rows);
  } catch (error) {
    console.error('Get project proposals error:', error);
    return errorResponse(res, 500, 'Failed to fetch proposals', { detail: error.message });
  }
});

export default router;
