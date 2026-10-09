# Phishing Trap AI

An AI-powered cybersecurity awareness platform that uses controlled phishing simulations to help employees recognize and respond to phishing attacks.

## Project Objectives

- Create controlled phishing simulations
- Measure employee interactions with simulations
- Identify risky behaviors
- Provide cybersecurity awareness training
- Analyze simulation results
- Adapt future simulations based on previous behavior
- Provide an administrative dashboard
- Track cybersecurity awareness metrics

## Technology Stack

### Backend
- Python
- FastAPI
- Uvicorn

### AI
- AI-powered phishing scenario generation
- Behavioral analysis
- Adaptive phishing simulations

### Frontend
- React
- JavaScript/TypeScript

### Database
- To be implemented



## Project Structure

```text
PhishingTrap/
├── ai/
├── backend/
├── database/
├── docs/
├── frontend/
├── tests/
├── .gitignore
└── README.md

## Phase 6 — Adaptive AI

Behaviour analysis, an experimental click-prediction model and a guarded decision agent that proposes the next simulation and awareness training. See [docs/PHASE6.md](docs/PHASE6.md) for architecture, evaluation results, limitations, API endpoints and Windows run instructions.

```powershell
$env:PYTHONPATH = ".;backend"
uvicorn app.main:app --reload     # backend
python -m pytest                  # tests
```
