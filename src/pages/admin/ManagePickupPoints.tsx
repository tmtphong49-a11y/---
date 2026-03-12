import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Plus, Edit2, Trash2, Search, MapPin } from "lucide-react";
import toast from "react-hot-toast";

export default function ManagePickupPoints() {
  const [pickupPoints, setPickupPoints] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<any>(null);
  const [pickupName, setPickupName] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: routesData, error: routesError } = await supabase
        .from('routes')
        .select('*')
        .order('route_name', { ascending: true });

      if (routesError) throw routesError;
      setRoutes(routesData || []);

      const { data: pointsData, error: pointsError } = await supabase
        .from('pickup_points')
        .select('*, route:routes(*)')
        .order('pickup_name', { ascending: true });

      if (pointsError) throw pointsError;
      setPickupPoints(pointsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch pickup points");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPoint) {
        const { error } = await supabase
          .from('pickup_points')
          .update({
            pickup_name: pickupName,
            route_id: selectedRouteId,
          })
          .eq('id', editingPoint.id);

        if (error) throw error;
        
        setPickupPoints(
          pickupPoints.map((p) =>
            p.id === editingPoint.id
              ? {
                  ...p,
                  pickup_name: pickupName,
                  route_id: selectedRouteId,
                  route: routes.find((r) => r.id === selectedRouteId),
                }
              : p,
          ),
        );
        toast.success("Pickup point updated");
      } else {
        const { data, error } = await supabase
          .from('pickup_points')
          .insert([{
            pickup_name: pickupName,
            route_id: selectedRouteId,
          }])
          .select('*, route:routes(*)')
          .single();

        if (error) throw error;
        
        if (data) {
          setPickupPoints([data, ...pickupPoints]);
          toast.success("Pickup point added");
        }
      }
      closeModal();
    } catch (error) {
      console.error("Error saving pickup point:", error);
      toast.error("Failed to save pickup point");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this pickup point?")) {
      try {
        const { error } = await supabase
          .from('pickup_points')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        setPickupPoints(pickupPoints.filter((p) => p.id !== id));
        toast.success("Pickup point deleted");
      } catch (error) {
        console.error("Error deleting pickup point:", error);
        toast.error("Failed to delete pickup point");
      }
    }
  };

  const openModal = (point: any = null) => {
    setEditingPoint(point);
    setPickupName(point ? point.pickup_name : "");
    setSelectedRouteId(point ? point.route_id : routes[0]?.id || "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPoint(null);
    setPickupName("");
  };

  const filteredPoints = pickupPoints.filter(
    (p) =>
      p.pickup_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.route?.route_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Manage Pickup Points
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Configure boarding locations for each route
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} />
          Add Point
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search pickup points or routes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto hidden lg:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Pickup Point</th>
                <th className="p-4 font-medium">Route</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPoints.map((point) => (
                <tr
                  key={point.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-indigo-600" />
                      <span className="font-medium text-gray-900">
                        {point.pickup_name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">
                    <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-sm font-medium">
                      {point.route?.route_name}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openModal(point)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(point.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden divide-y divide-gray-100">
          {filteredPoints.map((point) => (
            <div key={point.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-indigo-600" />
                  <span className="font-medium text-gray-900 text-lg">
                    {point.pickup_name}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openModal(point)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(point.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-500 ml-6">
                <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-medium">
                  {point.route?.route_name}
                </span>
              </div>
            </div>
          ))}
          {filteredPoints.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No pickup points found
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingPoint ? "Edit Pickup Point" : "Add New Pickup Point"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Route
                </label>
                <select
                  required
                  value={selectedRouteId}
                  onChange={(e) => setSelectedRouteId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" disabled>
                    Select a route
                  </option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.route_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pickup Name
                </label>
                <input
                  type="text"
                  required
                  value={pickupName}
                  onChange={(e) => setPickupName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. ตลาดสระบุรี"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
