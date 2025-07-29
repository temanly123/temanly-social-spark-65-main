// Simple talent registration API endpoint
// This will store applications in localStorage for admin review

const handleTalentRegistration = (applicationData) => {
  try {
    console.log('📝 Processing talent registration:', applicationData.personalInfo.email);
    
    // Generate unique application ID
    const applicationId = 'app_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Add application metadata
    const processedApplication = {
      id: applicationId,
      ...applicationData,
      processedAt: new Date().toISOString(),
      status: 'pending_admin_review',
      adminNotes: '',
      reviewedBy: null,
      reviewedAt: null
    };
    
    // Store in localStorage (in a real app, this would go to a database)
    const existingApplications = JSON.parse(localStorage.getItem('talent-applications') || '[]');
    existingApplications.push(processedApplication);
    localStorage.setItem('talent-applications', JSON.stringify(existingApplications));
    
    // Also store in a separate admin queue
    const adminQueue = JSON.parse(localStorage.getItem('admin-talent-queue') || '[]');
    adminQueue.push({
      id: applicationId,
      name: applicationData.personalInfo.name,
      email: applicationData.personalInfo.email,
      phone: applicationData.personalInfo.phone,
      services: applicationData.services.selectedServices,
      submittedAt: applicationData.timestamp,
      status: 'pending',
      hasDocuments: applicationData.documents.hasIdCard && applicationData.documents.hasProfilePhoto
    });
    localStorage.setItem('admin-talent-queue', JSON.stringify(adminQueue));
    
    console.log('✅ Application stored successfully:', applicationId);
    
    return {
      success: true,
      applicationId: applicationId,
      message: 'Application submitted successfully',
      nextSteps: 'Admin will review your application within 1-2 business days'
    };
    
  } catch (error) {
    console.error('❌ Registration processing failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      fallback: 'Application data has been saved locally for manual processing'
    };
  }
};

// Export for use in the frontend
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { handleTalentRegistration };
} else if (typeof window !== 'undefined') {
  window.handleTalentRegistration = handleTalentRegistration;
}
