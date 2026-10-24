# WindCast — Wind Energy Forecast Dashboard

WindCast is a full-stack dashboard for analyzing wind energy generation and forecast performance in Great Britain. It brings together actual wind generation and forecast data to help users explore forecast accuracy and understand differences between predicted and observed generation.

## Features

- **Wind generation analytics:** Explore actual and forecast wind generation.
- **Forecast comparison:** Compare forecast values against actual generation.
- **Forecast performance:** Analyze forecast errors using Mean Absolute Error (MAE) and Mean Bias Error (MBE).
- **Date-based observations:** Retrieve hourly observations for a selected date.
- **Interactive dashboard:** Visualize wind energy data through a React frontend.
- **REST API:** Access backend health, analytics, and observation endpoints.
- **Docker support:** Run the frontend and backend using Docker Compose.

## Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Python, FastAPI |
| Data Processing | pandas, NumPy |
| Data Source | Elexon BMRS |
| API Server | Uvicorn |
| Containers | Docker, Docker Compose |

## Project Structure

```text
windcast/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── elexon.py
│   │   └── analytics.py
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── style.css
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

Install the following tools:

- [Git](https://git-scm.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js](https://nodejs.org/) (optional for running the frontend outside Docker)
- [Python](https://www.python.org/) (optional for running the backend outside Docker)

### Run with Docker Compose

**1. Clone the repository**

```bash
git clone https://github.com/Rakesh200416/windcast.git
cd windcast
```

**2. Start the application**

Ensure Docker Desktop is running, then execute:

```bash
docker compose up --build
```

**3. Open the application**

- Frontend dashboard: http://localhost:5173
- Backend health check: http://localhost:8000/api/health
- Backend analytics: http://localhost:8000/api/analytics
- API documentation: http://localhost:8000/docs

To stop the application, press `Ctrl + C`, then run:

```bash
docker compose down
```

## Running Without Docker

### Backend

From the project root, open a terminal and run:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment on Windows Git Bash:

```bash
source .venv/Scripts/activate
```

Install dependencies:

```bash
python -m pip install -r requirements.txt
```

Start the API server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at http://localhost:8000.

### Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local development URL printed by Vite, normally http://localhost:5173.

If necessary, configure the frontend API URL using the `VITE_API_URL` environment variable supported by the frontend build.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend health |
| GET | `/api/analytics` | Retrieve analytics results |
| GET | `/api/observations?date=2026-01-01` | Retrieve observations for a selected date |
| GET | `/docs` | Explore interactive API documentation |

The observation endpoint accepts a date parameter in `YYYY-MM-DD` format.

## Data and Analysis

WindCast uses data from the Elexon Balancing Mechanism Reporting Service (BMRS).

The backend processes:

- **Actual generation:** Wind generation observations from the `FUELHH` dataset, filtered to wind.
- **Forecast generation:** Wind forecast data from `WINDFOR`.
- **Time alignment:** Actual generation is recorded at half-hourly intervals, while forecast data is hourly. The application aggregates actual readings to hourly values to support comparison.

The analysis focuses on **January 2026**, the period relevant to the assignment.

### Forecast Evaluation Metrics

**Mean Absolute Error (MAE)**

Measures the average absolute difference between forecast and actual generation. Lower values indicate smaller average errors.

**Mean Bias Error (MBE)**

Measures the average signed difference between forecast and actual generation. The sign depends on the convention used in the implementation, so interpret it according to the backend calculation.

Forecast comparisons depend on matching timestamps, data availability, and the forecast publication cutoff implemented in the backend. These assumptions should be reviewed when interpreting the results.

## Testing

The backend contains test files for analytics, Elexon data handling, and January data validation.

From the `backend` directory, install the dependencies and run:

```bash
python -m pytest
```

## Deployment

The application can be deployed using a hosting platform that supports the frontend and backend.

For a production deployment:

1. Deploy the frontend to a platform such as Vercel.
2. Deploy the FastAPI backend to a suitable Python hosting platform.
3. Configure the frontend's `VITE_API_URL` to point to the deployed backend.
4. Configure backend CORS to allow requests from the deployed frontend domain.
5. Verify the deployed API endpoints and dashboard before sharing the public URL.

**Live application:** Add the deployed URL here after deployment.

## Demo Video

**Unlisted YouTube demo:** Add your video URL here after uploading the demonstration.

The demonstration should cover:

- Customer-facing dashboard overview and key insights.
- Data analysis and forecast performance.
- Application architecture and technology choices.
- Code structure, testing, and development decisions.

## AI Tool Usage Disclosure

AI assistance was used during development for implementation guidance, debugging, Docker configuration, and documentation preparation. The application code, analysis assumptions, and results should be reviewed and validated by the developer before submission.

## Author

**Rakesh Ravikumar**

- GitHub: https://github.com/Rakesh200416
- LinkedIn: https://www.linkedin.com/in/r-7ba9a6284/

---

*WindCast — Exploring wind generation and forecast performance through data.*
