import { useAuth } from "../../contexts/AuthContext";
import { User, Mail, Phone, Briefcase, LogOut } from "lucide-react";

export default function EmployeeProfile() {
  const { employeeData, signOut } = useAuth();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center">
        <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
          {employeeData?.name?.charAt(0) || "E"}
        </div>
        <h1 className="text-xl font-bold text-gray-900">{employeeData?.name || "Employee Name"}</h1>
        <p className="text-gray-500 text-sm">{employeeData?.employee_code || "EMP000"}</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500">
            <Briefcase size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-500">Role</div>
            <div className="font-medium text-gray-900 capitalize">{employeeData?.role || "Employee"}</div>
          </div>
        </div>
        <div className="p-4 border-b border-gray-50 flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500">
            <User size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-500">Department</div>
            <div className="font-medium text-gray-900">Operations</div>
          </div>
        </div>
        <div className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500">
            <Phone size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-500">Phone</div>
            <div className="font-medium text-gray-900">081-234-5678</div>
          </div>
        </div>
      </div>

      <button
        onClick={signOut}
        className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:bg-red-100 transition-colors"
      >
        <LogOut size={20} />
        Sign Out
      </button>
    </div>
  );
}
