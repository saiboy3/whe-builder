const BASE = 'http://localhost:3001/api'

function getToken() {
  return localStorage.getItem('whe_token') ?? ''
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? 'Request failed')
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: { id: string; name: string; email: string; role: string } }>('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),

  projects: {
    list: () => request<any[]>('/projects'),
    get: (id: string) => request<any>(`/projects/${id}`),
    create: (data: any) => request<any>('/projects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/projects/${id}`, { method: 'DELETE' }),
  },

  wbs: {
    list: (projectId: string) => request<any[]>(`/wbs/project/${projectId}`),
    create: (projectId: string, data: any) => request<any>(`/wbs/project/${projectId}`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/wbs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    updateHours: (id: string, entries: any[]) => request<any>(`/wbs/${id}/hours`, { method: 'PUT', body: JSON.stringify({ entries }) }),
    delete: (id: string) => request<void>(`/wbs/${id}`, { method: 'DELETE' }),
    cloneTemplate: (projectId: string, templateId: string) =>
      request<any>(`/wbs/project/${projectId}/clone-template/${templateId}`, { method: 'POST' }),
  },

  templates: {
    list: () => request<any[]>('/templates'),
    get: (id: string) => request<any>(`/templates/${id}`),
    create: (data: any) => request<any>('/templates', { method: 'POST', body: JSON.stringify(data) }),
    lock: (id: string) => request<any>(`/templates/${id}/lock`, { method: 'PUT' }),
    delete: (id: string) => request<void>(`/templates/${id}`, { method: 'DELETE' }),
  },

  approvals: {
    list: (projectId: string) => request<any[]>(`/approvals/project/${projectId}`),
    submit: (projectId: string, comments?: string) =>
      request<any>(`/approvals/project/${projectId}/submit`, { method: 'POST', body: JSON.stringify({ comments }) }),
    approve: (projectId: string, comments?: string) =>
      request<any>(`/approvals/project/${projectId}/approve`, { method: 'POST', body: JSON.stringify({ comments }) }),
    reject: (projectId: string, comments?: string) =>
      request<any>(`/approvals/project/${projectId}/reject`, { method: 'POST', body: JSON.stringify({ comments }) }),
  },

  historical: {
    list: (filters?: Record<string, string>) => request<any[]>('/historical' + (filters ? '?' + new URLSearchParams(filters) : '')),
    varianceSummary: () => request<any[]>('/historical/variance-summary'),
    similar: (filters: Record<string, string>) => request<any[]>('/historical/similar?' + new URLSearchParams(filters)),
  },

  exports: {
    list: (projectId: string) => request<any[]>(`/exports/project/${projectId}`),
    log: (projectId: string, format: string) =>
      request<any>(`/exports/project/${projectId}`, { method: 'POST', body: JSON.stringify({ format }) }),
  },
}
