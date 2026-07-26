echo "=== Install requirements.txt ==="
pip install -r requirements.txt

echo "=== Migrate db ==="
python manage.py migrate

echo "=== Create superuser ==="
export DJANGO_SUPERUSER_USERNAME=admin
export DJANGO_SUPERUSER_EMAIL=admin@nekusora.vn
export DJANGO_SUPERUSER_PASSWORD=Admin@123
python manage.py createsuperuser --no-input || echo "Superuser already exists"

echo "=== Chèn dữ liệu mẫu ==="
PYTHONIOENCODING=utf-8:surrogateescape python manage.py shell -c "exec(open('sample_data.py', encoding='utf-8').read())"

python manage.py runserver 0.0.0.0:8000