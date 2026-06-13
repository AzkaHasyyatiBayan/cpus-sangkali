CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    activity_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS photos (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
    drive_file_id TEXT NOT NULL,
    file_name TEXT,
    mime_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_activities_title ON activities(title);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_photos_activity_id ON photos(activity_id);

-- Insert sample data (optional - remove in production)
-- INSERT INTO activities (title, activity_date) VALUES 
--   ('Rapat Koordinasi', '2024-01-15'),
--   ('Kerja Bakti', '2024-01-20');