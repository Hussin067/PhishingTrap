import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Training from "./pages/Training";
import Results from "./pages/Results";
import MyTraining from "./pages/MyTraining";
import CompletedTraining from "./pages/CompletedTrainigs";
import Login from "./pages/Login";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEmployees from "./pages/admin/AdminEmployees";
import AdminEmployeeDetail from "./pages/admin/AdminEmployeeDetail";
import AdminCampaigns from "./pages/admin/AdminCampaigns";
import AdminCampaignNew from "./pages/admin/AdminCampaignNew";
import AdminCampaignDetail from "./pages/admin/AdminCampaignDetail";

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

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="employees" element={<AdminEmployees />} />
          <Route path="employees/:employeeId" element={<AdminEmployeeDetail />} />
          <Route path="campaigns" element={<AdminCampaigns />} />
          <Route path="campaigns/new" element={<AdminCampaignNew />} />
          <Route path="campaigns/:campaignId" element={<AdminCampaignDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
