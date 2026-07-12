import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../api/users';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useAuthStore } from '../../store/authStore';
import { Plus, Trash2, Users, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const UserManagement = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    role_name: 'driver'
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getUsers(),
    select: (res) => res.data
  });

  const createMutation = useMutation({
    mutationFn: (data) => usersApi.createUser(data),
    onSuccess: () => {
      toast.success('User account created successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
      setFormData({ email: '', full_name: '', password: '', role_name: 'driver' });
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to create user');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => usersApi.deleteUser(id),
    onSuccess: () => {
      toast.success('User account deleted');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to delete user');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleDelete = (id, email) => {
    if (window.confirm(`Are you sure you want to delete ${email}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const canDelete = user?.role === 'Admin' || user?.role === 'admin' || user?.role_name === 'admin';

  return (
    <div className="text-left animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-gray-500">
            Administration / Team
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-uber-black uppercase">
            User Management
          </h2>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5">
          <Plus size={16} /> New User
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <h4 className="font-extrabold uppercase text-xs tracking-wider text-gray-500 flex items-center gap-1.5">
            <Users size={16} /> System Users
          </h4>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12"><Loader2 className="animate-spin text-uber-black" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-400 font-extrabold">
                  <tr>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-uber-gray-200">
                  {users?.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-uber-black">{u.full_name}</td>
                      <td className="py-3 px-4 text-gray-600 font-semibold">{u.email}</td>
                      <td className="py-3 px-4">
                        <Badge status={u.role === 'Admin' || u.role === 'admin' ? 'success' : 'default'}>{u.role}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {canDelete && u.email !== user?.email && (
                          <button
                            onClick={() => handleDelete(u.id, u.email)}
                            className="text-gray-400 hover:text-uber-red transition-colors p-1"
                            title="Delete User"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create User Account"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Full Name</label>
            <input 
              required
              type="text" 
              className="p-3 border rounded-xl text-sm" 
              placeholder="e.g. John Doe"
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Email Address</label>
            <input 
              required
              type="email" 
              className="p-3 border rounded-xl text-sm" 
              placeholder="e.g. driver@transitops.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Password</label>
            <input 
              required
              type="password" 
              className="p-3 border rounded-xl text-sm" 
              placeholder="Enter secure password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">System Role</label>
            <select 
              className="p-3 border rounded-xl text-sm bg-white"
              value={formData.role_name}
              onChange={(e) => setFormData({...formData, role_name: e.target.value})}
              disabled={user?.role === 'Fleet Manager' || user?.role === 'fleet_manager' || user?.role_name === 'fleet_manager'}
            >
              <option value="driver">Driver</option>
              {(user?.role === 'Admin' || user?.role === 'admin' || user?.role_name === 'admin') && (
                <>
                  <option value="fleet_manager">Fleet Manager</option>
                  <option value="safety_officer">Safety Officer</option>
                  <option value="financial_analyst">Financial Analyst</option>
                  <option value="admin">System Admin</option>
                </>
              )}
            </select>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
