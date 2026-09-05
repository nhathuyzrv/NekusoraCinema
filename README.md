# Disclaimer

Nekusora Cinema is an academic software project developed solely for educational, learning, demonstration, and research purposes. It is not intended for commercial use, real cinema operations, production payment processing, or the storage of real customer data.

The project integrates third-party services such as Cloudinary, Gmail SMTP, PayOS, MoMo, PayPal and ngrok. Their names, trademarks, APIs, and services remain the property of their respective owners. Payment integrations in this repository are intended to be used with development or sandbox environments only unless the application is independently reviewed, secured, and configured for production use.

# Nekusora Cinema

Nekusora Cinema is a full-stack online cinema ticket booking system built with Django and React. The application supports movie browsing, showtime and seat selection, temporary seat holding, real-time seat status updates, promotions, loyalty points, online payments, electronic tickets, ticket check-in, staff management, cinema management, and reporting.

The project uses a client-server architecture with REST APIs for normal application requests and WebSocket connections for real-time updates.

## Main Technology Stack

### Backend

- Python and Django 6
- Django REST Framework
- Django Channels and ASGI
- PostgreSQL
- Redis
- Celery Worker and Celery Beat
- OAuth2 authentication
- Cloudinary media storage
- Gmail SMTP for OTP and electronic ticket emails
- PayOS for bank QR payments
- MoMo sandbox payments
- PayPal sandbox payments
- Swagger and ReDoc API documentation

### Frontend

- React 19
- Vite 8
- React Router
- TanStack Query
- Axios
- Tailwind CSS
- DaisyUI
- Recharts

## Main Features

The application contains three main user roles:

- `CUSTOMER`: browse movies, view showtimes, book seats, buy food and drinks, apply promotions and loyalty points, pay online, view booking history, and rate movies.
- `STAFF`: validate and check in electronic tickets.
- `MANAGER`: manage movies, genres, showtimes, locations, branches, cinema rooms, products, promotions, staff accounts, and reports.

Important technical features include:

- Temporary seat holding with Redis and an 8-minute expiration time.
- Real-time seat state synchronization through WebSocket connections.
- Background and scheduled processing with Celery.
- OTP email verification for registration and password recovery.
- Electronic ticket delivery by email with a barcode.
- Bank QR, MoMo, and PayPal payment flows.
- Role-based authorization at both frontend and backend levels.

## Architecture Overview

<img width="966" height="512" alt="Screenshot 2026-09-05 151621" src="https://github.com/user-attachments/assets/6e286172-5144-4764-b18c-8f43fa8cea8d" />

Redis is used by the current backend configuration for several different purposes:
- Database 0: Celery broker and result backend.
- Database 1: temporary seat-hold state.
- Database 2: Django cache, including OTP data.
- Database 3: Django Channels channel layer.

## Project Structure

```text
NekusoraCinema/
├── nekusoraapis/                 # Django backend     
│   ├── nekusoraapis/             
│   └── nekusoracinema/           
│
└── nekusorareact/                # React frontend
    └── src/
```

# Installation and Local Setup

The instructions below use Windows as the primary development environment because `start_services.bat` is a Windows batch script. Git Bash is recommended for the first backend initialization because `db_init.sh` is a shell script.

## 1. Prerequisites

Install and configure the following software before starting the project:

- Python 3.12 or newer.
- Node.js `^20.19.0` or `>=22.12.0` because the project uses Vite 8.
- npm.
- PostgreSQL server.
- Redis server reachable from the development machine.
- Git Bash or another Bash-compatible shell for `db_init.sh`.
- ngrok CLI for public callback/IPN access during payment testing.

The following third-party accounts are required only for the features that use them:

- Cloudinary account.
- Gmail account or another compatible Gmail SMTP credential.
- PayOS account.
- MoMo test/sandbox credentials.
- PayPal developer sandbox account.

## 2. PostgreSQL Configuration

The current backend configuration in `nekusoraapis/nekusoraapis/settings.py` expects the following PostgreSQL connection:

```text
Database: nekusoradb
User:     postgres
Password: root
Host:     localhost
Port:     5432
```

Create the database before running Django migrations. For example, from `psql` (Or you can create the database via PgAdmin4.):

```sql
CREATE DATABASE nekusoradb WITH ENCODING 'UTF8';
```

If your local PostgreSQL username, password, host, or port is different, update the `DATABASES` section in:

```text
nekusoraapis/nekusoraapis/settings.py
```

It is not necessary to change your PostgreSQL administrator password to `root`; changing the Django database configuration to match your local PostgreSQL installation is usually safer.

## 3. Redis Configuration

The backend uses Redis at the following address by default:

```text
redis://127.0.0.1:6379
```

Make sure Redis is already running before starting Django or Celery. If `redis-cli` is available, verify the server with:

```bash
redis-cli ping
```

A successful response is:

```text
PONG
```

`start_services.bat` does not start the Redis server. Redis must be running separately.

If Redis runs at a different address, set `REDIS_URL` in the backend `.env` file, for example:

```env
REDIS_URL=redis://127.0.0.1:6379
```

## 4. Backend Virtual Environment

Open Git Bash and move to the backend directory:

```bash
cd NekusoraCinema/nekusoraapis
```

Create the virtual environment using the exact name `.venv`. This name is important because `start_services.bat` activates `.venv\Scripts\activate` automatically.

```bash
python -m venv .venv
```

Activate it in Git Bash:

```bash
source .venv/Scripts/activate
```

For later sessions, the equivalent activation commands are:

Command Prompt:

```bat
.venv\Scripts\activate
```

PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

Git Bash:

```bash
source .venv/Scripts/activate
```

## 5. Backend Environment Variables

Create this file:

```text
NekusoraCinema/nekusoraapis/.env
```

Add the following configuration:

```env
OAUTH_CLIENT_ID=
OAUTH_CLIENT_SECRET=

CLOUD_NAME=
CLOUD_API_KEY=
CLOUD_API_SECRET=

EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=

PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=
PAYOS_RETURN_URL=http://localhost:5173/order/payos/result
PAYOS_CANCEL_URL=http://localhost:5173/order/payos/cancel

MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=F8BBA842ECF85
MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz
MOMO_BASE_URL=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_RETURN_URL=http://localhost:5173/order/momo/result
MOMO_IPN_URL=https://<your-ngrok-domain>.ngrok-free.dev/momo/ipn/

PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
PAYPAL_RETURN_URL=http://localhost:5173/order/paypal/result
PAYPAL_CANCEL_URL=http://localhost:5173/order/paypal/cancel

# Optional. The backend already uses this value by default
# REDIS_URL=
```

The MoMo values shown above are sandbox/test values supplied for development. Do not replace test credentials with production credentials unless the application has been properly secured and reviewed for production use.

### Environment Variable Reference

| Variable | Purpose |
| --- | --- |
| `OAUTH_CLIENT_ID` | OAuth2 application client ID used by the token and revoke-token endpoints. |
| `OAUTH_CLIENT_SECRET` | OAuth2 application client secret. |
| `CLOUD_NAME` | Cloudinary cloud name. |
| `CLOUD_API_KEY` | Cloudinary API key. |
| `CLOUD_API_SECRET` | Cloudinary API secret. |
| `EMAIL_HOST_USER` | Gmail SMTP account used to send OTP and ticket emails. |
| `EMAIL_HOST_PASSWORD` | SMTP password. For Gmail, an App Password is normally recommended instead of the normal account password. |
| `DEFAULT_FROM_EMAIL` | Sender address displayed on outgoing emails. |
| `PAYOS_CLIENT_ID` | PayOS client ID. |
| `PAYOS_API_KEY` | PayOS API key. |
| `PAYOS_CHECKSUM_KEY` | PayOS checksum key used for payment/webhook verification. |
| `PAYOS_RETURN_URL` | Frontend URL used after a successful PayOS flow. |
| `PAYOS_CANCEL_URL` | Frontend URL used after a cancelled PayOS flow. |
| `MOMO_PARTNER_CODE` | MoMo partner code. |
| `MOMO_ACCESS_KEY` | MoMo sandbox access key. |
| `MOMO_SECRET_KEY` | MoMo sandbox secret used for request and IPN signature verification. |
| `MOMO_BASE_URL` | MoMo payment creation endpoint. |
| `MOMO_RETURN_URL` | Frontend URL used after the MoMo payment page redirects back. |
| `MOMO_IPN_URL` | Public backend endpoint used by MoMo to report the final payment result. |
| `PAYPAL_CLIENT_ID` | PayPal sandbox REST API client ID. |
| `PAYPAL_CLIENT_SECRET` | PayPal sandbox REST API client secret. |
| `PAYPAL_BASE_URL` | PayPal API base URL. The current value points to the sandbox. |
| `PAYPAL_RETURN_URL` | Frontend URL used after PayPal approval. |
| `PAYPAL_CANCEL_URL` | Frontend URL used when PayPal is cancelled. |
| `REDIS_URL` | Optional Redis connection URL. Defaults to `redis://127.0.0.1:6379`. |

## 6. First-Time Backend Initialization

Run `db_init.sh` only for the first initialization of a fresh development database:

```bash
$ db_init.sh
```

The script performs the following operations:

1. Installs packages from `requirements.txt`.
2. Runs Django migrations.
3. Creates a development superuser if it does not already exist.
4. Loads the large sample dataset from `sample_data.py`.
5. Starts the Django development server on `0.0.0.0:8000`.

The generated development superuser is:

```text
Email:    admin@nekusora.vn
Username: admin
Password: Admin@123
```

Note that the superuser has CUSTOMER role by default.

The sample data generator also creates customer, staff, and manager accounts. On a fresh database, example accounts include:

```text
Customer: khach0001@gmail.com
Staff:    nhanvien001@nekusora.vn
Manager:  quanly01@nekusora.vn
Password for generated sample users: Sample@1234
```

These credentials are for local development only.

The sample-data script generates a substantial amount of test data, including hundreds of users and thousands of bookings. Initial setup can therefore take some time. Wait until the data summary is printed and Django reports that the development server has started.

A successful backend startup normally includes output similar to:

```text
Starting development server at http://0.0.0.0:8000/
```

Important: do not use `db_init.sh` as the normal startup command. Running it repeatedly can add additional sample records because `sample_data.py` generates new sample users and bookings. After the first initialization, start Django with the commands described in the next section.

## 7. Register OAuth2 Client

The frontend login flow requests OAuth2 tokens using the password grant, and the backend injects `OAUTH_CLIENT_ID` and `OAUTH_CLIENT_SECRET` into token requests. The values in `.env` must therefore match an OAuth2 application stored in the Django database.

After migrations have completed, create the OAuth2 application once on a fresh database. Firstly, run the backend server using command in the next section, then go to endpoint `/admin/` and login superuser. Secondly, go to endpoint `/o/application/` and register a new application. Client type `Confindentail` - Authorization grant type `Resource owner password-based`. Make sure you copy both Client id and Client secret keys and put them in `.env`.

Do not create a second application every time the project starts. If an OAuth2 application already exists in your database, simply make sure its client ID and secret match the values in `.env`.

If login returns an OAuth error even though the backend is running, an incorrect or missing OAuth2 client is one of the first items to check.

## 8. Starting the Backend After Initial Setup

For normal development sessions, activate the backend virtual environment and run:

```bash
python manage.py runserver
```

This binds to the local machine by default.

To allow other devices on the same local network to reach the backend, use:

```bash
python manage.py runserver 0.0.0.0:8000
```

Keep this terminal open while the application is running.

Useful backend URLs:

```text
API / backend: http://localhost:8000/
Swagger:       http://localhost:8000/swagger/
ReDoc:         http://localhost:8000/redoc/
Admin:         http://localhost:8000/admin/
```

## 9. Configure ngrok for Payment Callbacks

MoMo sends the final payment result to the backend through an IPN URL, so a public URL is required when the Django server is running only on your local machine.

Install ngrok, sign in, and configure its authentication token before using `start_services.bat`. A typical one-time ngrok setup is:

```bash
ngrok config add-authtoken <your-ngrok-auth-token>
```

`start_services.bat` runs:

```text
ngrok http 8000
```

When ngrok is running, it should display a public forwarding address similar to:

```text
Forwarding  https://example.ngrok-free.dev -> http://localhost:8000
```

Use that hostname for:

```env
MOMO_IPN_URL=https://example.ngrok-free.dev/momo/ipn/
```

If the ngrok hostname changes, update `MOMO_IPN_URL`. Because Django reads the `.env` configuration when the process starts, restart the Django backend after changing this value.

The current Django settings contain a specific development ngrok host in `ALLOWED_HOSTS`. If your ngrok hostname is different, add your hostname to `ALLOWED_HOSTS` in:

```text
nekusoraapis/nekusoraapis/settings.py
```

For PayOS, the backend exposes this webhook endpoint:

```text
https://<your-ngrok-domain>.ngrok-free.dev/payos/webhook/
```

Configure the corresponding PayOS webhook in the PayOS developer/dashboard settings if your PayOS test flow requires webhook confirmation. The PayOS webhook is not read from an environment variable in the current project; it is an endpoint that must be configured at the payment provider side.

## 10. Start Background Services

Open Command Prompt in:

```text
NekusoraCinema\nekusoraapis
```

Make sure the following conditions are already satisfied:

- `.venv` exists inside `nekusoraapis`.
- Backend dependencies have been installed.
- Redis is running.
- ngrok is installed and available from the command line.

Run:

```bat
start_services.bat
```

The script opens three separate terminal windows:

1. `Celery Worker`
2. `Celery Beat`
3. `Ngrok Tunnel`

It also keeps the original `start_services.bat` window open with a message similar to:

```text
SERVICES ARE RUNNING...
Press any key to terminate
```

Do not press a key in that parent window while developing. Pressing a key triggers the cleanup section of the script and terminates all three service windows.

All three service windows should remain open. Typical signs of a successful startup are:

### Celery Worker

The worker prints its Celery configuration, connects to Redis, lists registered tasks, and eventually reports a message containing:

```text
ready
```

If it repeatedly reports that it cannot connect to Redis, start or fix the Redis server first.

### Celery Beat

The Beat window should remain running and print startup/scheduler information. It is responsible for periodic tasks such as updating showtime status every five minutes and updating movie status daily.

If the window closes immediately or shows an import error, confirm that the batch file was started from `nekusoraapis` and that `.venv` exists there.

### Ngrok Tunnel

The ngrok window should remain running and show an HTTPS forwarding address that points to `http://localhost:8000`.

If there is no forwarding URL, check that ngrok is installed, authenticated, and available in `PATH`.

The background-service script does not start Django and does not start Redis. The Django backend and Redis server must be running separately.

## 11. Frontend Installation

Open a new terminal and move to the frontend directory:

```bash
cd NekusoraCinema/nekusorareact
```

Install dependencies the first time:

```bash
npm install
```

After installation, start the Vite development server:

```bash
npm run dev
```

The Vite configuration already binds the frontend to `0.0.0.0` on port `5173`.

A successful startup normally displays output similar to:

```text
Local:   http://localhost:5173/
Network: http://<your-local-ip>:5173/
```

Open the local URL in a browser:

```text
http://localhost:5173/
```

The frontend REST API configuration automatically uses the hostname from the browser and sends API requests to port `8000`. For example:

- Opening `http://localhost:5173` sends API requests to `http://localhost:8000`.
- Opening `http://192.168.x.x:5173` sends API requests to `http://192.168.x.x:8000`.

## 12. Recommended Terminal Layout During Development

A normal complete local session consists of the following running processes:

```text
Process 1: PostgreSQL server
Process 2: Redis server
Terminal 1: Django backend
Terminal 2: Frontend Vite server
start_services.bat parent window
    ├── Celery Worker window
    ├── Celery Beat window
    └── Ngrok Tunnel window
```

For the application to work completely, keep the Django backend, frontend, Redis, Celery Worker, and Celery Beat running. Keep ngrok running whenever external payment callbacks such as MoMo IPN or PayOS webhooks need to reach your local backend.

# Accessing the Project from a Phone or Another Device on the Same Network

Both the Django backend and Vite frontend can be exposed to devices on the same local network.

## 1. Start Django on All Interfaces

Run:

```bash
python manage.py runserver 0.0.0.0:8000
```

## 2. Find the Development Computer's Local IP Address

On Windows:

```bat
ipconfig
```

Look for the IPv4 address of the active Wi-Fi or Ethernet adapter, for example:

```text
192.168.1.73
```

## 3. Open the Frontend from the Phone

Because Vite already listens on `0.0.0.0:5173`, open:

```text
http://<computer-ip>:5173/
```

Both devices must normally be connected to the same local network, and the Windows firewall must allow inbound connections to the development ports.

## 4. Update Django CORS and Allowed Hosts When Necessary

The current project contains development host/origin entries in `settings.py`. If your computer has a different local IP address, add it to:

- `ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`

For example:

```python
ALLOWED_HOSTS = [
    "127.0.0.1",
    "localhost",
    "0.0.0.0",
    "192.168.1.100",
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://192.168.1.100:5173",
]
```

Restart Django after changing `settings.py`.

## 5. Configure WebSocket Access for the Phone

The REST API base URL automatically follows the browser hostname, but the WebSocket hook falls back to:

```text
ws://127.0.0.1:8000
```

That address points to the phone itself when the frontend is opened from a phone. To make real-time seat updates work on another device, create:

```text
NekusoraCinema/nekusorareact/.env
```

and set:

```env
VITE_WS_URL=ws://<computer-ip>:8000
```

For example:

```env
VITE_WS_URL=ws://192.168.1.100:8000
```

Restart `npm run dev` after changing the frontend `.env` file.

## 6. Payment Redirect URLs When Testing from a Phone

The default payment return/cancel URLs use `localhost:5173`. If a payment is initiated from a phone, `localhost` refers to the phone, not the development computer.

For phone testing, change the relevant values in `nekusoraapis/.env`, for example:

```env
PAYOS_RETURN_URL=http://192.168.1.100:5173/order/payos/result
PAYOS_CANCEL_URL=http://192.168.1.100:5173/order/payos/cancel
MOMO_RETURN_URL=http://192.168.1.100:5173/order/momo/result
PAYPAL_RETURN_URL=http://192.168.1.100:5173/order/paypal/result
PAYPAL_CANCEL_URL=http://192.168.1.100:5173/order/paypal/cancel
```

Restart Django after changing backend environment variables.

The MoMo IPN URL should still be a public HTTPS ngrok URL because the MoMo server cannot call a private LAN address.

# Verifying the Setup

After all required processes are running, verify the environment in this order:

1. Open `http://localhost:8000/swagger/`. The API documentation should load.
2. Open `http://localhost:5173/`. The frontend should display movie data.
3. Log in with a sample account. If token creation fails, check the OAuth2 client configuration.
4. Open the same showtime in two browser sessions. Seat state changes should be delivered through WebSocket without reloading the page.
5. Test registration or password reset. OTP email delivery requires working SMTP settings and a running Celery Worker.
6. Test a booking expiration. Delayed booking expiration requires Celery Worker and Redis.
7. Test MoMo or PayOS only after the ngrok public callback URL has been configured correctly.

# Common Problems and Troubleshooting

## Django reports a missing environment variable

Typical symptoms include errors from `python-decouple` during startup.

Check that the file exists at:

```text
nekusoraapis/.env
```

and that all required variables used by `settings.py` have values.

## PostgreSQL connection fails

Check that:

- PostgreSQL is running.
- The `nekusoradb` database exists.
- The connection values in `settings.py` match your PostgreSQL installation.
- Port `5432` is not blocked or used by a different service.

## Redis connection is refused

Check Redis first:

```bash
redis-cli ping
```

Expected:

```text
PONG
```

Django cache, seat holding, WebSocket channel layers, and Celery all depend on Redis.

## Celery Worker keeps retrying the broker connection

This normally indicates that Redis is unavailable or `REDIS_URL` is incorrect.

## `start_services.bat` cannot activate `.venv`

The script expects this exact path:

```text
nekusoraapis\.venv\Scripts\activate
```

Create the virtual environment with the name `.venv` and run `start_services.bat` from the `nekusoraapis` directory.

## Login fails with an OAuth error

Check that:

- `OAUTH_CLIENT_ID` and `OAUTH_CLIENT_SECRET` are present in `.env`.
- The OAuth2 application has been created in the database.
- The database application's client ID and secret exactly match `.env`.
- The application uses the password/resource-owner-password grant required by the current frontend login flow.

## The website works on the computer but not on the phone

Check that:

- Django is running on `0.0.0.0:8000`.
- The frontend is reachable on `<computer-ip>:5173`.
- The phone and computer are on the same network.
- Windows Firewall allows ports `5173` and `8000`.
- The local IP and frontend origin are present in Django `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`.

## REST API works on the phone but real-time seat updates do not

Set `VITE_WS_URL` in `nekusorareact/.env` to the development computer's LAN address instead of the default `127.0.0.1`.

## MoMo payment returns but the booking is not confirmed

Check that:

- ngrok is running.
- `MOMO_IPN_URL` uses the current ngrok HTTPS hostname.
- The URL ends with `/momo/ipn/`.
- The ngrok hostname is accepted by Django `ALLOWED_HOSTS`.
- Django was restarted after `.env` was changed.

## PayOS payment remains pending

Check that the PayOS webhook is configured to reach:

```text
https://<your-ngrok-domain>/payos/webhook/
```

and that the PayOS credentials in `.env` are correct.

## Email or OTP delivery fails

Check `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, and `DEFAULT_FROM_EMAIL`. Also make sure the Celery Worker is running because OTP and electronic ticket delivery are background tasks.

## Cloudinary upload fails

Verify `CLOUD_NAME`, `CLOUD_API_KEY`, and `CLOUD_API_SECRET`.

# Normal Startup Checklist

After the project has been initialized once, the usual startup sequence is:

1. Start PostgreSQL.
2. Start Redis.
3. Open `nekusoraapis`, activate `.venv`, and run:

```bash
python manage.py runserver 0.0.0.0:8000
```

4. In `nekusoraapis`, run:

```bat
start_services.bat
```

5. Confirm that the Celery Worker, Celery Beat, and ngrok windows all remain running.
6. Open `nekusorareact` and run:

```bash
npm run dev
```

7. Open:

```text
http://localhost:5173/
```

# Stopping the Development Environment

To shut the project down cleanly:

1. Stop the frontend with `Ctrl+C`.
2. Stop the Django backend with `Ctrl+C`.
3. Return to the original `start_services.bat` window and press a key. The batch file terminates the Celery Worker, Celery Beat, and ngrok windows that it opened.
4. Stop Redis and PostgreSQL if you started them manually and no other application needs them.

# Development Notes

- `db_init.sh` is intended for first-time initialization, not normal daily startup.
- The Django development server is used by this repository for local development only.
- `start_services.bat` is Windows-specific.
- The project currently uses development settings such as `DEBUG=True` and a development Django secret key. These settings are not suitable for production deployment.
- Payment callback URLs, local IP addresses, CORS origins, and ngrok hostnames may need to be changed for a different development computer.
- Never commit the backend `.env` file or real service credentials.
