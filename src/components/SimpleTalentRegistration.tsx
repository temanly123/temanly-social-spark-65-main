import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface TalentData {
  // Basic Info
  name: string;
  email: string;
  phone: string;
  age: number;
  location: string;
  bio: string;
  zodiac: string;
  loveLanguage: string;

  // Service Availability
  availableServices: string[];
  rentLoverDetails: {
    available: boolean;
    dailyRate: number;
    includes: string[];
    description: string;
  };

  // Interests for dates
  dateInterests: string[];

  // Availability Schedule
  offlineDateAvailability: {
    weekdays: string[];
    timeSlots: string[];
  };
  partyBuddyAvailable: boolean;

  // Documents
  idCard: File | null;
  profilePhoto: File | null;
}

const SimpleTalentRegistration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Email validation states
  const [emailCheckStatus, setEmailCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle');
  const [emailCheckMessage, setEmailCheckMessage] = useState('');
  const [formData, setFormData] = useState<TalentData>({
    name: '',
    email: '',
    phone: '',
    age: 21,
    location: '',
    bio: '',
    zodiac: '',
    loveLanguage: '',
    availableServices: [],
    rentLoverDetails: {
      available: false,
      dailyRate: 85000,
      includes: [],
      description: ''
    },
    dateInterests: [],
    offlineDateAvailability: {
      weekdays: [],
      timeSlots: []
    },
    partyBuddyAvailable: false,
    idCard: null,
    profilePhoto: null
  });

  const serviceOptions = [
    'Chat (25k/hari)',
    'Call (40k/jam)',
    'Video Call (65k/jam)',
    'Offline Date (285k/3 jam)',
    'Party Buddy (1jt/event - 21+ only)'
  ];

  const rentLoverIncludes = [
    'Chat unlimited',
    'Voice note unlimited',
    'Phone call (max 30 menit/hari)',
    'Phone call (max 1 jam/hari)',
    'Video call (max 30 menit/hari)',
    'Video call (max 1 jam/hari)',
    'Good morning/night messages',
    'Panggilan nama sayang'
  ];

  const dateInterestOptions = [
    'Sushi Date',
    'Museum Date',
    'Picnic Date',
    'Movie Date',
    'Golf',
    'Tennis',
    'Shopping',
    'Coffee Date',
    'Dinner Date',
    'Karaoke',
    'Arcade Games',
    'Art Gallery',
    'Beach Walk',
    'Hiking',
    'Photography Walk'
  ];

  const weekdayOptions = [
    'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'
  ];

  const timeSlotOptions = [
    '09:00-12:00', '12:00-15:00', '15:00-18:00', '18:00-21:00', '21:00-24:00'
  ];

  const zodiacOptions = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];

  const loveLanguageOptions = [
    'Words of Affirmation',
    'Acts of Service', 
    'Receiving Gifts',
    'Quality Time',
    'Physical Touch'
  ];

  // Function to check if email already exists
  const checkEmailAvailability = async (email: string) => {
    if (!email || !email.includes('@')) {
      setEmailCheckStatus('idle');
      setEmailCheckMessage('');
      return;
    }

    setEmailCheckStatus('checking');
    setEmailCheckMessage('Memeriksa ketersediaan email...');

    try {
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('email, user_type, verification_status, status')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        console.error('Error checking email:', error);
        setEmailCheckStatus('error');
        setEmailCheckMessage('Gagal memeriksa email. Silakan coba lagi.');
        return;
      }

      if (profilesData) {
        // Email exists - check if it's for a different user type
        const existingUserType = profilesData.user_type;
        const requestedUserType = 'companion'; // This is talent registration

        if (existingUserType !== requestedUserType) {
          // Allow different user types with same email
          setEmailCheckStatus('available');
          setEmailCheckMessage('✅ Email tersedia untuk registrasi talent');
        } else {
          // Same user type
          const statusText = profilesData.verification_status === 'pending' ? 'sedang menunggu verifikasi' : 'sudah terverifikasi';
          setEmailCheckStatus('taken');
          setEmailCheckMessage(`❌ Email sudah terdaftar dan ${statusText}. Silakan login dengan akun yang sudah ada.`);
        }
      } else {
        // Email is available
        setEmailCheckStatus('available');
        setEmailCheckMessage('✅ Email tersedia');
      }
    } catch (error) {
      console.error('Error checking email availability:', error);
      setEmailCheckStatus('error');
      setEmailCheckMessage('Gagal memeriksa email. Silakan coba lagi.');
    }
  };

  // Effect to check email availability when email changes
  useEffect(() => {
    const email = formData.email;
    if (email && email.includes('@')) {
      // Debounce the email check
      const timeoutId = setTimeout(() => {
        checkEmailAvailability(email);
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setEmailCheckStatus('idle');
      setEmailCheckMessage('');
    }
  }, [formData.email]);

  const handleServiceChange = (service: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        availableServices: [...prev.availableServices, service]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        availableServices: prev.availableServices.filter(s => s !== service)
      }));
    }
  };

  const handleDateInterestChange = (interest: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        dateInterests: [...prev.dateInterests, interest]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        dateInterests: prev.dateInterests.filter(i => i !== interest)
      }));
    }
  };

  const handleWeekdayChange = (day: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        offlineDateAvailability: {
          ...prev.offlineDateAvailability,
          weekdays: [...prev.offlineDateAvailability.weekdays, day]
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        offlineDateAvailability: {
          ...prev.offlineDateAvailability,
          weekdays: prev.offlineDateAvailability.weekdays.filter(d => d !== day)
        }
      }));
    }
  };

  const handleTimeSlotChange = (slot: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        offlineDateAvailability: {
          ...prev.offlineDateAvailability,
          timeSlots: [...prev.offlineDateAvailability.timeSlots, slot]
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        offlineDateAvailability: {
          ...prev.offlineDateAvailability,
          timeSlots: prev.offlineDateAvailability.timeSlots.filter(s => s !== slot)
        }
      }));
    }
  };

  const handleRentLoverIncludeChange = (include: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        rentLoverDetails: {
          ...prev.rentLoverDetails,
          includes: [...prev.rentLoverDetails.includes, include]
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        rentLoverDetails: {
          ...prev.rentLoverDetails,
          includes: prev.rentLoverDetails.includes.filter(i => i !== include)
        }
      }));
    }
  };

  const handleFileChange = (field: 'idCard' | 'profilePhoto', file: File | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const submitToSupabase = async () => {
    try {
      console.log('📝 Starting simple talent registration...');
      console.log('📋 Form data:', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        hasIdCard: !!formData.idCard,
        hasProfilePhoto: !!formData.profilePhoto
      });

      // Generate unique user ID
      const userId = 'talent_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

      // Convert documents to base64 for storage
      let idCardBase64 = '';
      let profilePhotoBase64 = '';

      if (formData.idCard) {
        console.log('📄 Converting ID Card to base64...');
        idCardBase64 = await convertToBase64(formData.idCard);
      }

      if (formData.profilePhoto) {
        console.log('📸 Converting Profile Photo to base64...');
        profilePhotoBase64 = await convertToBase64(formData.profilePhoto);
      }

      // Store everything locally with base64 documents
      const registrationData = {
        id: userId,
        personalInfo: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          age: formData.age,
          location: formData.location,
          bio: formData.bio,
          zodiac: formData.zodiac,
          loveLanguage: formData.loveLanguage
        },
        services: {
          availableServices: formData.availableServices,
          rentLoverDetails: formData.rentLoverDetails,
          dateInterests: formData.dateInterests,
          offlineDateAvailability: formData.offlineDateAvailability,
          partyBuddyAvailable: formData.partyBuddyAvailable
        },
        documents: {
          hasIdCard: !!formData.idCard,
          hasProfilePhoto: !!formData.profilePhoto,
          idCard: idCardBase64, // Store base64 data
          profilePhoto: profilePhotoBase64, // Store base64 data
          idCardName: formData.idCard?.name,
          profilePhotoName: formData.profilePhoto?.name
        },
        timestamp: new Date().toISOString(),
        status: 'pending_admin_review',
        adminNotes: '',
        reviewedBy: null,
        reviewedAt: null
      };

      console.log('💾 Storing registration data locally...');
      console.log('📋 Registration data structure:', {
        id: registrationData.id,
        name: registrationData.personalInfo.name,
        email: registrationData.personalInfo.email,
        hasDocuments: {
          idCard: !!registrationData.documents.idCard,
          profilePhoto: !!registrationData.documents.profilePhoto
        },
        status: registrationData.status
      });

      // Store in localStorage for admin review
      const existingApplications = JSON.parse(localStorage.getItem('talent-applications') || '[]');
      existingApplications.push(registrationData);
      localStorage.setItem('talent-applications', JSON.stringify(existingApplications));

      // Also save documents to Supabase verification_documents table for admin review
      try {
        console.log('💾 Saving documents to Supabase...');

        // Create a temporary user ID for document storage
        const tempUserId = crypto.randomUUID();

        // Save ID Card document
        if (idCardBase64) {
          const { error: idCardError } = await supabase
            .from('verification_documents')
            .insert({
              user_id: tempUserId,
              document_type: 'id_card',
              document_url: idCardBase64,
              file_name: formData.idCard?.name || 'id_card.jpg',
              file_size: formData.idCard?.size || 0,
              content_type: formData.idCard?.type || 'image/jpeg',
              status: 'pending'
            });

          if (idCardError) {
            console.error('❌ Error saving ID card:', idCardError);
          } else {
            console.log('✅ ID card saved to database');
          }
        }

        // Save Profile Photo document
        if (profilePhotoBase64) {
          const { error: profileError } = await supabase
            .from('verification_documents')
            .insert({
              user_id: tempUserId,
              document_type: 'profile_photo',
              document_url: profilePhotoBase64,
              file_name: formData.profilePhoto?.name || 'profile_photo.jpg',
              file_size: formData.profilePhoto?.size || 0,
              content_type: formData.profilePhoto?.type || 'image/jpeg',
              status: 'pending'
            });

          if (profileError) {
            console.error('❌ Error saving profile photo:', profileError);
          } else {
            console.log('✅ Profile photo saved to database');
          }
        }

        // Store the temp user ID in the registration data for reference
        registrationData.tempUserId = tempUserId;

        // Update localStorage with the temp user ID
        const updatedApplications = existingApplications.map(app =>
          app.id === registrationData.id ? { ...app, tempUserId } : app
        );
        localStorage.setItem('talent-applications', JSON.stringify(updatedApplications));

        console.log('✅ Documents saved to database with temp user ID:', tempUserId);

      } catch (error) {
        console.error('❌ Error saving documents to database:', error);
        // Don't fail the registration if document save fails
      }

      console.log('✅ Registration data stored successfully!');

      // Show success message
      toast({
        title: "🎉 Pendaftaran Berhasil!",
        description: "Aplikasi Anda telah tersimpan. Tim kami akan menghubungi Anda dalam 1-2 hari kerja.",
        className: "bg-green-50 border-green-200"
      });

      // Redirect to success page after a short delay
      setTimeout(() => {
        navigate('/talent-register-success');
      }, 2000);

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        age: 21,
        location: '',
        bio: '',
        zodiac: '',
        loveLanguage: '',
        availableServices: [],
        rentLoverDetails: {
          available: false,
          dailyRate: 85000,
          includes: [],
          description: ''
        },
        dateInterests: [],
        offlineDateAvailability: {
          weekdays: [],
          timeSlots: []
        },
        partyBuddyAvailable: false,
        idCard: null,
        profilePhoto: null
      });

    } catch (error) {
      console.error('❌ Registration failed:', error);

      toast({
        title: "⚠️ Kesalahan",
        description: "Terjadi masalah saat menyimpan data. Silakan coba lagi.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if email is available
    if (emailCheckStatus === 'taken') {
      toast({
        title: "Email Tidak Tersedia",
        description: emailCheckMessage,
        variant: "destructive"
      });
      return;
    }

    if (emailCheckStatus === 'checking') {
      toast({
        title: "Tunggu Sebentar",
        description: "Masih memeriksa ketersediaan email. Silakan tunggu sebentar.",
        variant: "default"
      });
      return;
    }

    if (!formData.name || !formData.email || !formData.phone) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Mohon lengkapi nama, email, dan nomor telepon.",
        variant: "destructive"
      });
      return;
    }

    if (formData.age < 21) {
      toast({
        title: "Usia Minimum",
        description: "Usia minimum untuk menjadi talent Temanly adalah 21 tahun.",
        variant: "destructive"
      });
      return;
    }

    if (formData.availableServices.length === 0 && !formData.rentLoverDetails.available) {
      toast({
        title: "Pilih Layanan",
        description: "Mohon pilih minimal satu layanan atau aktifkan Rent a Lover.",
        variant: "destructive"
      });
      return;
    }

    if (formData.availableServices.includes('Party Buddy (1jt/event - 21+ only)') && formData.age < 21) {
      toast({
        title: "Party Buddy 21+",
        description: "Layanan Party Buddy hanya untuk talent berusia 21+ tahun.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.idCard || !formData.profilePhoto) {
      toast({
        title: "Upload Dokumen",
        description: "Mohon upload foto KTP dan foto profil untuk verifikasi.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    await submitToSupabase();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              🌟 Daftar Sebagai Talent Temanly
            </CardTitle>
            <p className="text-gray-600">
              Bergabunglah dengan komunitas companion terbaik di Indonesia
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">👤 Informasi Dasar</h3>
                
                <div>
                  <Label htmlFor="name">Nama Lengkap *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Masukkan nama lengkap Anda"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@example.com"
                      className={`${
                        emailCheckStatus === 'taken' ? 'border-red-500 focus:border-red-500 focus:ring-red-500' :
                        emailCheckStatus === 'available' ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : ''
                      }`}
                      required
                    />
                    {emailCheckStatus !== 'idle' && (
                      <div className={`text-sm mt-1 ${
                        emailCheckStatus === 'taken' ? 'text-red-500' :
                        emailCheckStatus === 'available' ? 'text-green-500' :
                        emailCheckStatus === 'checking' ? 'text-blue-500' : 'text-gray-500'
                      }`}>
                        {emailCheckMessage}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Nomor WhatsApp *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="08xxxxxxxxxx"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="age">Usia (Minimum 21 tahun) *</Label>
                    <Input
                      id="age"
                      type="number"
                      min="21"
                      max="30"
                      value={formData.age}
                      onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 21 }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Kota *</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Jakarta, Surabaya, Bandung, dll"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">✨ Detail Personal</h3>
                
                <div>
                  <Label htmlFor="bio">Bio Singkat</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Ceritakan sedikit tentang diri Anda..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Zodiak</Label>
                    <Select value={formData.zodiac} onValueChange={(value) => setFormData(prev => ({ ...prev, zodiac: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih zodiak" />
                      </SelectTrigger>
                      <SelectContent>
                        {zodiacOptions.map(zodiac => (
                          <SelectItem key={zodiac} value={zodiac}>{zodiac}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Love Language</Label>
                    <Select value={formData.loveLanguage} onValueChange={(value) => setFormData(prev => ({ ...prev, loveLanguage: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih love language" />
                      </SelectTrigger>
                      <SelectContent>
                        {loveLanguageOptions.map(lang => (
                          <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Available Services */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">🎯 Layanan yang Tersedia *</h3>
                <p className="text-sm text-gray-600">Pilih layanan yang ingin Anda tawarkan (tarif sudah ditetapkan Temanly)</p>
                <div className="space-y-3">
                  {serviceOptions.map(service => (
                    <div key={service} className="flex items-center space-x-2 p-3 border rounded-lg">
                      <Checkbox
                        id={service}
                        checked={formData.availableServices.includes(service)}
                        onCheckedChange={(checked) => handleServiceChange(service, checked as boolean)}
                      />
                      <Label htmlFor={service} className="text-sm font-medium">{service}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rent a Lover Package */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">💕 Rent a Lover (Paket Romantis)</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rentLoverAvailable"
                    checked={formData.rentLoverDetails.available}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      rentLoverDetails: { ...prev.rentLoverDetails, available: checked as boolean }
                    }))}
                  />
                  <Label htmlFor="rentLoverAvailable" className="font-medium">Saya tersedia untuk layanan Rent a Lover</Label>
                </div>

                {formData.rentLoverDetails.available && (
                  <div className="space-y-4 p-4 bg-pink-50 rounded-lg">
                    <div>
                      <Label htmlFor="rentLoverRate">Tarif Harian (Maksimal 85k/hari)</Label>
                      <Input
                        id="rentLoverRate"
                        type="number"
                        min="50000"
                        max="85000"
                        step="5000"
                        value={formData.rentLoverDetails.dailyRate}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          rentLoverDetails: { ...prev.rentLoverDetails, dailyRate: parseInt(e.target.value) || 85000 }
                        }))}
                      />
                    </div>

                    <div>
                      <Label>Yang Termasuk dalam Paket:</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {rentLoverIncludes.map(include => (
                          <div key={include} className="flex items-center space-x-2">
                            <Checkbox
                              id={include}
                              checked={formData.rentLoverDetails.includes.includes(include)}
                              onCheckedChange={(checked) => handleRentLoverIncludeChange(include, checked as boolean)}
                            />
                            <Label htmlFor={include} className="text-sm">{include}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="rentLoverDescription">Deskripsi Paket Anda</Label>
                      <Textarea
                        id="rentLoverDescription"
                        value={formData.rentLoverDetails.description}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          rentLoverDetails: { ...prev.rentLoverDetails, description: e.target.value }
                        }))}
                        placeholder="Contoh: Chat unlimited, voice note unlimited, phone call max 1 jam/hari, good morning/night messages..."
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Date Interests */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">🎭 Minat untuk Date</h3>
                <p className="text-sm text-gray-600">Pilih aktivitas yang Anda sukai untuk offline date</p>
                <div className="grid grid-cols-3 gap-2">
                  {dateInterestOptions.map(interest => (
                    <div key={interest} className="flex items-center space-x-2">
                      <Checkbox
                        id={interest}
                        checked={formData.dateInterests.includes(interest)}
                        onCheckedChange={(checked) => handleDateInterestChange(interest, checked as boolean)}
                      />
                      <Label htmlFor={interest} className="text-sm">{interest}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Offline Date Availability */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">📅 Ketersediaan Offline Date</h3>
                <p className="text-sm text-gray-600">Atur jadwal ketersediaan Anda untuk offline date</p>

                <div>
                  <Label className="font-medium">Hari yang Tersedia:</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {weekdayOptions.map(day => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox
                          id={day}
                          checked={formData.offlineDateAvailability.weekdays.includes(day)}
                          onCheckedChange={(checked) => handleWeekdayChange(day, checked as boolean)}
                        />
                        <Label htmlFor={day} className="text-sm">{day}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="font-medium">Jam yang Tersedia:</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {timeSlotOptions.map(slot => (
                      <div key={slot} className="flex items-center space-x-2">
                        <Checkbox
                          id={slot}
                          checked={formData.offlineDateAvailability.timeSlots.includes(slot)}
                          onCheckedChange={(checked) => handleTimeSlotChange(slot, checked as boolean)}
                        />
                        <Label htmlFor={slot} className="text-sm">{slot}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Party Buddy Availability */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">🎉 Party Buddy (21+ Only)</h3>
                <div className="flex items-center space-x-2 p-3 border rounded-lg bg-purple-50">
                  <Checkbox
                    id="partyBuddyAvailable"
                    checked={formData.partyBuddyAvailable}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, partyBuddyAvailable: checked as boolean }))}
                    disabled={formData.age < 21}
                  />
                  <Label htmlFor="partyBuddyAvailable" className="font-medium">
                    Saya tersedia untuk Party Buddy (1jt/event, 8 malam - 4 pagi)
                    {formData.age < 21 && <span className="text-red-500 ml-2">(Minimum 21 tahun)</span>}
                  </Label>
                </div>
                {formData.partyBuddyAvailable && (
                  <div className="p-3 bg-purple-50 rounded-lg text-sm text-purple-700">
                    <p><strong>Party Buddy:</strong> Menemani pesta/event malam (8 malam - 4 pagi)</p>
                    <p><strong>Tarif:</strong> IDR 1.000.000/event (sudah termasuk transport)</p>
                    <p><strong>Syarat:</strong> Usia minimum 21 tahun, terbiasa dengan nightlife</p>
                  </div>
                )}
              </div>

              {/* Documents */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">📄 Upload Dokumen Verifikasi *</h3>
                <p className="text-sm text-gray-600">Upload KTP dan foto profil untuk verifikasi identitas</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="idCard">Foto KTP *</Label>
                    <Input
                      id="idCard"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('idCard', e.target.files?.[0] || null)}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="profilePhoto">Foto Profil *</Label>
                    <Input
                      id="profilePhoto"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('profilePhoto', e.target.files?.[0] || null)}
                      required
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || emailCheckStatus === 'taken' || emailCheckStatus === 'checking'}
              >
                {loading ? '⏳ Mengirim...' :
                 emailCheckStatus === 'checking' ? '🔍 Memeriksa Email...' :
                 emailCheckStatus === 'taken' ? '❌ Email Tidak Tersedia' :
                 '🚀 Daftar Sekarang'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SimpleTalentRegistration;
