#!/bin/bash
set -e

cd /app

echo "==> Running migrations..."
python manage.py migrate --noinput

echo "==> Collecting static files..."
python manage.py collectstatic --noinput 2>/dev/null || true

echo "==> Ensuring platform owner account..."
python manage.py shell -c "
import os
from acct.models import User
email = os.getenv('OWNER_EMAIL', 'flixnettv@gmail.com')
password = os.getenv('OWNER_PASSWORD', '#Flix1571980')
user = User.objects.filter(email=email).first()
if user is None:
    User.objects.create_superuser('flixnettv', email, password, role='super_admin', first_name='Flix', last_name='Admin')
    print('Platform owner created:', email)
else:
    if not user.is_superuser:
        user.is_superuser = True
    if user.role != 'super_admin':
        user.role = 'super_admin'
        user.save(update_fields=['is_superuser', 'role'])
    print('Platform owner verified:', email)
" 2>/dev/null || true

echo "==> Starting gunicorn (background) + nginx (foreground)..."
gunicorn config.wsgi:application \
    --bind 127.0.0.1:8000 \
    --workers "${GUNICORN_WORKERS:-2}" \
    --threads 4 \
    --worker-class gthread \
    --timeout 300 &

exec nginx -g "daemon off;"