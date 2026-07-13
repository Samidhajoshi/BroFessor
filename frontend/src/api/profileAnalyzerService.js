import axiosClient from './axiosClient';

export const analyzeProfile = () =>
  axiosClient.post('/profile/analyze');

export const getLatestAnalysis = () =>
  axiosClient.get('/profile/analysis/latest');

export const getAnalysisHistory = () =>
  axiosClient.get('/profile/analysis/history');
