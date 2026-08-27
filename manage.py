#!/usr/bin/env python
import os
import sys

# Support both layouts: manage.py at project root (fitpro-center/) with backend at backend/
# and manage.py inside backend/. We add backend to sys.path if needed.
BASE = os.path.dirname(os.path.abspath(__file__))
for p in [os.path.join(BASE, "backend"), BASE]:
    if os.path.exists(os.path.join(p, "config")):
        if p not in sys.path:
            sys.path.insert(0, p)
        break
# Also ensure backend as package root
if os.path.join(BASE, "backend") not in sys.path:
    sys.path.insert(0, os.path.join(BASE, "backend"))

def main():
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError("Couldn't import Django") from exc
    execute_from_command_line(sys.argv)

if __name__ == "__main__":
    main()
