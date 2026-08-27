#!/bin/bash
set -e

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput 2>/dev/null || true

echo "Creating admin user..."
python manage.py shell -c "
from acct.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@fitpro.com', 'admin123', role='super_admin', first_name='Admin', last_name='User')
    print('Admin user created.')
else:
    print('Admin user exists.')
" 2>/dev/null || true

exec "$@"
