
-- =====================================================
-- Smart Task Manager
-- Migration 002: Role-based permissions and project membership
-- =====================================================

BEGIN;

-- 1. Add roles to users.
-- Existing users and new users default to Team Member.
ALTER TABLE users
ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'Team Member';

-- Restrict roles to the supported values.
ALTER TABLE users
ADD CONSTRAINT users_role_valid
CHECK (role IN ('Admin', 'Team Member'));

-- 2. Create project membership records.
CREATE TABLE project_members (
    project_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    added_by BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT project_members_pk
        PRIMARY KEY (project_id, user_id),

    CONSTRAINT project_members_project_fk
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

    CONSTRAINT project_members_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT project_members_added_by_fk
        FOREIGN KEY (added_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
);

-- Indexes for membership lookups.
CREATE INDEX idx_project_members_user_id
    ON project_members(user_id);

CREATE INDEX idx_project_members_project_id
    ON project_members(project_id);

-- 3. Preserve access for existing project owners.
INSERT INTO project_members (project_id, user_id, added_by)
SELECT id, owner_id, owner_id
FROM projects
ON CONFLICT (project_id, user_id) DO NOTHING;

-- 4. Record the migration.
INSERT INTO schema_migrations (version)
VALUES ('002_add_role_based_permissions');

COMMIT;
