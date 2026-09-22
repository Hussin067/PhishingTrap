/**
 * api.js
 *
 * Centralizes all communication between the React frontend and the
 * FastAPI backend for the Phishing Trap AI project. This file is
 * intentionally limited to network calls only:
 *  - No React components.
 *  - No training scoring logic (scoring happens on the backend / in
 *    the pages once results are received).
 *  - No authentication logic yet.
 */

/**
 * Base URL for the FastAPI backend. Configurable via an environment
 * variable so it can be overridden per environment (dev/staging/prod)
 * without code changes, falling back to the local dev server.
 */
const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://127.0.0.1:8000";

/**
 * Internal helper that performs a fetch call, parses the JSON response,
 * and throws a descriptive error on failure so calling pages can
 * catch it and render an error state.
 *
 * @param {string} path - API path, e.g. "/trainings/1".
 * @param {object} [options] - Standard fetch options.
 * @returns {Promise<any>} Parsed JSON response body.
 */

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  let response;

  try {
    response = await fetch(url, options);
  } catch (networkError) {
    throw new Error(
      `Network error while calling ${url}: ${networkError.message}`
    );
  }

  let data = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch (parseError) {
      throw new Error(
        `Failed to parse JSON response from ${url}: ${parseError.message}`
      );
    }
  }

  if (!response.ok) {
    const detail =
      (data && (data.detail || data.message)) || response.statusText;
    throw new Error(
      `Request to ${url} failed with status ${response.status}: ${detail}`
    );
  }

  return data;
}
export async function getEmployee(employeeId) {
  return request(`/employees/${employeeId}`);
}

export async function getEmployees() {
  return request("/employees", {
    method: "GET",
  });
}
export async function loginEmployee(email, password) {
  return request("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

/**
 * Fetches details for a single training.
 * Sends: GET /trainings/{trainingId}
 *
 * @param {string|number} trainingId
 * @returns {Promise<object>} Training details.
 */
export async function getTraining(trainingId) {
  return request(`/trainings/${trainingId}`, {
    method: "GET",
  });
}

/**
 * Fetches the quiz questions for a training.
 * Sends: GET /trainings/{trainingId}/questions
 *
 * @param {string|number} trainingId
 * @returns {Promise<object>} Questions for the training.
 */
export async function getTrainingQuestions(trainingId) {
  return request(`/trainings/${trainingId}/questions`, {
    method: "GET",
  });
}

export async function getEmployeeTrainings(employeeId) {
  return request(`/employees/${employeeId}/trainings`);
}

export async function getCompletedTrainings(employeeId) {
  return request(`/employees/${employeeId}/trainings/completed`);
}
/**
 * Submits an employee's answers for a training.
 * Sends: POST /trainings/{trainingId}/submit
 * Body: { "answers": { "1": "C", ... } }
 *
 * @param {string|number} trainingId
 * @param {Object<string, string>} answers - Map of question ID to selected
 *   answer letter, e.g. { "1": "C", "2": "A" }.
 * @returns {Promise<object>} Submission result from the backend.
 */
export async function submitTraining(trainingId, answers) {
  return request(`/trainings/${trainingId}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ answers }),
  });
}

/**
 * PLACEHOLDER: Retrieve trainings assigned to a specific employee.
 *
 * No endpoint for this currently exists in the FastAPI API (e.g. something
 * like `GET /employees/{employeeId}/trainings`). This function is left
 * as a clearly marked placeholder rather than guessing at a URL shape.
 *
 * Once the backend exposes an endpoint for this, implement it following
 * the same `request()` pattern used above, for example:
 *
 *   export async function getAssignedTrainings(employeeId) {
 *     return request(`/employees/${employeeId}/trainings`, { method: "GET" });
 *   }
 *
 * @param {string|number} employeeId
 * @throws {Error} Always throws until the backend endpoint is defined.
 */
export async function getAssignedTrainings(employeeId) {
  throw new Error(
    "getAssignedTrainings() is not yet implemented: no corresponding " +
      "FastAPI endpoint exists yet. Update api.js once the backend " +
      "exposes an endpoint for fetching an employee's assigned trainings."
  );
}

export { API_BASE_URL };

