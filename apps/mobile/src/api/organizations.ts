import { apiClient } from './client';

export interface OrgMember {
  id: string;
  userId: string;
  role: string;
  invitedAt: string;
  acceptedAt: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export const organizationsApi = {
  update: async (orgId: string, data: { name: string }) => {
    const { data: result } = await apiClient.patch(`/organizations/${orgId}`, data);
    return result;
  },

  getMembers: async (orgId: string): Promise<OrgMember[]> => {
    const { data } = await apiClient.get(`/organizations/${orgId}/members`);
    return data;
  },

  inviteMember: async (orgId: string, email: string, role: string = 'CREW') => {
    const { data } = await apiClient.post(`/organizations/${orgId}/members/invite`, {
      email,
      role,
    });
    return data;
  },

  removeMember: async (orgId: string, memberId: string): Promise<void> => {
    await apiClient.delete(`/organizations/${orgId}/members/${memberId}`);
  },

  updateMemberRole: async (orgId: string, memberId: string, role: string) => {
    const { data } = await apiClient.patch(`/organizations/${orgId}/members/${memberId}`, { role });
    return data;
  },
};
