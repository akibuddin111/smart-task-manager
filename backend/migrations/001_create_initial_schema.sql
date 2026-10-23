-- =====================================================
-- Smart Task Manager
-- Migration 001: Initial database schema
-- =====================================================

-- 1. Users
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT users_name_not_empty
        CHECK (LENGTH(TRIM(name)) > 0),

    CONSTRAINT users_email_not_empty
        CHECK (LENGTH(TRIM(email)) > 0)
);


-- 2. Projects
CREATE TABLE projects (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    name VARCHAR(150) NOT NULL,

    description TEXT NOT NULL DEFAULT '',

    owner_id BIGINT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT projects_name_not_empty
        CHECK (LENGTH(TRIM(name)) > 0),

    CONSTRAINT projects_owner_fk
        FOREIGN KEY (owner_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- 3. Tasks
CREATE TABLE tasks (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    title VARCHAR(200) NOT NULL,

    description TEXT NOT NULL DEFAULT '',

    project_id BIGINT NOT NULL,

    assignee_id BIGINT NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'To Do',

    priority VARCHAR(10) NOT NULL DEFAULT 'Medium',

    deadline DATE NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT tasks_title_not_empty
        CHECK (LENGTH(TRIM(title)) > 0),

    CONSTRAINT tasks_status_valid
        CHECK (
            status IN ('To Do', 'In Progress', 'Completed')
        ),

    CONSTRAINT tasks_priority_valid
        CHECK (
            priority IN ('Low', 'Medium', 'High')
        ),

    CONSTRAINT tasks_project_fk
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

    CONSTRAINT tasks_assignee_fk
        FOREIGN KEY (assignee_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
);


-- 4. Indexes for common queries
CREATE INDEX idx_projects_owner_id
    ON projects(owner_id);

CREATE INDEX idx_tasks_project_id
    ON tasks(project_id);

CREATE INDEX idx_tasks_assignee_id
    ON tasks(assignee_id);

CREATE INDEX idx_tasks_status
    ON tasks(status);

CREATE INDEX idx_tasks_priority
    ON tasks(priority);

CREATE INDEX idx_tasks_deadline
    ON tasks(deadline);


-- 5. Migration tracking table
CREATE TABLE schema_migrations (
    version VARCHAR(100) PRIMARY KEY,

    applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- Record this migration
INSERT INTO schema_migrations (version)
VALUES ('001_create_initial_schema');