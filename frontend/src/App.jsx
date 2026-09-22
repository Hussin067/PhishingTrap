import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Training from "./pages/Training";
import Results from "./pages/Results";
import MyTraining from "./pages/MyTraining";
import CompletedTraining from "./pages/CompletedTrainigs";
import Login from "./pages/Login";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login/>}/>
        <Route path="/" element = {<Navigate to = "/login" replace />}/>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/training/:trainingId" element={<Training />} />

        <Route path="/results" element={<Results />} />
        <Route path="/my-training" element={<MyTraining />} />
        <Route path="/completed-training" element={<CompletedTraining />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
