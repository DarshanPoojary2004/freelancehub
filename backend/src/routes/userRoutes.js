/**
 * User Routes
 * Profile management, Freelancer discovery, and Portfolio projects
 */

import express from 'express';
import { query } from '../config/database.js';
import { authenticateUser } from '../middleware/auth.js';
import { errorResponse, successResponse } from '../utils/responseHandler.js';

const router = express.Router();

// Helper to normalize array fields (skills, languages, frameworks, services)
const toArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    return val.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

/**
 * GET /api/users
 * List users (filter by accountType and search term)
 */
router.get('/', async (req, res) => {
  try {
    const { accountType, search } = req.query;

    let sql = `
      SELECT
        u.id, u.full_name, u.email, u.account_type, u.profile_title,
        u.bio, u.location, u.avatar_url, u.hourly_rate, u.availability,
        u.experience_years, u.skills, u.languages, u.frameworks, u.services,
        u.education, u.experience_history, u.created_at,
        (SELECT COUNT(*)::int FROM freelancer_projects fp WHERE fp.user_id = u.id) AS completed_projects_count
      FROM users u
      WHERE 1 = 1
    `;
    const params = [];

    if (accountType) {
      params.push(String(accountType).toLowerCase());
      sql += ` AND u.account_type = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      const pIndex = params.length;
      sql += ` AND (
        LOWER(u.full_name) LIKE $${pIndex} OR
        LOWER(u.profile_title) LIKE $${pIndex} OR
        LOWER(u.bio) LIKE $${pIndex} OR
        LOWER(u.location) LIKE $${pIndex} OR
        EXISTS (
          SELECT 1 FROM unnest(u.skills) s WHERE LOWER(s) LIKE $${pIndex}
        ) OR
        EXISTS (
          SELECT 1 FROM unnest(u.languages) l WHERE LOWER(l) LIKE $${pIndex}
        ) OR
        EXISTS (
          SELECT 1 FROM unnest(u.frameworks) f WHERE LOWER(f) LIKE $${pIndex}
        )
      )`;
    }

    sql += ' ORDER BY u.created_at DESC';

    const result = await query(sql, params);
    return successResponse(res, 200, 'Users fetched successfully', result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    return errorResponse(res, 500, 'Failed to fetch users', { detail: error.message });
  }
});

/**
 * GET /api/users/profile/me
 * Fetch current authenticated user's profile and showcase projects
 */
router.get('/profile/me', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const userResult = await query(
      `SELECT
        id, full_name, email, account_type, profile_title, bio, location,
        avatar_url, hourly_rate, availability, experience_years,
        skills, languages, frameworks, services, education, experience_history, created_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rowCount === 0) {
      return errorResponse(res, 404, 'User not found');
    }

    const user = userResult.rows[0];

    const projectsResult = await query(
      `SELECT * FROM freelancer_projects WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    user.projects = projectsResult.rows;

    return successResponse(res, 200, 'User profile fetched successfully', user);
  } catch (error) {
    console.error('Get me profile error:', error);
    return errorResponse(res, 500, 'Failed to fetch user profile', { detail: error.message });
  }
});

/**
 * GET /api/users/:id
 * Get single user profile + portfolio projects
 */
router.get('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return errorResponse(res, 400, 'Invalid user ID');
    }

    const userResult = await query(
      `SELECT
        id, full_name, email, account_type, profile_title, bio, location,
        avatar_url, hourly_rate, availability, experience_years,
        skills, languages, frameworks, services, education, experience_history, created_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rowCount === 0) {
      return errorResponse(res, 404, 'User not found');
    }

    const user = userResult.rows[0];

    const projectsResult = await query(
      `SELECT * FROM freelancer_projects WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    user.projects = projectsResult.rows;

    return successResponse(res, 200, 'User fetched successfully', user);
  } catch (error) {
    console.error('Get user by id error:', error);
    return errorResponse(res, 500, 'Failed to fetch user', { detail: error.message });
  }
});

/**
 * PUT /api/users/profile
 * Update authenticated user's profile
 */
router.put('/profile', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      full_name,
      profile_title,
      bio,
      location,
      avatar_url,
      hourly_rate,
      availability,
      experience_years,
      skills,
      languages,
      frameworks,
      services,
      education,
      experience_history
    } = req.body;

    const parsedEducation = typeof education === 'string' ? education : JSON.stringify(education || []);
    const parsedExperience = typeof experience_history === 'string' ? experience_history : JSON.stringify(experience_history || []);

    const result = await query(
      `UPDATE users
       SET
         full_name = COALESCE($1, full_name),
         profile_title = COALESCE($2, profile_title),
         bio = COALESCE($3, bio),
         location = COALESCE($4, location),
         avatar_url = COALESCE($5, avatar_url),
         hourly_rate = COALESCE($6, hourly_rate),
         availability = COALESCE($7, availability),
         experience_years = COALESCE($8, experience_years),
         skills = COALESCE($9, skills),
         languages = COALESCE($10, languages),
         frameworks = COALESCE($11, frameworks),
         services = COALESCE($12, services),
         education = $13::jsonb,
         experience_history = $14::jsonb
       WHERE id = $15
       RETURNING
         id, full_name, email, account_type, profile_title, bio, location,
         avatar_url, hourly_rate, availability, experience_years,
         skills, languages, frameworks, services, education, experience_history, created_at`,
      [
        full_name?.trim() || null,
        profile_title?.trim() || null,
        bio !== undefined ? bio : null,
        location?.trim() || null,
        avatar_url !== undefined ? avatar_url : null,
        hourly_rate?.trim() || null,
        availability?.trim() || null,
        experience_years !== undefined ? parseInt(experience_years, 10) || 0 : null,
        skills ? toArray(skills) : null,
        languages ? toArray(languages) : null,
        frameworks ? toArray(frameworks) : null,
        services ? toArray(services) : null,
        parsedEducation,
        parsedExperience,
        userId
      ]
    );

    if (result.rowCount === 0) {
      return errorResponse(res, 404, 'User not found');
    }

    const updatedUser = result.rows[0];

    const projectsResult = await query(
      `SELECT * FROM freelancer_projects WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    updatedUser.projects = projectsResult.rows;

    return successResponse(res, 200, 'Profile updated successfully', updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    return errorResponse(res, 500, 'Failed to update profile', { detail: error.message });
  }
});

/**
 * POST /api/users/projects
 * Add a showcase project for the authenticated freelancer
 */
router.post('/projects', authenticateUser, async (req, res) => {
  try {
    if (req.user.role !== 'freelancer') {
      return errorResponse(res, 403, 'Only Freelancers can add portfolio showcase projects.');
    }

    const userId = req.user.id;
    const { title, description, technologies, role, project_url, github_url } = req.body;

    if (!title || !title.trim()) {
      return errorResponse(res, 400, 'Project title is required');
    }

    const result = await query(
      `INSERT INTO freelancer_projects (user_id, title, description, technologies, role, project_url, github_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        title.trim(),
        description || '',
        toArray(technologies),
        role || 'Lead Developer',
        project_url || '',
        github_url || ''
      ]
    );

    return successResponse(res, 201, 'Project added successfully', result.rows[0]);
  } catch (error) {
    console.error('Add showcase project error:', error);
    return errorResponse(res, 500, 'Failed to add project', { detail: error.message });
  }
});

/**
 * PUT /api/users/projects/:projectId
 * Update a showcase project
 */
router.put('/projects/:projectId', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.projectId, 10);
    const { title, description, technologies, role, project_url, github_url } = req.body;

    const result = await query(
      `UPDATE freelancer_projects
       SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         technologies = COALESCE($3, technologies),
         role = COALESCE($4, role),
         project_url = COALESCE($5, project_url),
         github_url = COALESCE($6, github_url)
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [
        title?.trim() || null,
        description !== undefined ? description : null,
        technologies ? toArray(technologies) : null,
        role?.trim() || null,
        project_url !== undefined ? project_url : null,
        github_url !== undefined ? github_url : null,
        projectId,
        userId
      ]
    );

    if (result.rowCount === 0) {
      return errorResponse(res, 404, 'Project not found or unauthorized');
    }

    return successResponse(res, 200, 'Project updated successfully', result.rows[0]);
  } catch (error) {
    console.error('Update showcase project error:', error);
    return errorResponse(res, 500, 'Failed to update project', { detail: error.message });
  }
});

/**
 * DELETE /api/users/projects/:projectId
 * Delete a showcase project
 */
router.delete('/projects/:projectId', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.projectId, 10);

    const result = await query(
      `DELETE FROM freelancer_projects WHERE id = $1 AND user_id = $2 RETURNING id`,
      [projectId, userId]
    );

    if (result.rowCount === 0) {
      return errorResponse(res, 404, 'Project not found or unauthorized');
    }

    return successResponse(res, 200, 'Project removed successfully', { id: projectId });
  } catch (error) {
    console.error('Delete showcase project error:', error);
    return errorResponse(res, 500, 'Failed to delete project', { detail: error.message });
  }
});

export default router;
