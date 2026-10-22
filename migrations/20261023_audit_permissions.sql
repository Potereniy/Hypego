INSERT INTO permissions (id, description)
VALUES ('audit.view', 'Просмотр журнала действий')
ON CONFLICT (id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT id, 'audit.view'
FROM roles
WHERE id IN (
  'owner',
  'deputy',
  'management',
  'curator',
  'tech_admin',
  'support',
  'moderator'
)
ON CONFLICT DO NOTHING;

DELETE FROM role_permissions
WHERE permission_id = 'audit.view'
  AND role_id IN ('trainee', 'player', 'chsp');
