
// Environment configuration for production deployment
export const ENV = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://enyrffgedfvgunokpmqk.supabase.co',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueXJmZmdlZGZ2Z3Vub2twbXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzMwMTIsImV4cCI6MjA2NTU0OTAxMn0.Wz--lkPdrmaT6nO7_JMRfC7oWJQqhajjcNNQThV1DD8',
  MIDTRANS_CLIENT_KEY: import.meta.env.VITE_MIDTRANS_CLIENT_KEY || 'Mid-client-t14R0G6XRLw9MLZj',
  MIDTRANS_SERVER_KEY: import.meta.env.VITE_MIDTRANS_SERVER_KEY || 'Mid-server-your-server-key-here'
};

export const getEnvVar = (key: keyof typeof ENV): string => {
  return ENV[key];
};
