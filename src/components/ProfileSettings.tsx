
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Camera, Shield, Bell, Lock, CreditCard, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProfileSettingsProps {
  userType: 'user' | 'companion' | 'admin';
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ userType }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: '',
    location: '',
    birthDate: '',
    gender: '',
    profileImage: ''
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    marketingEmails: false
  });

  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    showOnlineStatus: true,
    allowMessages: true,
    showLastSeen: false
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File terlalu besar",
          description: "Ukuran file maksimal 5MB",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfile(prev => ({ ...prev, profileImage: result }));
        toast({
          title: "Foto berhasil diupload",
          description: "Foto profil Anda telah diperbarui",
          className: "bg-green-50 border-green-200"
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async () => {
    setIsLoading(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Profil Berhasil Diperbarui",
        description: "Profil Anda telah berhasil diperbarui.",
        className: "bg-green-50 border-green-200"
      });
    } catch (error) {
      toast({
        title: "Gagal Memperbarui",
        description: "Gagal memperbarui profil. Silakan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    toast({
      title: "Ubah Password",
      description: "Fitur ubah password akan segera tersedia.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Informasi Profil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Image */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center relative overflow-hidden">
              {profile.profileImage ? (
                <img 
                  src={profile.profileImage} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover" 
                />
              ) : (
                <Camera className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="profile-image-upload"
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => document.getElementById('profile-image-upload')?.click()}
              >
                Ubah Foto
              </Button>
              <p className="text-sm text-gray-500 mt-1">JPG, PNG maks 5MB</p>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile(prev => ({...prev, name: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile(prev => ({...prev, email: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Nomor Telepon</Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile(prev => ({...prev, phone: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Lokasi</Label>
              <Input
                id="location"
                value={profile.location}
                onChange={(e) => setProfile(prev => ({...prev, location: e.target.value}))}
                placeholder="Kota, Negara"
              />
            </div>
          </div>

          {userType === 'companion' && (
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile(prev => ({...prev, bio: e.target.value}))}
                placeholder="Ceritakan tentang diri Anda..."
                rows={4}
              />
            </div>
          )}

          <Button onClick={handleProfileUpdate} disabled={isLoading}>
            {isLoading ? 'Memperbarui...' : 'Perbarui Profil'}
          </Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Keamanan & Verifikasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Verifikasi Email</p>
              <p className="text-sm text-gray-500">Verifikasi alamat email Anda</p>
            </div>
            <Badge className={user?.verified ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}>
              {user?.verified ? 'Terverifikasi' : 'Menunggu'}
            </Badge>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Ubah Password</p>
              <p className="text-sm text-gray-500">Perbarui password akun Anda</p>
            </div>
            <Button variant="outline" onClick={handlePasswordChange}>
              Ubah
            </Button>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Autentikasi Dua Faktor</p>
              <p className="text-sm text-gray-500">Tambahkan lapisan keamanan ekstra</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Preferensi Notifikasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notifikasi Email</p>
              <p className="text-sm text-gray-500">Terima pembaruan via email</p>
            </div>
            <Switch 
              checked={notifications.emailNotifications}
              onCheckedChange={(checked) => setNotifications(prev => ({...prev, emailNotifications: checked}))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notifikasi Push</p>
              <p className="text-sm text-gray-500">Dapatkan notifikasi di perangkat Anda</p>
            </div>
            <Switch 
              checked={notifications.pushNotifications}
              onCheckedChange={(checked) => setNotifications(prev => ({...prev, pushNotifications: checked}))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notifikasi SMS</p>
              <p className="text-sm text-gray-500">Terima pembaruan penting via SMS</p>
            </div>
            <Switch 
              checked={notifications.smsNotifications}
              onCheckedChange={(checked) => setNotifications(prev => ({...prev, smsNotifications: checked}))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Marketing</p>
              <p className="text-sm text-gray-500">Terima konten promosi</p>
            </div>
            <Switch 
              checked={notifications.marketingEmails}
              onCheckedChange={(checked) => setNotifications(prev => ({...prev, marketingEmails: checked}))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Pengaturan Privasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Visibilitas Profil</p>
              <p className="text-sm text-gray-500">Buat profil Anda terlihat oleh orang lain</p>
            </div>
            <Switch 
              checked={privacy.profileVisible}
              onCheckedChange={(checked) => setPrivacy(prev => ({...prev, profileVisible: checked}))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Tampilkan Status Online</p>
              <p className="text-sm text-gray-500">Biarkan orang lain melihat kapan Anda online</p>
            </div>
            <Switch 
              checked={privacy.showOnlineStatus}
              onCheckedChange={(checked) => setPrivacy(prev => ({...prev, showOnlineStatus: checked}))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Izinkan Pesan</p>
              <p className="text-sm text-gray-500">Terima pesan dari pengguna lain</p>
            </div>
            <Switch 
              checked={privacy.allowMessages}
              onCheckedChange={(checked) => setPrivacy(prev => ({...prev, allowMessages: checked}))}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSettings;
