# Admin portal

A React portal (`/admin`) and a protected API (`/admin/...`) where an administrator can see what each employee did, where each one is weak, and run campaigns.

## 1. One-time setup: create the admin account

The admin account lives in your `.env` file (no database change). Create it **yourself** so the password never appears in chat or code:

```powershell
# project root, venv active
$env:PYTHONPATH = "."
python -m backend.app.create_admin_credentials
```

It asks for an email and a password (typed hidden, minimum 12 characters) and prints three lines. Paste them into `.env` exactly as printed (keep the single quotes):

```
ADMIN_EMAIL='you@example.com'
ADMIN_PASSWORD_HASH='$argon2id$...'
ADMIN_TOKEN_SECRET='...'
```

Restart the backend. If any of the three is missing (or the secret is under 32 characters) the portal is **disabled**: login returns 503 and every admin endpoint returns 401. Never commit `.env`.

## 2. Run it

```powershell
# terminal 1 - backend
$env:PYTHONPATH = ".;backend"
uvicorn app.main:app --reload

# terminal 2 - frontend
cd frontend
npm run dev
```

Open http://localhost:5173/login. The login page asks whether you are an **Employee** or an **Administrator**; choose Administrator and sign in with the email and password from step 1. (The backend only allows CORS from port 5173.)

## 3. What you can do

| Page | Shows |
|---|---|
| Dashboard | Totals, click / report rate, training completion, employees by risk level, click rate per scenario, a **weakness heatmap** (employees x 12 scenarios), highest-risk employees, departments, recent employee actions |
| Employees | Searchable, sortable table: results, risk level, established weakness (with clicks/attempts), open and completed training, last simulation |
| Employee profile | Everything about one person: per-scenario vulnerability with likely range and evidence level, the agent's recommended next simulation and training with its reasoning, training status, approved-decision audit, full activity timeline |
| Campaigns | All campaigns with results; per-campaign results by employee and a link to preview each email |
| New campaign | Name, mode, audience -> **Preview plan** -> confirm -> **Launch** |

### Campaign modes
* **Adaptive**: the agent chooses a scenario and difficulty per employee from their history and (optionally) assigns recommended training.
* **Fixed**: everyone receives the scenario you choose.

Safeguards: preview before anything is written; explicit confirmation; approved scenarios only; duplicate campaign names refused; employees who got a simulation in the last 24 hours, inactive employees and unknown ids are skipped (and listed); at most 500 recipients; every simulation gets an audit event naming the admin who approved it.

**Delivery:** this prototype does not send email. Launching records the simulations and gives each a preview link. Connect a mail sender to an internal test inbox before using it with real staff.

## 4. Demo data switch

All current data is synthetic. A banner on every page says so, and "Include synthetic demo data" (on by default) controls whether it is shown. Turn it off to see only non-synthetic records (the dashboard will look nearly empty until real simulations exist).

## 5. API

| Endpoint | Purpose |
|---|---|
| `POST /admin/login` | `{email, password}` -> signed token (8 h). 5 failed attempts per client in 15 minutes -> 429 |
| `GET /admin/me`, `/admin/overview`, `/admin/employees`, `/admin/employees/{id}`, `/admin/weakness-matrix`, `/admin/campaigns`, `/admin/campaigns/{id}` | Dashboard data (`?include_synthetic=true|false`) |
| `POST /admin/campaigns/run` | `dry_run: true` (default) previews; `dry_run: false` + `confirm: true` creates |

Send `Authorization: Bearer <token>`. The Phase 6 endpoints (`/ai/model-status`, `/employees/{id}/scenario-analysis`, `/employees/{id}/scenarios/{s}/click-probability`, `/employees/{id}/agent/*`) now **require the admin token** too. Employee-facing tracking (`/simulations/click/{id}`, `/simulations/{id}/report`, `/simulations/{id}/preview`) stays open so simulated emails work.

## 6. How risk and weakness are decided

* **Risk level** uses a smoothed click rate (pulled towards 25% when history is short): under 20% low, 20-35% medium, 35% and above high; employees with fewer than 5 simulations are "not enough data". These thresholds are untuned assumptions.
* **Weakness** needs at least 3 attempts, 2 clicks and an estimated risk of 40%+ in one scenario. Anything weaker appears only as "watch".
* The dashboard heatmap uses statistics only; the ML model (experimental, synthetic-trained) is shown separately on the employee profile.
* Every figure is shown next to its evidence (clicks/attempts); these are hints for review, not judgements about people.

## 7. Limitations

* One admin account from `.env`; no user management, roles, password reset or audit of logins. Tokens are not revocable before they expire (restart with a new `ADMIN_TOKEN_SECRET` to invalidate all).
* The login throttle and tokens are in-process: fine for one server instance, not for several.
* The token is kept in `sessionStorage`; serve the portal over HTTPS and keep the page free of third-party scripts.
* Dashboards compute statistics on every request (fine for dozens to low hundreds of employees; cache or pre-aggregate beyond that).
* No email delivery, scheduling, or campaign cancellation yet.
* The employee-side API (`/employees`, `/trainings`, ...) is still unauthenticated, as before; the portal only protects the admin and AI endpoints.
* Browser checks were done manually against a throwaway SQLite database; there are no automated frontend tests yet.
